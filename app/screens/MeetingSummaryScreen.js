// screens/MeetingSummaryScreen.js
import React, { useState, useCallback } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import RNFS from "react-native-fs";
import { initLlama, releaseAllLlama } from "llama.rn";

import colors from "../config/colors";
import AudioPlayer from "../components/AudioPlayer";
import CustomCard from "../components/CustomCard";
import { useMeetingContext } from "../context/MeetingContext";
import { safeReleaseWhisper } from "../services/whisperInstance";

const MODEL_FILE = "qwen2.5-3b-instruct-q4_k_m.gguf";
const MODEL_URL = `https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/${MODEL_FILE}`;

export default function MeetingSummaryScreen() {
  const navigation = useNavigation();
  const { transcribedText = "", audioUri = "" } = useRoute().params || {};
  const { addMeeting } = useMeetingContext();

  const [summary, setSummary] = useState("");
  const [datesTxt, setDatesTxt] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("⏳ جاري المعالجة…");

  // Auto-summarize on every focus, without returning a promise directly
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;

      const runSummarization = async () => {
        try {
          setLoading(true);
          await safeReleaseWhisper("pre-llama");

          const modelPath = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE}`;
          if (!(await RNFS.exists(modelPath))) {
            setStatus("⬇️ تنزيل النموذج…");
            await RNFS.downloadFile({
              fromUrl: MODEL_URL,
              toFile: modelPath,
              progressDivider: 5,
              progress: ({ bytesWritten, contentLength }) =>
                setStatus(
                  `⬇️ ${Math.floor((bytesWritten / contentLength) * 100)}%`
                ),
            }).promise;
          }

          setStatus("⚙️ تحميل النموذج…");
          const ctx = await initLlama({
            model: modelPath,
            n_ctx: 1024,
            n_gpu_layers: 0,
          });

          setStatus("📝 تلخيص النص…");
          const sumRes = await ctx.completion({
            messages: [
              { role: "system", content: "أنت مساعد ذكي يلخص النصوص." },
              {
                role: "user",
                content: `لخص هذا النص:\n${transcribedText}`,
              },
            ],
            n_predict: 800,
          });
          if (!cancelled) setSummary((sumRes?.text || "").trim());

          setStatus("📆 استخراج التواريخ…");
          const dateRes = await ctx.completion({
            messages: [
              {
                role: "system",
                content: "استخرج التواريخ فقط، سطر لكل تاريخ.",
              },
              { role: "user", content: transcribedText },
            ],
            n_predict: 400,
          });
          if (!cancelled)
            setDatesTxt(
              (dateRes?.text || "")
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean)
                .join("\n")
            );

          if (!cancelled) setStatus("✅ جاهز للحفظ");
        } catch (e) {
          if (!cancelled) Alert.alert("خطأ", e.message || "فشل المعالجة");
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      runSummarization();

      return () => {
        cancelled = true;
        releaseAllLlama().catch(() => {});
      };
    }, [transcribedText])
  );

  const handleSave = async () => {
    if (!topic.trim()) {
      Alert.alert("خطأ", "يرجى إدخال موضوع الاجتماع");
      return;
    }
    const datesArr = datesTxt
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    await addMeeting(
      transcribedText,
      summary,
      datesArr,
      audioUri,
      topic.trim()
    );
    Alert.alert("✅", "تم حفظ الاجتماع");

    setTopic("");
    setSummary("");
    setDatesTxt("");

    navigation.navigate("History");
  };

  if (loading) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.overlayText}>{status}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {audioUri ? <AudioPlayer uri={audioUri} /> : null}

      <Text style={styles.label}>موضوع الاجتماع:</Text>
      <TextInput
        style={styles.input}
        placeholder="أدخل الموضوع هنا"
        value={topic}
        onChangeText={setTopic}
      />

      <View style={styles.buttonRow}>
        <Button title="تلخيص" onPress={() => runSummarization()} />
        <Button
          title="حفظ الاجتماع"
          onPress={handleSave}
          color={colors.primary}
        />
      </View>

      <CustomCard
        title="ملخص الاجتماع"
        value={summary}
        onChangeText={setSummary}
        height={200}
      />

      <CustomCard
        title="تواريخ مهمة"
        value={datesTxt}
        onChangeText={setDatesTxt}
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
  overlayText: {
    marginTop: 8,
    color: "#fff",
  },
  container: {
    padding: 20,
    paddingBottom: 50,
    backgroundColor: "#f2f2f2",
  },
  label: {
    fontWeight: "bold",
    marginVertical: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
});
