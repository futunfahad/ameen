import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import colors from "../config/colors";
import CustomCard from "../components/CustomCard";
import AudioPlayer from "../components/AudioPlayer";

export default function ArchiveScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const meetings = route.params?.meetings || [];
  const currentIndex = route.params?.currentIndex ?? 0;
  const item = meetings[currentIndex];

  const [summary, setSummary] = useState(item?.summary || "");
  const [datesTxt, setDatesTxt] = useState(
    Array.isArray(item?.importantDates)
      ? item.importantDates.join("\n")
      : item?.importantDates || ""
  );

  if (!item) {
    return (
      <View style={styles.container}>
        <Text>لا يوجد اجتماع.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {item.audioUri && <AudioPlayer uri={item.audioUri} />}

        <CustomCard
          title="النص الأصلي"
          value={item.text}
          editable={false}
          placeholder="سيظهر النص هنا…"
          height={200}
        />

        <CustomCard
          title="ملخص الاجتماع"
          value={summary}
          onChangeText={setSummary}
          placeholder="سيظهر الملخص هنا…"
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
          title="تواريخ مهمة"
          value={datesTxt}
          onChangeText={setDatesTxt}
          placeholder="سيتم عرض التواريخ هنا…"
          height={200}
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

        <View style={styles.navButtons}>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                navigation.replace("Archive", {
                  meetings,
                  currentIndex: currentIndex - 1,
                })
              }
            >
              <Text style={styles.navButtonText}>← الاجتماع السابق</Text>
            </TouchableOpacity>
          )}

          {currentIndex < meetings.length - 1 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                navigation.replace("Archive", {
                  meetings,
                  currentIndex: currentIndex + 1,
                })
              }
            >
              <Text style={styles.navButtonText}>الاجتماع التالي →</Text>
            </TouchableOpacity>
          )}
        </View>
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
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: colors.secondary,
    borderRadius: 8,
  },
  navButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
