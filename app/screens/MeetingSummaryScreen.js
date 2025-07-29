import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  ActivityIndicator,
  Modal,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Calendar from "expo-calendar";
import RNFS from "react-native-fs";
import { initLlama, releaseAllLlama } from "llama.rn";

import colors from "../config/colors";
import SecondaryButton from "../components/SecondaryButton";
import { useMeetingContext } from "../context/MeetingContext";
import AudioPlayer from "../components/AudioPlayer";
import CustomCard from "../components/CustomCard";

const MODEL_FILE = "qwen2.5-3b-instruct-q4_k_m.gguf";
const MODEL_URL = `https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/${MODEL_FILE}?download=true`;

export default function MeetingSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const passedText = route.params?.transcribedText || "";
  const audioUri = route.params?.audioUri || "";
  const { addMeeting } = useMeetingContext();

  const [summary, setSummary] = useState("");
  const [datesTxt, setDatesTxt] = useState("");
  const [status, setStatus] = useState("⏳ بدء المعالجة…");
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (!passedText) return;

      const run = async () => {
        try {
          setLoading(true);
          const docPath = `${RNFS.DocumentDirectoryPath}/${MODEL_FILE}`;
          if (!(await RNFS.exists(docPath))) {
            setStatus("⬇️ تنزيل النموذج…");
            await downloadFile(MODEL_URL, docPath, (p) =>
              setStatus(`⬇️ ${p}%`)
            );
          }

          setStatus("⚙️ تحميل النموذج…");
          const ctx = await initLlama({
            model: docPath,
            n_ctx: 2048,
            n_gpu_layers: 1,
          });

          setStatus("📝 تلخيص النص…");
          const sumRes = await ctx.completion({
            messages: [
              { role: "system", content: "أنت مساعد ذكي يلخص النصوص." },
              { role: "user", content: `لخص هذا النص:\n${passedText}` },
            ],
            n_predict: 800,
          });
          const summaryText = sumRes.text.trim();
          setSummary(summaryText);

          setStatus("📆 استخراج التواريخ…");
          const dateRes = await ctx.completion({
            messages: [
              {
                role: "system",
                content: "استخرج التواريخ فقط كل تاريخ بسطر مستقل.",
              },
              { role: "user", content: passedText },
            ],
            n_predict: 400,
          });
          const dateLines = dateRes.text
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          const datesText = dateLines.join("\n") || "لا توجد تواريخ.";
          setDatesTxt(datesText);

          addMeeting(
            passedText,
            summaryText,
            dateLines,
            audioUri,
            new Date().toISOString()
          );
          await addDatesToCalendar(dateLines, summaryText);

          setStatus("✅ تم!");
        } catch (err) {
          console.error(err);
          Alert.alert("خطأ", err.message || "حدث خطأ غير متوقع");
          setStatus("❌ فشل");
        } finally {
          setLoading(false);
          await releaseAllLlama();
        }
      };

      run();
    }, [passedText])
  );

  return (
    <View style={styles.container}>
      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        <AudioPlayer uri={audioUri} />

        <CustomCard
          title="ملخص الاجتماع"
          value={summary}
          onChangeText={setSummary}
          placeholder="سيظهر الملخص هنا…"
          height={220}
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
          title="تواريخ مهمة"
          value={datesTxt}
          onChangeText={setDatesTxt}
          placeholder="سيتم عرض التواريخ هنا…"
          height={220}
          items={[
            {
              icon: "calendar",
              color: colors.primary,
              onPress: () => Alert.alert("📆", "تمت إضافة التواريخ للتقويم"),
            },
            {
              icon: "content-copy",
              color: colors.secondary,
              onPress: () => {
                Clipboard.setString(datesTxt);
                Alert.alert("📋", "تم نسخ التواريخ");
              },
            },
          ]}
        />

        <View style={styles.bottomButtons}>
          <SecondaryButton
            text="عرض سجل المحفوظات"
            color={colors.secondary}
            onPress={() => navigation.navigate("History")}
          />
          <SecondaryButton
            text="← العودة للنص الأصلي"
            color={colors.primary}
            onPress={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </View>
  );
}

async function downloadFile(url, dest, onProgress) {
  const res = await RNFS.downloadFile({
    fromUrl: url,
    toFile: dest,
    progressDivider: 5,
    progress: ({ bytesWritten, contentLength }) => {
      const pct = Math.floor((bytesWritten / contentLength) * 100);
      onProgress(pct);
    },
  }).promise;
  if (res.statusCode !== 200)
    throw new Error(`Download failed (HTTP ${res.statusCode})`);
}

async function addDatesToCalendar(dates, title) {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") return;
  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT
  );
  const targetCal =
    calendars.find((c) => c.allowsModifications) || calendars[0];
  for (const d of dates) {
    const when = new Date(d);
    if (!isNaN(when)) {
      await Calendar.createEventAsync(targetCal.id, {
        title: title || "موعد اجتماع",
        startDate: when,
        endDate: new Date(when.getTime() + 3600 * 1000),
        timeZone: "Asia/Riyadh",
      });
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 20,
  },
  bottomButtons: {
    marginBottom: 40,
    alignItems: "stretch",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  statusText: {
    marginTop: 10,
    fontSize: 16,
    color: "#fff",
  },
});
