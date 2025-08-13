import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import RNFS from "react-native-fs";
import { initLlama, releaseAllLlama } from "llama.rn";
import { normalizeArabicText } from "../services/arabicDateNormalizer";
import { useMeetingContext } from "../context/MeetingContext";
import CustomCard from "../components/CustomCard";
import AudioPlayer from "../components/AudioPlayer";
import colors from "../config/colors";
import { safeReleaseWhisper } from "../services/whisperInstance";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

// -----------------------------
// Model Configuration
// -----------------------------
const MODEL_FILE = "qwen2.5-3b-instruct-q4_k_m.gguf";
const MODEL_URL = `https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/${MODEL_FILE}`;

// -----------------------------
// Helper Functions
// -----------------------------
const validateDatesEnhanced = (dates) => {
  console.log("🔍 Validating dates input:", dates);

  if (!Array.isArray(dates)) {
    console.log("❌ Input is not an array:", typeof dates);
    return [];
  }

  const validated = dates.map((item, index) => {
    console.log(`🔍 Validating item ${index}:`, item);

    // Validate date
    let validDate;
    if (
      item.date &&
      typeof item.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    ) {
      const dateObj = new Date(item.date);
      if (!isNaN(dateObj.getTime())) {
        validDate = item.date;
      }
    }

    if (!validDate) {
      validDate = new Date().toISOString().split("T")[0];
      console.log(`⚠️ Invalid date for item ${index}, using today:`, validDate);
    }

    // Validate time
    let validTime = "00:00";
    if (
      item.time &&
      typeof item.time === "string" &&
      /^\d{2}:\d{2}$/.test(item.time)
    ) {
      validTime = item.time;
    }

    // Validate title
    let validTitle = "مهمة";
    if (item.title && typeof item.title === "string" && item.title.trim()) {
      validTitle = item.title.toString().trim();
      // Limit title length
      if (validTitle.length > 80) {
        validTitle = validTitle.substring(0, 77) + "...";
      }
    }

    return {
      date: validDate,
      time: validTime,
      title: validTitle,
    };
  });

  console.log("✅ Final validated dates:", validated);
  return validated;
};

// Find all dates with regex
const findAllDatesInText = (text) => {
  const dateRegex = /\d{4}-\d{2}-\d{2}/g;
  const dates = [...new Set(text.match(dateRegex) || [])]; // Remove duplicates
  console.log("📅 All dates found in text:", dates);
  return dates;
};

// Create context for a date
const createContextForDate = (text, date) => {
  const dateIndex = text.indexOf(date);
  if (dateIndex === -1) return "";

  const contextStart = Math.max(0, dateIndex - 150);
  const contextEnd = Math.min(text.length, dateIndex + 150);
  return text.substring(contextStart, contextEnd);
};

// If LLM misses a date, create a default task the user can edit
const fillDefaultsForMissed = (missed) => {
  if (!Array.isArray(missed)) return [];
  return missed.map((m) => {
    const date = typeof m === "string" ? m : m?.date;
    return {
      date: /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : new Date().toISOString().split("T")[0],
      time: "00:00",
      title: "مهمة",
    };
  });
};

// Enhanced JSON parsing with multiple strategies
const safeParseArrayEnhanced = (str) => {
  if (!str) {
    console.log("❌ Empty string provided to parser");
    return [];
  }

  console.log("🔍 Attempting to parse:", str.substring(0, 200) + "...");

  const tryParse = (s) => {
    try {
      const parsed = JSON.parse(s.trim());
      if (Array.isArray(parsed)) {
        console.log(
          "✅ Successfully parsed array with",
          parsed.length,
          "items"
        );
        return parsed;
      }
      console.log("⚠️ Parsed but not an array:", typeof parsed);
      return null;
    } catch (error) {
      console.log("❌ Parse failed:", error.message.substring(0, 50));
      return null;
    }
  };

  // Strategy 1: Direct JSON parse
  let result = tryParse(str);
  if (result) return result;

  // Strategy 2: Extract from code blocks (supports ```json ... ``` and ` ... `)
  const codeBlockPatterns = [/```(?:json)?([\s\S]*?)```/gi, /`([\s\S]*?)`/gi];

  for (const pattern of codeBlockPatterns) {
    let m;
    while ((m = pattern.exec(str)) !== null) {
      const inner = (m[1] || "").trim();
      if (!inner) continue;
      const parsed = tryParse(inner);
      if (parsed) {
        console.log("✅ Success with code block extraction");
        return parsed;
      }
    }
  }

  // Strategy 3: Extract JSON array patterns
  const arrayPatterns = [/\[[\s\S]*?\]/g];

  for (const regex of arrayPatterns) {
    const matches = str.match(regex);
    if (matches) {
      for (const match of matches) {
        result = tryParse(match);
        if (result) {
          console.log("✅ Success with array pattern extraction");
          return result;
        }
      }
    }
  }

  console.log("❌ All parsing strategies failed");
  return [];
};

// Split text into chunks for processing
const splitTextIntoChunks = (text, maxChunkSize = 1200) => {
  const chunks = [];
  const sentences = text.split(/[.؟!]/).filter((s) => s.trim().length > 10);

  let currentChunk = "";

  for (const sentence of sentences) {
    if (
      currentChunk.length + sentence.length > maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ". " : "") + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  console.log(`📝 Text split into ${chunks.length} chunks`);
  return chunks;
};

// Optimized date extraction with only 2 LLM calls
const extractDatesOptimized = async (ctx, normalizedText) => {
  try {
    console.log("📝 Starting optimized date extraction (2 calls max)...");

    // Find all dates first
    const allFoundDates = findAllDatesInText(normalizedText);

    if (allFoundDates.length === 0) {
      console.log("⚠️ No dates found in text");
      return { extractedDates: [], missedDates: [] };
    }

    let allExtractedDates = [];

    // FIRST CALL: Process full text or in chunks
    console.log("🔄 CALL 1: Processing text for date extraction...");

    if (normalizedText.length <= 1500) {
      // Process full text if small enough
      const datesRes = await ctx.completion({
        messages: [
          {
            role: "system",
            content: `أنت خبير في استخراج التواريخ من النصوص العربية.

المهمة:
1. ابحث عن كل تاريخ بصيغة YYYY-MM-DD
2. لكل تاريخ، اكتب مهمة وصفية قصيرة (15-40 كلمة) تشرح ماذا يحدث في هذا التاريخ
3.لكل تاريخ، استخرج كل "مهمة" مذكورة (قد توجد عدة مهام في نفس التاريخ).
4. إذا لم تجد وقت محدد، استخدم "00:00
5. أنشئ عنصر JSON مستقل لكل مهمة حتى لو تكرر التاريخ.
"

التواريخ المتوقعة في النص: ${allFoundDates.join(", ")}

الإخراج المطلوب - JSON فقط:
[
  {"date": "YYYY-MM-DD", "time": "HH:MM", "title": "وصف المهمة"},
  {"date": "YYYY-MM-DD", "time": "HH:MM", "title": "وصف المهمة"}
]

قواعد صارمة:
- JSON صحيح فقط، لا نصوص إضافية
- ركز على التواريخ المذكورة أعلاه
- عناوين المهام واضحة ومفيدة`,
          },
          {
            role: "user",
            content: `استخرج التواريخ والمهام من النص:\n\n${normalizedText}`,
          },
        ],
        temperature: 0.05,
        n_predict: 600,
        stop: ["\n\n", "```", "---", "<|im_end|>"],
        top_p: 0.8,
        top_k: 30,
      });

      allExtractedDates = safeParseArrayEnhanced(datesRes.text);
    } else {
      // Process in chunks - but still count as one "call" conceptually
      const chunks = splitTextIntoChunks(normalizedText, 1200);

      for (const chunk of chunks) {
        const chunkDates = findAllDatesInText(chunk);

        if (chunkDates.length > 0) {
          const chunkRes = await ctx.completion({
            messages: [
              {
                role: "system",
                content: `أنت خبير في استخراج التواريخ من النصوص العربية.

المهمة:
1. ابحث عن كل تاريخ بصيغة YYYY-MM-DD
2. لكل تاريخ، اكتب مهمة وصفية قصيرة (15-40 كلمة)
3. إذا لم تجد وقت محدد، استخدم "00:00"
4. لكل تاريخ، استخرج جميع المهام المذكورة (قد توجد عدة مهام في نفس التاريخ).
5. أنشئ عنصر JSON لكل مهمة حتى لو تكرر التاريخ.

التواريخ في هذا الجزء: ${chunkDates.join(", ")}

الإخراج المطلوب - JSON فقط:
[
  {"date": "YYYY-MM-DD", "time": "HH:MM", "title": "وصف المهمة"}
]

قواعد صارمة:
- JSON صحيح فقط
- ركز على التواريخ المذكورة أعلاه`,
              },
              {
                role: "user",
                content: `استخرج التواريخ من:\n\n${chunk}`,
              },
            ],
            temperature: 0.05,
            n_predict: 400,
            stop: ["\n\n", "```", "<|im_end|>"],
            top_p: 0.8,
            top_k: 30,
          });

          const chunkDatesParse = safeParseArrayEnhanced(chunkRes.text);
          allExtractedDates.push(...chunkDatesParse);
        }
      }
    }

    console.log(
      `✅ CALL 1 COMPLETE: Extracted ${allExtractedDates.length} dates`
    );

    // Find missed dates
    const extractedDateStrings = allExtractedDates.map((d) => d.date);
    const missedDates = allFoundDates.filter(
      (date) => !extractedDateStrings.includes(date)
    );

    console.log("🎯 Missed dates after first call:", missedDates);

    // SECOND CALL: Try to get missed dates (only if there are any)
    if (missedDates.length > 0) {
      console.log("🔄 CALL 2: Processing missed dates...");

      // Create focused context for all missed dates
      const missedDateContexts = missedDates
        .map((date) => ({
          date,
          context: createContextForDate(normalizedText, date),
        }))
        .filter((item) => item.context.length > 0);

      if (missedDateContexts.length > 0) {
        const combinedContext = missedDateContexts
          .map((item) => `التاريخ ${item.date}:\n${item.context}`)
          .join("\n\n---\n\n");

        const secondCallRes = await ctx.completion({
          messages: [
            {
              role: "system",
              content: `أنت خبير في استخراج التواريخ من النصوص العربية.

المهمة: استخرج المهام للتواريخ المحددة فقط: ${missedDates.join(", ")}

الإخراج المطلوب - JSON فقط:
[
  {"date": "YYYY-MM-DD", "time": "HH:MM", "title": "وصف المهمة"}
]

قواعد:
- JSON صحيح فقط
- ركز على التواريخ المحددة أعلاه فقط
- إذا لم تجد معلومات كافية لتاريخ معين، تجاهله`,
            },
            {
              role: "user",
              content: `استخرج المهام للتواريخ المحددة من هذه السياقات:\n\n${combinedContext}`,
            },
          ],
          temperature: 0.05,
          n_predict: 400,
          stop: ["\n\n", "```", "<|im_end|>"],
          top_p: 0.8,
          top_k: 30,
        });

        const secondCallDates = safeParseArrayEnhanced(secondCallRes.text);
        allExtractedDates.push(...secondCallDates);

        // Update missed dates list
        const newExtractedDateStrings = allExtractedDates.map((d) => d.date);
        const finalMissedDates = allFoundDates.filter(
          (date) => !newExtractedDateStrings.includes(date)
        );

        console.log(
          `✅ CALL 2 COMPLETE: Extracted ${secondCallDates.length} more dates`
        );

        console.log(`🎯 Final missed dates: ${finalMissedDates.length}`);

        return {
          extractedDates: validateDatesEnhanced(allExtractedDates),
          missedDates: finalMissedDates.map((date) => ({
            date,
            context: createContextForDate(normalizedText, date),
          })),
        };
      }
    }

    // No missed dates or couldn't create context for them
    return {
      extractedDates: validateDatesEnhanced(allExtractedDates),
      missedDates: missedDates.map((date) => ({
        date,
        context: createContextForDate(normalizedText, date),
      })),
    };
  } catch (error) {
    console.error("❌ Date extraction error:", error);

    // Emergency fallback - create manual input for all found dates
    const allFoundDates = findAllDatesInText(normalizedText);
    return {
      extractedDates: [],
      missedDates: allFoundDates.map((date) => ({
        date,
        context: createContextForDate(normalizedText, date),
      })),
    };
  }
};

// Initialize LLama with optimized settings for Arabic
const initializeLlamaForArabic = async (modelPath) => {
  try {
    console.log("⚙️ Initializing LLM with enhanced settings...");

    const ctx = await initLlama({
      model: modelPath,
      n_ctx: 1536, // Increased context window
      n_gpu_layers: 0,
      seed: 42, // Fixed seed for consistency
      temp: 0.05, // Very low temperature
      top_p: 0.8, // Nucleus sampling
      top_k: 30, // Top-k sampling
      repeat_penalty: 1.05, // Light repetition penalty
      n_batch: 8,
      n_threads: 4,
    });

    console.log("✅ LLM initialized successfully");
    return ctx;
  } catch (error) {
    console.error("❌ LLM initialization failed:", error);
    throw error;
  }
};

// -----------------------------
// Main Component
// -----------------------------
export default function MeetingSummaryScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const { transcribedText = "", audioUri = "" } = params;
  const { addMeeting } = useMeetingContext();

  const [summary, setSummary] = useState("");
  const [datesArr, setDatesArr] = useState([]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("⏳ جار المعالجة...");
  const [downloadProgress, setDownloadProgress] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        try {
          setLoading(true);
          console.log("🚀 Starting meeting processing...");

          // Free Whisper memory before loading LLM
          await safeReleaseWhisper("pre-llama");

          // Ensure model exists
          const modelPath = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE}`;
          if (!(await RNFS.exists(modelPath))) {
            setStatus(" جاري تنزيل النموذج...");
            setDownloadProgress(0); // Reset progress to 0

            await RNFS.downloadFile({
              fromUrl: MODEL_URL,
              toFile: modelPath,
              begin: () => {
                console.log("✅ Started model download");
              },
              progress: (res) => {
                const percent = Math.floor(
                  (res.bytesWritten / res.contentLength) * 100
                );
                setDownloadProgress(percent);
              },
              progressDivider: 1,
            }).promise;
          }

          // You can reset it to 100 just in case
          setDownloadProgress(100);
          setStatus("تحميل النموذج...");
          const ctx = await initializeLlamaForArabic(modelPath);

          // Normalize the transcript
          const normalized = normalizeArabicText(transcribedText, new Date());
          console.log("📝 Normalized text length:", normalized.length);

          // Step 1: Generate comprehensive summary
          if (!cancelled) {
            setStatus(" جاري إنشاء الملخص ...");
            console.log("📝 Starting summary generation...");

            const summaryRes = await ctx.completion({
              messages: [
                {
                  role: "system",
                  content: `أنت مساعد ذكي متخصص في تلخيص الاجتماعات العربية بشكل شامل ومفيد.

اكتب ملخص مفصل يتضمن:


**النقاط الرئيسية**
- لخص أهم المواضيع المناقشة
- اذكر التفاصيل المهمة والأرقام والمعلومات الدقيقة


قواعد:
- استخدم فقرات منفصلة مع عناوين واضحة
- احتفظ بالأسماء والأرقام والتواريخ كما هي
- نص عادي بدون Markdown أو HTML
- فقط  اذكر المعلومات الموجوده بالنص , لا تذكر اي معلومه ليست بالنص 
- اللغة العربية فقط`,
                },
                {
                  role: "user",
                  content: `لخص هذا النص بالتفصيل المطلوب:\n\n${normalized}`,
                },
              ],
              temperature: 0.15,
              n_predict: 800,
            });

            if (!cancelled) {
              const cleanSummary = (summaryRes.text || "")
                .replace(/<.*?>/g, "")
                .replace(/\*\*/g, "")
                .replace(/##/g, "")
                .trim();
              setSummary(cleanSummary);
              console.log("✅ Summary generated, length:", cleanSummary.length);
            }
          }

          // Step 2: Extract dates with optimized 2-call approach
          if (!cancelled) {
            setStatus(" استخراج التواريخ والمهام ...");
            console.log("📅 Starting optimized date extraction...");

            try {
              const { extractedDates, missedDates: missed } =
                await extractDatesOptimized(ctx, normalized);

              // Auto-fill missed dates with default tasks titled "مهمة"
              let merged = extractedDates || [];
              if (Array.isArray(missed) && missed.length > 0) {
                const defaults = fillDefaultsForMissed(missed);
                merged = [...merged, ...defaults];
              }

              // Validate and save to state (JSON is datesArr)
              const cleaned = validateDatesEnhanced(merged);
              setDatesArr(cleaned);

              setStatus(`✅ تم استخراج ${cleaned.length} مهام مجدولة`);
              console.log(
                `✅ Extracted ${cleaned.length} total tasks (after defaults)`
              );
            } catch (dateError) {
              console.error("❌ Date extraction failed:", dateError);
              setStatus("❌ فشل في استخراج التواريخ");

              // Fallback: build default tasks for all dates found
              const allDates = findAllDatesInText(normalized);
              const defaults = fillDefaultsForMissed(allDates);
              const cleaned = validateDatesEnhanced(defaults);
              setDatesArr(cleaned);
              setStatus(`⚠️ تم إنشاء ${cleaned.length} مهام افتراضية`);
            }
          }

          // Release LLM resources
          releaseAllLlama().catch(() => {});

          if (!cancelled) {
            setStatus("✅ اكتمل التحليل");
          }
        } catch (error) {
          if (!cancelled) {
            console.error("❌ Processing error:", error);
            Alert.alert("خطأ", error.message || "فشل في معالجة النص");
            setStatus("❌ حدث خطأ في المعالجة");
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
        console.log("🧹 Cleaning up LLM resources...");
        releaseAllLlama().catch(() => {});
      };
    }, [transcribedText])
  );

  // --- Tasks editing: update JSON live ---
  const handleTaskTitleChange = (index, newTitle) => {
    setDatesArr((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], title: (newTitle || "").trimStart() };
      return next;
    });
  };

  const handleSave = async () => {
    if (!topic.trim()) {
      return Alert.alert("خطأ", "يرجى إدخال موضوع الاجتماع");
    }

    try {
      const cleanDates = validateDatesEnhanced(datesArr);
      await addMeeting(
        transcribedText,
        summary,
        cleanDates,
        audioUri,
        topic.trim()
      );
      Alert.alert("✅", "تم حفظ الاجتماع بنجاح");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Save error:", error);
      Alert.alert("خطأ", "حدث خطأ أثناء حفظ الاجتماع");
    }
  };

  const formatDatesForDisplay = (dates) => {
    if (!Array.isArray(dates) || dates.length === 0) {
      return "لا توجد مهام مجدولة";
    }

    // Sort by date, then by time
    const sorted = [...dates].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return (a.time || "00:00").localeCompare(b.time || "00:00");
    });

    // Group by date
    const byDate = sorted.reduce((acc, item) => {
      acc[item.date] = acc[item.date] || [];
      acc[item.date].push(item);
      return acc;
    }, {});

    // Build readable text
    const lines = [];
    Object.keys(byDate).forEach((day, idx) => {
      lines.push(`${idx + 1}. ${day}`);
      byDate[day].forEach((task) => {
        const timeText =
          task.time && task.time !== "00:00" ? ` | ${task.time}` : "";
        lines.push(`   - ${task.title}${timeText}`);
      });
      lines.push(""); // blank line between days
    });

    return lines.join("\n").trim();
  };

  const handleCopySummary = async () => {
    try {
      await Clipboard.setStringAsync(summary);
      Alert.alert("📋", "تم نسخ الملخص");
    } catch (error) {
      Alert.alert("خطأ", "فشل في نسخ الملخص");
    }
  };

  const handleShareSummary = async () => {
    try {
      const path = FileSystem.cacheDirectory + "meeting_summary.txt";
      await FileSystem.writeAsStringAsync(path, summary, { encoding: "utf8" });
      await Sharing.shareAsync(path);
    } catch (error) {
      Alert.alert("خطأ", "فشل في مشاركة الملخص");
    }
  };

  const handleCopyTasks = async () => {
    try {
      const tasksText = formatDatesForDisplay(datesArr);
      await Clipboard.setStringAsync(tasksText);
      Alert.alert("📋", "تم نسخ المهام");
    } catch (error) {
      Alert.alert("خطأ", "فشل في نسخ المهام");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Modal transparent visible={loading} animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingStatus}>{status}</Text>
              {status.includes("تنزيل") && (
                <Text style={{ fontSize: 14 }}> {downloadProgress}% </Text>
              )}
            </View>
          </View>
        </Modal>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Audio Player */}
          {!!audioUri && <AudioPlayer uri={audioUri} />}

          {/* Meeting Topic Input */}
          <Text style={styles.sectionHeader}>موضوع الاجتماع</Text>
          <TextInput
            style={styles.topicInput}
            placeholder="أدخل موضوع الاجتماع"
            value={topic}
            onChangeText={setTopic}
            multiline={false}
          />

          {/* Summary Card */}
          <CustomCard
            title="ملخص الاجتماع"
            value={summary}
            onChangeText={setSummary}
            height={250}
            items={[
              {
                icon: "content-copy",
                color: colors.secondary,
                onPress: handleCopySummary,
              },
              {
                icon: "share-variant",
                color: colors.secondary,
                onPress: handleShareSummary,
              },
            ]}
          />

          {/* Tasks Editor (inline, editable) */}
          <View style={{ marginTop: 20 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={styles.sectionHeader}>
                {`المهام المجدولة (${datesArr.length})`}
              </Text>
              <TouchableOpacity
                onPress={handleCopyTasks}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  backgroundColor: colors.secondary,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 14 }}>نسخ المهام</Text>
              </TouchableOpacity>
            </View>

            {datesArr.length === 0 ? (
              <Text style={{ textAlign: "right", color: "#666" }}>
                لا توجد مهام مجدولة
              </Text>
            ) : (
              datesArr.map((item, idx) => (
                <View
                  key={`${item.date}-${idx}`}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "#eee",
                  }}
                >
                  <Text
                    style={{
                      textAlign: "right",
                      color: "#333",
                      marginBottom: 6,
                    }}
                  >
                    📅 {item.date}{" "}
                    {item.time && item.time !== "00:00" ? `| ${item.time}` : ""}
                  </Text>

                  {/* Editable title updates JSON in datesArr */}
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 8,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      backgroundColor: "#fff",
                      fontSize: 16,
                      textAlign: "right",
                    }}
                    placeholder="مهمة"
                    value={item.title}
                    onChangeText={(t) => handleTaskTitleChange(idx, t)}
                    multiline
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>حفظ الاجتماع</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

//-------------------------
// Styles
// -----------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  loadingText: {
    marginTop: 16,
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  debugInfo: {
    marginTop: 8,
    color: "#cccccc",
    fontSize: 14,
    textAlign: "right",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 12,
    textAlign: "right",
  },
  topicInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#ffffff",
    fontSize: 16,
    textAlign: "right",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#333333",
    borderRadius: 8,
  },
  debugTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "right",
  },
  debugText: {
    color: "#cccccc",
    fontSize: 14,
    marginBottom: 4,
    textAlign: "right",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)", // dim the screen behind
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    width: "85%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    // nice shadow/elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  loadingStatus: {
    marginTop: 12,
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
});
