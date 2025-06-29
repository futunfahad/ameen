import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Button } from "react-native";
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
import { setupModel, AVAILABLE_MODELS } from "../../services/llamaModels";

export default function MeetingSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const passedText = route.params?.transcribedText || "";
  const audioUri = route.params?.audioUri || "";

  const { addMeeting } = useMeetingContext();

  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [originalText, setOriginalText] = useState(passedText);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0] || "qwen");

  useEffect(() => {
    const processMeeting = async () => {
      if (!originalText) return;

      try {
        // 👇 أولًا: نحصل على الملخص ونفس الجلسة من LLaMA المحلي
        const { summary, chat } = await fetchSummary(originalText);

        // 👇 ثانيًا: نسأل النموذج المحلي عن التواريخ بنفس الجلسة
        const datesResponse = await chat.prompt(`استخرج لي أهم التواريخ من هذا النص:\n${originalText}`);
        const datesList = datesResponse.message.content
          .split("\n")
          .map(line => line.trim())
          .filter(line => line !== "");

        // 👇 نعالج النتائج ونحدث الواجهة
        const datesText = datesList.length > 0 ? datesList.join("\n") : "لا توجد تواريخ مستخرجة.";
        setInput1(summary);
        setInput2(datesText);

        const createdAt = new Date().toISOString();
        addMeeting(originalText, summary, datesList, audioUri, createdAt);

        await addDatesToCalendar(datesList, summary);
      } catch (err) {
        console.error("❌ خطأ:", err);
        Alert.alert("خطأ", err.message);
      }
    };

    processMeeting();
  }, [selectedModel]);

  const fetchSummary = async (text) => {
    const chat = await setupModel(selectedModel);
    const summaryResponse = await chat.prompt(`لخص النص التالي:\n${text}`);
    const summary = summaryResponse.message.content || "";
    return { summary, chat }; // 👈 نرجع الملخص + الجلسة عشان نستخدمها للسؤال الثاني
  };

  const addDatesToCalendar = async (datesArray, title) => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("❌", "لم يتم منح صلاحية الوصول إلى التقويم");
      return;
    }

    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT
    );
    const defaultCalendar =
      calendars.find((c) => c.allowsModifications) || calendars[0];

    for (const dateStr of datesArray) {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        await Calendar.createEventAsync(defaultCalendar.id, {
          title: title || "حدث اجتماع",
          startDate: parsedDate,
          endDate: new Date(parsedDate.getTime() + 60 * 60 * 1000),
          timeZone: "Asia/Riyadh",
        });
      }
    }
  };

  const handleNavigateToHistory = () => {
    navigation.navigate("History");
  };
  const handleNavigateToTranscription = () => {
    navigation.navigate("Transcription");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AudioPlayer uri={audioUri} />

      <Button
        title={`النموذج الحالي: ${selectedModel}`}
        onPress={() =>
          Alert.alert("اختيار النموذج", "اختر النموذج:", [
            ...AVAILABLE_MODELS.map((model) => ({
              text: model,
              onPress: () => setSelectedModel(model),
            })),
          ])
        }
      />

      <CustomCard
        title="ملخص الاجتماع"
        value={input1}
        onChangeText={setInput1}
        placeholder="سيظهر الملخص هنا..."
        height={220}
        items={[
          {
            icon: "pen",
            color: colors.primary,
            onPress: () => Alert.alert("🔧", "تعديل الملخص"),
          },
          {
            icon: "content-copy",
            color: colors.secondary,
            onPress: () => {
              Clipboard.setString(input1);
              Alert.alert("📋", "تم نسخ الملخص");
            },
          },
          {
            icon: "share-variant",
            color: colors.secondary,
            onPress: async () => {
              const fileUri = FileSystem.cacheDirectory + "summary.txt";
              await FileSystem.writeAsStringAsync(fileUri, input1);
              Sharing.shareAsync(fileUri);
            },
          },
        ]}
      />

      <CustomCard
        title="تواريخ تهمك"
        value={input2}
        onChangeText={setInput2}
        placeholder="سيتم عرض التواريخ هنا..."
        height={220}
        items={[
          {
            icon: "calendar",
            color: colors.primary,
            onPress: () => Alert.alert("📆", "عرض التقويم"),
          },
          {
            icon: "content-copy",
            color: colors.secondary,
            onPress: () => {
              Clipboard.setString(input2);
              Alert.alert("📋", "تم نسخ التواريخ");
            },
          },
          {
            icon: "share-variant",
            color: colors.secondary,
            onPress: async () => {
              const fileUri = FileSystem.cacheDirectory + "dates.txt";
              await FileSystem.writeAsStringAsync(fileUri, input2);
              Sharing.shareAsync(fileUri);
            },
          },
        ]}
      />

      <View style={{ paddingBottom: 40 }}>
        <SecondaryButton
          text="عرض سجل المحفوظات"
          color={colors.secondary}
          onPress={handleNavigateToHistory}
        />
        <SecondaryButton
          text="العودة إلى صفحة النص المستخرج ←"
          color={colors.primary}
          onPress={handleNavigateToTranscription}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 20,
    paddingTop: 25,
  },
});
