// screens/ArchiveScreen.js
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Text } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

import colors from "../config/colors";
import CustomCard from "../components/CustomCard";
import AudioPlayer from "../components/AudioPlayer";
import { useMeetingContext } from "../context/MeetingContext";
import { useRoute } from "@react-navigation/native";

export default function ArchiveScreen() {
  const { id } = useRoute().params || {};
  const { getFullMeeting } = useMeetingContext();

  const [item, setItem] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const m = await getFullMeeting(id);
        if (!m) throw new Error("لا يوجد بيانات");
        setItem(m);
      } catch (e) {
        Alert.alert("خطأ", "فشل تحميل تفاصيل الاجتماع");
      }
    })();
  }, [id]);

  if (!item) {
    return (
      <View style={styles.loading}>
        <Text>جارٍ التحميل…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {item.audioUri ? <AudioPlayer uri={item.audioUri} /> : null}

        <CustomCard
          title="موضوع الاجتماع"
          value={item.topic}
          editable={false}
          height={60}
        />

        <CustomCard
          title="النص الأصلي"
          value={item.text}
          editable={false}
          height={200}
        />

        <CustomCard
          title="ملخص الاجتماع"
          value={item.summary}
          editable={false}
          height={200}
          items={[
            {
              icon: "content-copy",
              color: colors.secondary,
              onPress: () => {
                Clipboard.setString(item.summary);
                Alert.alert("📋", "تم نسخ الملخص");
              },
            },
            {
              icon: "share-variant",
              color: colors.secondary,
              onPress: async () => {
                const path = FileSystem.cacheDirectory + "summary.txt";
                await FileSystem.writeAsStringAsync(path, item.summary);
                Sharing.shareAsync(path);
              },
            },
          ]}
        />

        <CustomCard
          title="تواريخ مهمة"
          value={item.importantDates.join("\n")}
          editable={false}
          height={150}
          items={[
            {
              icon: "calendar",
              color: colors.primary,
              onPress: () =>
                Alert.alert(
                  "تواريخ",
                  item.importantDates.length
                    ? item.importantDates.join("\n")
                    : "لا توجد تواريخ"
                ),
            },
            {
              icon: "content-copy",
              color: colors.secondary,
              onPress: () => {
                Clipboard.setString(item.importantDates.join("\n"));
                Alert.alert("📋", "تم نسخ التواريخ");
              },
            },
          ]}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#f2f2f2", padding: 20 },
});
