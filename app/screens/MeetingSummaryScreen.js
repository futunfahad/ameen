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
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

const MODEL_FILE = "qwen2.5-3b-instruct-q4_k_m.gguf";
const MODEL_URL = `https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/${MODEL_FILE}`;

const validateDates = (dates) => {
  if (!Array.isArray(dates)) return [];
  return dates.map((item) => ({
    date: item.date
      ? new Date(item.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    time: /^\d{2}:\d{2}$/.test(item.time) ? item.time : "00:00",
    title: item.title || "اجتماع",
  }));
};

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
          await safeReleaseWhisper("pre-llama");
          const modelPath = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE}`;
          if (!(await RNFS.exists(modelPath))) {
            setStatus("⬇️ تنزيل النموذج...");
            await RNFS.downloadFile({ fromUrl: MODEL_URL, toFile: modelPath })
              .promise;
          }
          setStatus("⚙️ تحميل النموذج...");
          const ctx = await initLlama({
            model: modelPath,
            n_ctx: 1024,
            n_gpu_layers: 0,
          });

          setStatus("📝 جاري التلخيص...");
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
          if (!cancelled) setSummary(sumRes.text.replace(/<.*?>/g, "").trim());

          setStatus("📅 جاري معالجة التواريخ...");
          const normalized = normalizeArabicText(transcribedText, new Date());
          const linesNorm = normalized.split("\n");
          const linesOrig = transcribedText.split("\n");
          const extracted = [];

          linesNorm.forEach((ln, idx) => {
            const dm = ln.match(/(\d{4}-\d{2}-\d{2})/);
            if (!dm) return;
            const tm = ln.match(/(\d{2}:\d{2})/);
            extracted.push({
              date: dm[1],
              time: tm ? tm[1] : "00:00",
              title: linesOrig[idx]?.trim() || "اجتماع",
            });
          });

          const validatedDates = validateDates(extracted);
          if (!cancelled) setDatesArr(validatedDates);
          if (!cancelled) setStatus("✅ جاهز");
        } catch (e) {
          if (!cancelled) Alert.alert("خطأ", e.message || "فشل المعالجة");
          console.error("Processing error:", e);
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
    try {
      const cleanDates = validateDates(datesArr);
      await addMeeting(
        transcribedText,
        summary,
        cleanDates,
        audioUri,
        topic.trim()
      );
      Alert.alert("✅", "تم حفظ الاجتماع");
      navigation.goBack();
    } catch (error) {
      Alert.alert("خطأ", "حدث خطأ أثناء حفظ الاجتماع");
      console.error("Save error:", error);
    }
  };

  const formatDatesForDisplay = (dates) => {
    if (!Array.isArray(dates)) return "لا توجد تواريخ";
    return dates
      .map(
        (date) =>
          `${date.date}${date.time !== "00:00" ? ` | ${date.time}` : ""} | ${
            date.title
          }`
      )
      .join("\n");
  };

  if (loading) {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.overlayText}>{status}</Text>
      </View>
    );
  }

  const prettyDates = formatDatesForDisplay(datesArr);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>موضوع الاجتماع</Text>

        {audioUri && <AudioPlayer uri={audioUri} />}

        <TextInput
          style={styles.input}
          placeholder="أدخل الموضوع"
          value={topic}
          onChangeText={setTopic}
        />

        <CustomCard
          title="ملخص الاجتماع"
          value={summary}
          onChangeText={setSummary}
          height={200}
          items={[
            {
              icon: "content-copy",
              color: colors.secondary,
              onPress: () => {
                Clipboard.setString(summary);
                Alert.alert("📋", "تم نسخ الملخص");
              },
            },
            {
              icon: "share-variant",
              color: colors.secondary,
              onPress: async () => {
                const path = FileSystem.cacheDirectory + "summary.txt";
                await FileSystem.writeAsStringAsync(path, summary);
                Sharing.shareAsync(path);
              },
            },
          ]}
        />

        <CustomCard
          title="التواريخ المهمة"
          value={prettyDates}
          editable={false}
          height={150}
          items={[
            {
              icon: "content-copy",
              color: colors.secondary,
              onPress: () => {
                Clipboard.setString(prettyDates);
                Alert.alert("📋", "تم نسخ التواريخ");
              },
            },
          ]}
        />
      </ScrollView>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>حفظ الاجتماع</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 80, // Extra padding for the button
  },
  header: {
    fontSize: 25,
    marginBottom: 20,
    alignSelf: "center",
    color: colors.dark,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  overlayText: {
    marginTop: 8,
    color: "#fff",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
    fontSize: 16,
    textAlign: "right",
  },
  saveButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
