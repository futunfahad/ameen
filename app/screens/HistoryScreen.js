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

  const handleFilterPress = () => {
    Alert.alert("فلترة", "تم الضغط على زر الفلترة");
  };

  const handleSearchPress = () => {
    Alert.alert("بحث", "تم الضغط على زر البحث");
  };

  const handleEnterPress = (id) => {
    if (!id) {
      Alert.alert("خطأ", "لا يمكن فتح هذا السجل: معرّف مفقود");
      return;
    }
    // Navigate to the Archive screen, passing only the id
    navigation.navigate("Archive", { id });
  };

  const handleSchedulePress = (item) => {
    Alert.alert(
      "تواريخ",
      Array.isArray(item.importantDates) && item.importantDates.length > 0
        ? item.importantDates.join("\n")
        : "لا توجد تواريخ محفوظة"
    );
  };

  const confirmDelete = (id) => {
    Alert.alert(
      "حذف السجل",
      "هل أنت متأكد من حذف هذا الاجتماع؟ لا يمكن التراجع.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: () => deleteMeeting(id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>سجل المحفوظات:</Text>

        <View style={styles.iconGroup}>
          <TouchableOpacity
            onPress={handleFilterPress}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={24}
              color={colors.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSearchPress}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color={colors.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards */}
      <ScrollView style={styles.body}>
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
                  size={28}
                  color={colors.secondary}
                  style={styles.iconRight}
                />
              </TouchableOpacity>

              {/* Meeting details */}
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  📝 {item.preview || "اجتماع بدون عنوان"}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  📅{" "}
                  {Array.isArray(item.importantDates) &&
                  item.importantDates.length > 0
                    ? item.importantDates.join(", ")
                    : "لا توجد تواريخ"}
                </Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  🎤 {item.audioUri ? "يوجد تسجيل صوتي" : "بدون تسجيل"}
                </Text>
              </View>

              {/* Enter & Delete icons (vertical) */}
              <View style={styles.actionsColumn}>
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
    padding: 20,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.medium,
  },
  iconGroup: {
    flexDirection: "row-reverse",
  },
  iconButton: {
    marginLeft: 10,
  },
  body: {
    flex: 1,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  card: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    marginBottom: 15,
    elevation: 2,
  },
  iconRight: {
    marginLeft: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "right",
    marginBottom: 2,
  },
  actionsColumn: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginVertical: 6,
  },
});
