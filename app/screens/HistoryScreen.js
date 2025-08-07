// screens/HistoryScreen.js
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import colors from "../config/colors";
import { MeetingContext } from "../context/MeetingContext";

export default function HistoryScreen() {
  const navigation = useNavigation();
  const { meetings, deleteMeeting } = useContext(MeetingContext);

  const handleEnterPress = (id) => {
    if (!id) {
      Alert.alert("خطأ", "لا يمكن فتح هذا السجل: معرّف مفقود");
      return;
    }
    navigation.navigate("Archive", { id });
  };

  const handleSchedulePress = (item) => {
    Alert.alert(
      "تواريخ",
      item.importantDates.length
        ? item.importantDates.join("\n")
        : "لا توجد تواريخ"
    );
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
    <View style={styles.container}>
      <ScrollView>
        {meetings.length === 0 ? (
          <Text style={styles.emptyText}>
            لا توجد اجتماعات محفوظة حتى الآن.
          </Text>
        ) : (
          meetings.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* Calendar icon */}
              <TouchableOpacity onPress={() => handleSchedulePress(item)}>
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={24}
                  color={colors.secondary}
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
                  📝 {item.summary?.trim() || item.text?.trim() || "بدون ملخص"}
                </Text>
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
                    color="#d11a2a"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

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
  actions: {
    flexDirection: "column",
    alignItems: "center",
    marginLeft: 8,
  },
  actionButton: {
    marginVertical: 4,
  },
});
