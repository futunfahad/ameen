import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import colors from "../config/colors";
import { MeetingContext } from "../context/MeetingContext";

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { meetings, deleteMeeting } = useContext(MeetingContext);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [datesModalVisible, setDatesModalVisible] = useState(false);

  const formatDatesForDisplay = (dates) => {
    if (!Array.isArray(dates) || dates.length === 0) return "لا توجد تواريخ";

    return dates
      .slice(0, 2) // Show only first 2 dates in history view
      .map((date) => {
        const time = date.time === "00:00" ? "" : ` - ${date.time}`;
        return `${date.date}${time} - ${date.title}`;
      })
      .join("\n");
  };

  const handleEnterPress = (id) => {
    if (!id) {
      Alert.alert("خطأ", "لا يمكن فتح هذا السجل: معرّف مفقود");
      return;
    }
    navigation.navigate("Archive", { id });
  };

  const showDatesModal = (meeting) => {
    setSelectedMeeting(meeting);
    setDatesModalVisible(true);
  };

  const confirmDelete = (id) => {
    Alert.alert(
      "حذف السجل",
      "هل أنت متأكد من حذف هذا الاجتماع؟ لا يمكن التراجع.",
      [
        { text: "إلغاء", style: "cancel" },
        { text: "حذف", style: "destructive", onPress: () => deleteMeeting(id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {meetings.length === 0 ? (
          <Text style={styles.emptyText}>
            لا توجد اجتماعات محفوظة حتى الآن.
          </Text>
        ) : (
          meetings.map((item) => {
            const hasDates = item.importantDates?.length > 0;
            return (
              <View key={item.id} style={styles.card}>
                {/* Calendar icon */}
                <TouchableOpacity onPress={() => showDatesModal(item)}>
                  <MaterialCommunityIcons
                    name="calendar-month"
                    size={24}
                    color={hasDates ? colors.secondary : "#ccc"}
                    style={styles.calendarIcon}
                  />
                </TouchableOpacity>

                {/* Details */}
                <View style={styles.details}>
                  <Text style={styles.title} numberOfLines={1}>
                    📌{" "}
                    {item.topic?.trim()
                      ? item.topic
                      : item.summary || item.text || "اجتماع بدون عنوان"}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    📝{" "}
                    {item.summary?.trim() || item.text?.trim() || "بدون ملخص"}
                  </Text>
                  {hasDates && (
                    <Text style={styles.datesText} numberOfLines={1}>
                      📅 {formatDatesForDisplay(item.importantDates)}
                    </Text>
                  )}
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => handleEnterPress(item.id)}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons
                      name="arrow-left-circle"
                      size={28}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item.id)}
                    style={styles.actionButton}
                  >
                    <MaterialCommunityIcons
                      name="delete"
                      size={26}
                      color={colors.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Scrollable Dates Modal - Same as ArchiveScreen */}
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
              {selectedMeeting?.importantDates?.length > 0 ? (
                selectedMeeting.importantDates.map((date, index) => (
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
                    {index < selectedMeeting.importantDates.length - 1 && (
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
    </SafeAreaView>
  );
}

const windowHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  calendarIcon: {
    marginHorizontal: 8,
  },
  details: {
    flex: 1,
    paddingVertical: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "right",
    marginTop: 2,
  },
  datesText: {
    fontSize: 12,
    color: colors.primary,
    textAlign: "right",
    marginTop: 2,
  },
  actions: {
    flexDirection: "column",
    alignItems: "center",
    marginLeft: 8,
  },
  actionButton: {
    marginVertical: 4,
  },
  // Modal styles (same as ArchiveScreen)
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
