// screens/MeetingSummaryScreen.js
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
    let validTime = "09:00";
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

// Simple regex-based date extraction as fallback
const simpleDateExtraction = (normalizedText) => {
  console.log("🔍 Running simple date extraction as backup...");

  const dateRegex = /\d{4}-\d{2}-\d{2}/g;
  const dates = normalizedText.match(dateRegex) || [];

  console.log("📅 Regex found dates:", dates);

  if (dates.length === 0) {
    return [];
  }

  const found = [];

  dates.forEach((date, index) => {
    // Find context around the date
    const dateIndex = normalizedText.indexOf(date);
    const contextStart = Math.max(0, dateIndex - 80);
    const contextEnd = Math.min(normalizedText.length, dateIndex + 80);
    const context = normalizedText.substring(contextStart, contextEnd);

    // Try to extract meaningful context
    let title = `مهمة مجدولة ${index + 1}`;

    // Split context into phrases and find relevant ones
    const phrases = context
      .split(/[،.؛]/)
      .filter((phrase) => phrase.trim().length > 5);
    const relevantPhrase = phrases.find(
      (phrase) =>
        phrase.includes(date) ||
        Math.abs(context.indexOf(phrase) - context.indexOf(date)) < 40
    );

    if (relevantPhrase) {
      let cleanTitle = relevantPhrase
        .replace(date, "")
        .replace(/[هـم]\s*$/, "")
        .replace(/^\s*(يوم|في|من|إلى|بتاريخ)\s*/, "")
        .trim();

      // Take meaningful keywords for title
      const keywords = cleanTitle.split(/\s+/).slice(0, 6).join(" ");
      if (keywords && keywords.length >= 5) {
        title = keywords;
      }
    }

    found.push({
      date: date,
      time: "09:00",
      title: title,
    });
  });

  console.log("📝 Simple extraction results:", found);
  return found;
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

  // Strategy 2: Extract from code blocks
  const codeBlockMatches = [/```(?:json)?([\s\S]*?)```/gi, /`([\s\S]*?)`/gi];

  for (const regex of codeBlockMatches) {
    const match = str.match(regex);
    if (match && match[1]) {
      result = tryParse(match[1]);
      if (result) {
        console.log("✅ Success with code block extraction");
        return result;
      }
    }
  }

  // Strategy 3: Extract JSON array patterns
  const arrayPatterns = [/\[[\s\S]*?\]/g, /\{[\s\S]*?\}/g];

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

// Enhanced date extraction with comprehensive error handling
const extractDatesWithDebugging = async (ctx, normalizedText) => {
  try {
    console.log("📝 Starting enhanced date extraction...");
    console.log("📊 Input text length:", normalizedText.length);
    console.log("📖 First 200 chars:", normalizedText.substring(0, 200));

    // Step 1: Quick regex check to see if dates exist
    const dateRegex = /\d{4}-\d{2}-\d{2}/g;
    const foundDates = normalizedText.match(dateRegex) || [];
    console.log("🎯 Regex found dates:", foundDates);

    if (foundDates.length === 0) {
      console.log("⚠️ No dates found in text, returning empty array");
      return [];
    }

    // Step 2: Enhanced LLM prompt with better instructions
    console.log("🤖 Calling LLM for intelligent extraction...");

    const datesRes = await ctx.completion({
      messages: [
        {
          role: "system",
          content: `أنت خبير في استخراج التواريخ من النصوص العربية.

المهمة:
1. ابحث عن كل تاريخ بصيغة YYYY-MM-DD
2. لكل تاريخ، اكتب مهمة وصفية قصيرة (15-40 كلمة) تشرح ماذا يحدث في هذا التاريخ
3. إذا لم تجد وقت محدد، استخدم "09:00"

الإخراج المطلوب - JSON فقط:
[
  {"date": "YYYY-MM-DD", "time": "HH:MM", "title": "وصف المهمة"},
  {"date": "YYYY-MM-DD", "time": "HH:MM", "title": "وصف المهمة"}
]

قواعد صارمة:
- JSON صحيح فقط، لا نصوص إضافية
- إذا لم تجد تواريخ، أرجع []
- عناوين المهام واضحة ومفيدة`,
        },
        {
          role: "user",
          content: `استخرج التواريخ والمهام من النص:\n\n${normalizedText.substring(
            0,
            1200
          )}`,
        },
      ],
      temperature: 0.05,
      n_predict: 500,
      stop: ["\n\n", "```", "---"],
      top_p: 0.8,
      top_k: 30,
    });

    console.log("🤖 LLM Raw Response:", datesRes.text?.substring(0, 300));

    // Step 3: Parse with enhanced strategies
    let extractedDates = safeParseArrayEnhanced(datesRes.text);

    // Step 5: Final validation
    const validatedDates = validateDatesEnhanced(extractedDates);
    console.log("✅ Final extraction result:", validatedDates.length, "dates");

    return validatedDates;
  } catch (error) {
    console.error("❌ Date extraction error:", error);

    // Emergency fallback
    console.log("🆘 Using emergency regex fallback");
    return simpleDateExtraction(normalizedText);
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
            setStatus("⬇️ تنزيل النموذج...");
            console.log("📥 Downloading model...");
            await RNFS.downloadFile({ fromUrl: MODEL_URL, toFile: modelPath })
              .promise;
          }

          setStatus("⚙️ تحميل النموذج...");
          const ctx = await initializeLlamaForArabic(modelPath);

          // Normalize the transcript
          const normalized = normalizeArabicText(transcribedText, new Date());
          console.log("📝 Normalized text length:", normalized.length);
          console.log("📝 Normalized sample:", normalized.substring(0, 300));

          // Step 1: Generate comprehensive summary
          if (!cancelled) {
            setStatus("📝 جاري إنشاء الملخص المفصّل...");
            console.log("📝 Starting summary generation...");

            const summaryRes = await ctx.completion({
              messages: [
                {
                  role: "system",
                  content: `أنت مساعد ذكي متخصص في تلخيص الاجتماعات العربية بشكل شامل ومفيد.

اكتب ملخص مفصل يتضمن:

**نوع الاجتماع**
- حدد نوع الاجتماع 

**النقاط الرئيسية**
- لخص أهم المواضيع المناقشة
- اذكر التفاصيل المهمة والأرقام والمعلومات الدقيقة

**القرارات والاتفاقيات**
- اذكر جميع القرارات المتخذة
- الاتفاقات والموافقات

**المهام والمسؤوليات**
- من سيقوم بماذا
- المسؤوليات المحددة


**الخطوات التالية**
- الإجراءات المقررة
- المواعيد والالتزامات

قواعد:
- استخدم فقرات منفصلة مع عناوين واضحة
- احتفظ بالأسماء والأرقام والتواريخ كما هي
- 300-600 كلمة حسب طول النص
- نص عادي بدون Markdown أو HTML
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

          // Step 2: Extract dates and create tasks with enhanced method
          if (!cancelled) {
            setStatus("📅 استخراج التواريخ والمهام...");
            console.log("📅 Starting date extraction...");

            try {
              const extractedDates = await extractDatesWithDebugging(
                ctx,
                normalized
              );
              setDatesArr(extractedDates);

              if (extractedDates.length === 0) {
                console.log("⚠️ No dates extracted");
                setStatus("⚠️ لم يتم العثور على تواريخ في النص");
              } else {
                console.log(
                  `✅ Successfully extracted ${extractedDates.length} dates`
                );
                setStatus(`✅ تم استخراج ${extractedDates.length} مهام مجدولة`);
              }
            } catch (dateError) {
              console.error("❌ Date extraction failed:", dateError);
              setStatus("❌ فشل في استخراج التواريخ");

              // Final fallback
              const fallbackDates = simpleDateExtraction(normalized);
              setDatesArr(fallbackDates);
            }
          }

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

    return dates
      .map((item, index) => {
        const timeText = item.time !== "00:00" ? ` | ${item.time}` : "";
        return `${index + 1}. ${item.date}${timeText}\n   ${item.title}`;
      })
      .join("\n\n");
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

  // Loading screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{status}</Text>
        <Text style={styles.debugInfo}>
          {datesArr.length > 0 && `تم العثور على ${datesArr.length} مهام`}
        </Text>
      </View>
    );
  }

  const formattedTasks = formatDatesForDisplay(datesArr);

  return (
    <View style={styles.container}>
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

        {/* Tasks Card */}
        <CustomCard
          title={`المهام المجدولة (${datesArr.length})`}
          value={formattedTasks}
          editable={false}
          height={200}
          items={[
            {
              icon: "content-copy",
              color: colors.secondary,
              onPress: handleCopyTasks,
            },
          ]}
        />

        {/* Debug Info (remove in production) */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>🐛 معلومات التطوير</Text>
            <Text style={styles.debugText}>
              النص الأصلي: {transcribedText.length} حرف
            </Text>
            <Text style={styles.debugText}>
              التواريخ المستخرجة: {datesArr.length}
            </Text>
            <Text style={styles.debugText}>حالة المعالجة: {status}</Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>حفظ الاجتماع</Text>
      </TouchableOpacity>
    </View>
  );
}

// -----------------------------
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
    textAlign: "center",
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
});
