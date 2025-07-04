import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Text } from "react-native";
import { useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import colors from "../config/colors";
import CustomCard from "../components/CustomCard";

export default function ArchiveScreen() {
  const route = useRoute();
  const item = route.params?.item || {};

  // Pre-fill from navigation params (HistoryScreen)
  const [summary, setSummary] = useState(item.summary || "");
  const [datesTxt, setDatesTxt] = useState(
    Array.isArray(item.importantDates)
      ? item.importantDates.join("\n")
      : item.importantDates || ""
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 20,
  },
});
