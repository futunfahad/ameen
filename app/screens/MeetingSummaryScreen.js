// MeetingSummaryScreen.js
import React, { useState, useCallback, useRef } from "react";
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
// Helper Functions (your originals, unchanged except where noted)
// -----------------------------
const validateDatesEnhanced = (dates) => {
  if (!Array.isArray(dates)) return [];
  const validated = dates.map((item) => {
    // date
    let validDate;
    if (
      item.date &&
      typeof item.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date)
    ) {
      const dateObj = new Date(item.date);
      if (!isNaN(dateObj.getTime())) validDate = item.date;
    }
    if (!validDate) validDate = new Date().toISOString().split("T")[0];

    // time
    let validTime = "00:00";
    if (
      item.time &&
      typeof item.time === "string" &&
      /^\d{2}:\d{2}$/.test(item.time)
    ) {
      validTime = item.time;
    }

    // title
    let validTitle = "مهمة";
    if (item.title && typeof item.title === "string" && item.title.trim()) {
      validTitle = item.title.toString().trim();
      if (validTitle.length > 80)
        validTitle = validTitle.substring(0, 77) + "...";
    }

    return { date: validDate, time: validTime, title: validTitle };
  });
  return validated;
};

const findAllDatesInText = (text) => {
  // ✅ CHANGED: return ALL occurrences (don’t dedupe) with index
  const re = /\d{4}-\d{2}-\d{2}/g;
  const hits = [];
  let m;
  while ((m = re.exec(text)) !== null)
    hits.push({ date: m[0], index: m.index });
  return hits;
};

const createContextForDate = (text, date, index) => {
  // ✅ CHANGED: use provided index (no indexOf)
  if (index == null || index < 0) return "";
  const start = Math.max(0, index - 150);
  const end = Math.min(text.length, index + 150);
  return text.substring(start, end);
};

const fillDefaultsForMissed = (missed) => {
  if (!Array.isArray(missed)) return [];
  // ✅ CHANGED: use context-based titles (no generic spam)
  return missed.map((m) => {
    const date = typeof m === "string" ? m : m?.date;
    const ctx = typeof m === "object" ? m?.context || "" : "";
    const title = titleFromContext(ctx, date);
    return {
      date: /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? date
        : new Date().toISOString().split("T")[0],
      time: "00:00",
      title: title || "متابعة/تذكير متعلق بالموعد",
    };
  });
};

// ✅ NEW: derive a short title from nearby context
const titleFromContext = (context = "", date = "") => {
  let c = (context || "").replace(date, " ").replace(/\s+/g, " ").trim();
  c = c
    .replace(/\d{4}-\d{2}-\d{2}/g, " ")
    .replace(/\b\d{1,2}:\d{2}\b/g, " ")
    .replace(/[•\-–—|\[\](){}<>#:،.!؟,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = c.split(" ").filter(Boolean);
  const slice = words.slice(0, 14).join(" ").trim();
  return slice || "متابعة/تذكير متعلق بالموعد";
};

const safeParseArrayEnhanced = (str) => {
  if (!str) return [];
  const tryParse = (s) => {
    try {
      const p = JSON.parse(s.trim());
      return Array.isArray(p) ? p : null;
    } catch {
      return null;
    }
  };
  let r = tryParse(str);
  if (r) return r;

  const codeBlockPatterns = [/```(?:json)?([\s\S]*?)```/gi, /`([\s\S]*?)`/gi];
  for (const pattern of codeBlockPatterns) {
    let m;
    while ((m = pattern.exec(str)) !== null) {
      const inner = (m[1] || "").trim();
      if (!inner) continue;
      r = tryParse(inner);
      if (r) return r;
    }
  }
  const arrayMatches = str.match(/\[[\s\S]*?\]/g) || [];
  for (const match of arrayMatches) {
    r = tryParse(match);
    if (r) return r;
  }
  return [];
};

const splitTextIntoChunks = (text, maxChunkSize = 1200) => {
  const chunks = [];
  const sentences = text.split(/[.؟!]/).filter((s) => s.trim().length > 10);
  let current = "";
  for (const s of sentences) {
    if (current.length + s.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += (current ? ". " : "") + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
};

const extractDatesOptimized = async (ctx, normalizedText) => {
  try {
    const occurrences = findAllDatesInText(normalizedText); // [{date, index}]
    if (occurrences.length === 0)
      return { extractedDates: [], missedDates: [] };
    const uniqueDates = [...new Set(occurrences.map((o) => o.date))];

    let allExtractedDates = [];

    if (normalizedText.length <= 1500) {
      const datesRes = await ctx.completion({
        messages: [
          {
            role: "system",
            content: `أنت خبير في استخراج التواريخ من النصوص العربية.
- استخرج كل المهام لكل تاريخ بصيغة YYYY-MM-DD
- عنوان موجز لكل مهمة (15–40 كلمة)
- استخدم "00:00" عند غياب الوقت
- أعد JSON فقط
التواريخ المتوقعة: ${uniqueDates.join(", ")}

[
  {"date":"YYYY-MM-DD","time":"HH:MM","title":"وصف المهمة"}
]`,
          },
          { role: "user", content: `النص:\n\n${normalizedText}` },
        ],
        temperature: 0.05,
        n_predict: 600,
        stop: ["```", "<|im_end|>"],
        top_p: 0.8,
        top_k: 30,
      });
      allExtractedDates = safeParseArrayEnhanced(datesRes.text);
    } else {
      const chunks = splitTextIntoChunks(normalizedText, 1200);
      for (const chunk of chunks) {
        const chunkDates = [
          ...new Set(chunk.match(/\d{4}-\d{2}-\d{2}/g) || []),
        ];
        if (chunkDates.length === 0) continue;
        const chunkRes = await ctx.completion({
          messages: [
            {
              role: "system",
              content: `أنت خبير في استخراج التواريخ.
- استخرج المهام للتواريخ في هذا الجزء: ${chunkDates.join(", ")}
- عنوان موجز (15–40 كلمة)
- "00:00" إذا لا يوجد وقت
- JSON فقط`,
            },
            { role: "user", content: `النص:\n\n${chunk}` },
          ],
          temperature: 0.05,
          n_predict: 400,
          stop: ["```", "<|im_end|>"],
          top_p: 0.8,
          top_k: 30,
        });
        const parsed = safeParseArrayEnhanced(chunkRes.text);
        allExtractedDates.push(...parsed);
      }
    }

    const extractedDatesSet = new Set(
      (allExtractedDates || []).map((d) => d?.date)
    );
    const missedOcc = occurrences.filter((o) => !extractedDatesSet.has(o.date));

    if (missedOcc.length > 0) {
      const blocks = missedOcc
        .map(
          (o) =>
            `التاريخ ${o.date}:\n${createContextForDate(
              normalizedText,
              o.date,
              o.index
            )}`
        )
        .join("\n\n---\n\n");

      const secondRes = await ctx.completion({
        messages: [
          {
            role: "system",
            content: `استخرج جميع المهام للتواريخ التالية فقط: ${[
              ...new Set(missedOcc.map((o) => o.date)),
            ].join(", ")}
- JSON فقط
- "00:00" عند غياب الوقت`,
          },
          { role: "user", content: `السياقات:\n\n${blocks}` },
        ],
        temperature: 0.05,
        n_predict: 400,
        stop: ["```", "<|im_end|>"],
        top_p: 0.8,
        top_k: 30,
      });

      const secondParsed = safeParseArrayEnhanced(secondRes.text);
      allExtractedDates.push(...secondParsed);
    }

    const extractedFinalSet = new Set(
      (allExtractedDates || []).map((d) => d?.date)
    );
    const stillMissed = occurrences.filter(
      (o) => !extractedFinalSet.has(o.date)
    );

    const defaults = stillMissed.map((o) => ({
      date: o.date,
      time: "00:00",
      title: titleFromContext(
        createContextForDate(normalizedText, o.date, o.index),
        o.date
      ),
    }));

    const merged = [...(allExtractedDates || []), ...defaults];
    return { extractedDates: validateDatesEnhanced(merged), missedDates: [] };
  } catch (error) {
    const occurrences = findAllDatesInText(normalizedText);
    const defaults = occurrences.map((o) => ({
      date: o.date,
      time: "00:00",
      title: titleFromContext(
        createContextForDate(normalizedText, o.date, o.index),
        o.date
      ),
    }));
    return { extractedDates: validateDatesEnhanced(defaults), missedDates: [] };
  }
};

const initializeLlamaForArabic = async (modelPath) => {
  const ctx = await initLlama({
    model: modelPath,
    n_ctx: 1536,
    n_gpu_layers: 0,
    seed: 42,
    temp: 0.05,
    top_p: 0.8,
    top_k: 30,
    repeat_penalty: 1.05,
    n_batch: 8,
    n_threads: 4,
  });
  return ctx;
};

// ✅ NEW: safe release with timeout cap (prevents UI hang)
const safeRelease = async () => {
  try {
    await Promise.race([
      releaseAllLlama(),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  } catch {}
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

  const inFlightRef = useRef(false); // ✅ NEW

  useFocusEffect(
    useCallback(() => {
      if (inFlightRef.current) return; // ✅ NEW: prevent double-run
      inFlightRef.current = true;

      let cancelled = false;

      (async () => {
        try {
          setLoading(true);
          setStatus("🚀 بدء المعالجة...");

          await safeReleaseWhisper("pre-llama");

          const modelPath = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE}`;
          if (!(await RNFS.exists(modelPath))) {
            setStatus("جاري تنزيل النموذج...");
            setDownloadProgress(0);
            await RNFS.downloadFile({
              fromUrl: MODEL_URL,
              toFile: modelPath,
              begin: () => {},
              progress: (res) => {
                const pct = Math.floor(
                  (res.bytesWritten / res.contentLength) * 100
                );
                if (!cancelled) setDownloadProgress(pct);
              },
              progressDivider: 1,
            }).promise;
          }

          if (cancelled) return;
          setDownloadProgress(100);
          setStatus("تحميل النموذج...");

          const ctx = await initializeLlamaForArabic(modelPath);
          if (cancelled) return;

          const normalized = normalizeArabicText(transcribedText, new Date());

          // Summary
          setStatus("جاري إنشاء الملخص...");
          const summaryRes = await ctx.completion({
            messages: [
              {
                role: "system",
                content:
                  "أنت مساعد ذكي متخصص في تلخيص الاجتماعات العربية بدقة ووضوح. لا تضف معلومات غير موجودة.",
              },
              {
                role: "user",
                content: `لخص النص التالي بدقة:\n\n${normalized}`,
              },
            ],
            temperature: 0.15,
            n_predict: 800,
          });
          if (cancelled) return;

          const cleanSummary = (summaryRes.text || "")
            .replace(/<.*?>/g, "")
            .replace(/\*\*/g, "")
            .replace(/##/g, "")
            .trim();
          setSummary(cleanSummary);

          // Dates extraction
          setStatus("استخراج التواريخ والمهام...");
          const { extractedDates, missedDates: missed } =
            await extractDatesOptimized(ctx, normalized);
          if (cancelled) return;

          // (Your original merge-with-missed flow)
          let merged = extractedDates || [];
          if (Array.isArray(missed) && missed.length > 0) {
            const defaults = fillDefaultsForMissed(missed);
            merged = [...merged, ...defaults];
          }

          const cleaned = validateDatesEnhanced(merged);
          setDatesArr(cleaned);

          // ✅ CHANGED: show success, then HIDE LOADER *immediately*
          setStatus(`✅ تم استخراج ${cleaned.length} مهمة`);
          setLoading(false); // ✅ CHANGED (hide first)
          setTimeout(() => {
            safeRelease();
          }, 0); // ✅ NEW: cleanup in background

          if (!cancelled) {
            // optional final status (won't block UI)
            setStatus("✅ اكتمل التحليل");
          }
        } catch (error) {
          if (!cancelled) {
            console.error("❌ Processing error:", error);
            Alert.alert("خطأ", error?.message || "فشل في معالجة النص");
            setStatus("❌ حدث خطأ في المعالجة");
            setLoading(false); // ✅ ensure loader hides on error
          }
        } finally {
          inFlightRef.current = false; // ✅ NEW
        }
      })();

      return () => {
        cancelled = true;
        // Also try to release on unmount, but never block UI
        setTimeout(() => {
          safeRelease();
        }, 0); // ✅ NEW: safe background release
      };
    }, [transcribedText])
  );

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
    if (!Array.isArray(dates) || dates.length === 0)
      return "لا توجد مهام مجدولة";
    const sorted = [...dates].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return (a.time || "00:00").localeCompare(b.time || "00:00");
    });
    const byDate = sorted.reduce((acc, item) => {
      acc[item.date] = acc[item.date] || [];
      acc[item.date].push(item);
      return acc;
    }, {});
    const lines = [];
    Object.keys(byDate).forEach((day, idx) => {
      lines.push(`${idx + 1}. ${day}`);
      byDate[day].forEach((task) => {
        const timeText =
          task.time && task.time !== "00:00" ? ` | ${task.time}` : "";
        lines.push(`   - ${task.title}${timeText}`);
      });
      lines.push("");
    });
    return lines.join("\n").trim();
  };

  const handleCopySummary = async () => {
    try {
      await Clipboard.setStringAsync(summary);
      Alert.alert("📋", "تم نسخ الملخص");
    } catch {
      Alert.alert("خطأ", "فشل في نسخ الملخص");
    }
  };

  const handleShareSummary = async () => {
    try {
      const path = FileSystem.cacheDirectory + "meeting_summary.txt";
      await FileSystem.writeAsStringAsync(path, summary, { encoding: "utf8" });
      await Sharing.shareAsync(path);
    } catch {
      Alert.alert("خطأ", "فشل في مشاركة الملخص");
    }
  };

  const handleCopyTasks = async () => {
    try {
      const tasksText = formatDatesForDisplay(datesArr);
      await Clipboard.setStringAsync(tasksText);
      Alert.alert("📋", "تم نسخ المهام");
    } catch {
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
              {String(status).includes("تنزيل") && (
                <Text style={{ fontSize: 14 }}> {downloadProgress}% </Text>
              )}
            </View>
          </View>
        </Modal>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {!!audioUri && <AudioPlayer uri={audioUri} />}

          <Text style={styles.sectionHeader}>موضوع الاجتماع</Text>
          <TextInput
            style={styles.topicInput}
            placeholder="أدخل موضوع الاجتماع"
            value={topic}
            onChangeText={setTopic}
            multiline={false}
          />

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
                    placeholder="عنوان المهمة"
                    value={item.title}
                    onChangeText={(t) => handleTaskTitleChange(idx, t)}
                    multiline
                  />
                </View>
              ))
            )}
          </View>
        </ScrollView>

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
