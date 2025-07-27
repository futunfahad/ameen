import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Text,
  Modal,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Calendar from "expo-calendar";

import colors from "../config/colors";
import SecondaryButton from "../components/SecondaryButton";
import { useMeetingContext } from "../context/MeetingContext";
import AudioPlayer from "../components/AudioPlayer";
import CustomCard from "../components/CustomCard";

export default function MeetingSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const passedText = route.params?.transcribedText || "";
  const audioUri = route.params?.audioUri || "";
  const { addMeeting } = useMeetingContext();

  const [summary, setSummary] = useState("");
  const [datesTxt, setDatesTxt] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("⏳ بدء المعالجة…");

  useEffect(() => {
    if (!passedText) return;

    const processMeeting = async () => {
      try {
        setStatus("📝 تلخيص النص…");
        const summaryRes = await fetch("http://192.168.3.93:5040/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: passedText }),
        });
        const summaryData = await summaryRes.json();
        const summaryText = summaryData.summary || "";
        setSummary(summaryText);

        setStatus("📆 استخراج التواريخ…");
        const datesRes = await fetch("http://192.168.3.93:5030/extract-dates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: passedText }),
        });
        const datesData = await datesRes.json();
        const dateLines = datesData.key_dates || [];
        const datesText = dateLines.length ? dateLines.join("\n") : "لا توجد تواريخ.";
        setDatesTxt(datesText);

        addMeeting(passedText, summaryText, dateLines, audioUri, new Date().toISOString());
        await addDatesToCalendar(dateLines, summaryText);

        setStatus("✅ تم!");
      } catch (err) {
        console.error("❌ خطأ:", err);
        Alert.alert("خطأ", err.message || "حدث خطأ غير متوقع");
        setStatus("❌ فشل");
      } finally {
        setLoading(false);
      }
    };

    processMeeting();
  }, []);

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

async function addDatesToCalendar(dates, title) {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") return;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const targetCal = calendars.find((c) => c.allowsModifications) || calendars[0];

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
