import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";
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
  const [datesModalVisible, setDatesModalVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const m = await getFullMeeting(id);
        if (!m) throw new Error();
        setItem(m);
      } catch {
        Alert.alert("خطأ", "فشل تحميل تفاصيل الاجتماع");
      }
    })();
  }, [id]);

  const formatDatesForDisplay = (dates) => {
    if (!Array.isArray(dates)) return "لا توجد تواريخ";

    return dates
      .map((date) => {
        const time = date.time === "00:00" ? "" : ` - ${date.time}`;
        return `${date.date}${time} - ${date.title}`;
      })
      .join("\n");
  };

  const showDatesModal = () => {
    setDatesModalVisible(true);
  };

  if (!item) {
    return (
      <View style={styles.loading}>
        <Text>جارٍ التحميل…</Text>
      </View>
    );
  }

  const playerKey = `${item.id}:${item.audioUri}`;
  const formattedDates = formatDatesForDisplay(item.importantDates);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.topicText}>
          <Text style={styles.topicLabel}>موضوع الاجتماع: </Text>
          {item.topic?.trim() ? item.topic : "—"}
        </Text>

        {item.audioUri ? (
          <AudioPlayer key={playerKey} uri={item.audioUri} />
        ) : null}

        <CustomCard
          title="النص الأصلي"
          value={item.text}
          editable={false}
          height={200}
          items={[
            {
              icon: "content-copy",
              color: colors.secondary,
              onPress: () => {
                Clipboard.setString(item.text);
                Alert.alert("📋", "تم نسخ النص الأصلي");
              },
            },
            {
              icon: "share-variant",
              color: colors.secondary,
              onPress: async () => {
                const path = FileSystem.cacheDirectory + "original.txt";
                await FileSystem.writeAsStringAsync(path, item.text);
                Sharing.shareAsync(path);
              },
            },
          ]}
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
          value={formattedDates}
          editable={false}
          height={150}
          items={[
            {
              icon: "calendar",
              color: colors.primary,
              onPress: showDatesModal,
            },
            {
              icon: "content-copy",
              color: colors.secondary,
              onPress: () => {
                Clipboard.setString(formattedDates);
                Alert.alert("📋", "تم نسخ التواريخ");
              },
            },
          ]}
        />
      </ScrollView>

      {/* Scrollable Dates Modal */}
      <Modal
        visible={datesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDatesModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>التواريخ المهمة</Text>

            <ScrollView style={styles.datesScrollView}>
              {item.importantDates?.length > 0 ? (
                item.importantDates.map((date, index) => (
                  <View key={index} style={styles.dateItem}>
                    <Text style={styles.dateText}>
                      <Text style={styles.dateLabel}>التاريخ: </Text>
                      {date.date}
                    </Text>
                    {date.time !== "00:00" && (
                      <Text style={styles.dateText}>
                        <Text style={styles.dateLabel}>الوقت: </Text>
                        {date.time}
                      </Text>
                    )}
                    <Text style={styles.dateText}>
                      <Text style={styles.dateLabel}>الموضوع: </Text>
                      {date.title}
                    </Text>
                    {index < item.importantDates.length - 1 && (
                      <View style={styles.separator} />
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.noDatesText}>لا توجد تواريخ</Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDatesModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const windowHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#f2f2f2", padding: 20 },
  topicText: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: "right",
  },
  topicLabel: {
    fontWeight: "bold",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: windowHeight * 0.7,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: colors.primary,
  },
  datesScrollView: {
    maxHeight: windowHeight * 0.5,
  },
  dateItem: {
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 16,
    textAlign: "right",
    marginBottom: 5,
  },
  dateLabel: {
    fontWeight: "bold",
    color: colors.dark,
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
  },
  noDatesText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
  },
  closeButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
