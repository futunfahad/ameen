// screens/MeetingSummaryScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
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

const MODEL_FILE = "qwen2.5-3b-instruct-q4_k_m.gguf";
const MODEL_URL = `https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/${MODEL_FILE}`;

export default function MeetingSummaryScreen() {
  const navigation = useNavigation();
  const { params = {} } = useRoute();
  const { transcribedText = "", audioUri = "" } = params;
  const { addMeeting } = useMeetingContext();

  const [summary, setSummary] = useState("");
  const [datesArr, setDatesArr] = useState([]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("⏳ جار المعالجة…");

  const clean = (t) => (t || "").replace(/<.*?>/g, "").trim();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          setLoading(true);
          await safeReleaseWhisper("pre-llama");

          // تحميل النموذج
          const modelPath = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE}`;
          if (!(await RNFS.exists(modelPath))) {
            setStatus("⬇️ تنزيل النموذج…");
            await RNFS.downloadFile({ fromUrl: MODEL_URL, toFile: modelPath })
              .promise;
          }
          setStatus("⚙️ تحميل النموذج…");
          const ctx = await initLlama({
            model: modelPath,
            n_ctx: 1024,
            n_gpu_layers: 0,
          });

          // 1️⃣ Summarize
          const sumRes = await ctx.completion({
            messages: [
              {
                role: "system",
                content: "أنت مساعد ذكي يلخص النصوص بدون رموز.",
              },
              { role: "user", content: transcribedText },
            ],
            temperature: 0,
            n_predict: 600,
          });
          if (!cancelled) setSummary(clean(sumRes.text));

          // 2️⃣ Normalize & Extract
          const normalized = normalizeArabicText(
            transcribedText,
            new Date(2025, 7, 8)
          );
          console.log("📄 Normalized >>>\n" + normalized);

          const linesNorm = normalized.split("\n");
          const linesOrig = transcribedText.split("\n");
          const extracted = [];

          linesNorm.forEach((ln, idx) => {
            const dm = ln.match(/(\d{4}-\d{2}-\d{2})/);
            if (!dm) return;
            const tm = ln.match(/(\d{2}:\d{2})/);
            extracted.push({
              date: dm[1],
              time: tm ? tm[1] : "",
              title: linesOrig[idx]?.trim() || "",
            });
          });

          console.log("🟢 Dates JSON >", JSON.stringify(extracted, null, 2));
          if (!cancelled) setDatesArr(extracted);
          if (!cancelled) setStatus("✅ جاهز");
        } catch (e) {
          if (!cancelled) Alert.alert("خطأ", e.message || "فشل المعالجة");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
        releaseAllLlama().catch(() => {});
      };
    }, [transcribedText])
  );

  const handleSave = async () => {
    if (!topic.trim()) return Alert.alert("خطأ", "يرجى إدخال موضوع الاجتماع");
    await addMeeting(
      transcribedText,
      summary,
      datesArr,
      audioUri,
      topic.trim()
    );
    Alert.alert("✅", "تم حفظ الاجتماع");
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.overlayText}>{status}</Text>
      </View>
    );
  }

  const pretty = datesArr.length
    ? datesArr
        .map((e) => [e.date, e.time, e.title].filter(Boolean).join(" | "))
        .join("\n")
    : "لا توجد تواريخ";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {audioUri && <AudioPlayer uri={audioUri} />}
      <Text style={styles.label}>موضوع الاجتماع:</Text>
      <TextInput
        style={styles.input}
        placeholder="أدخل الموضوع"
        value={topic}
        onChangeText={setTopic}
      />
      <Button title="حفظ" onPress={handleSave} color={colors.primary} />
      <CustomCard
        title="ملخص الاجتماع"
        value={summary}
        onChangeText={setSummary}
        height={200}
      />
      <CustomCard
        title="تواريخ مهمة"
        value={pretty}
        editable={false}
        height={150}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlayText: { marginTop: 8, color: "#fff" },
  container: { padding: 20, paddingBottom: 50, backgroundColor: "#f2f2f2" },
  label: { fontWeight: "bold", marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
});
