import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "../config/colors"; // ✅ Adjust path to your colors.js

export default function HistoryScreen() {
  const handleFilterPress = () => {
    Alert.alert("فلترة", "تم الضغط على زر الفلترة");
  };

  const handleSearchPress = () => {
    Alert.alert("بحث", "تم الضغط على زر البحث");
  };

  const handleEnterPress = (index) => {
    Alert.alert("دخول", `تم الدخول إلى العنصر رقم ${index + 1}`);
  };

  const handleSchedulePress = (index) => {
    Alert.alert("الجدول", `تم الضغط على الجدول للعنصر رقم ${index + 1}`);
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
        {[1, 2, 3].map((item, index) => (
          <View key={index} style={styles.card}>
            {/* Schedule icon (clickable) */}
            <TouchableOpacity onPress={() => handleSchedulePress(index)}>
              <MaterialCommunityIcons
                name="calendar-month"
                size={28}
                color={colors.secondary}
                style={styles.iconRight}
              />
            </TouchableOpacity>

            {/* Card Text */}
            <Text style={styles.cardText}>مناقشة مشروع تخرج {item}</Text>

            {/* Enter icon (clickable) */}
            <TouchableOpacity onPress={() => handleEnterPress(index)}>
              <MaterialCommunityIcons
                name="arrow-left-circle"
                size={28}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
        ))}
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
  cardText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "right",
    marginHorizontal: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
});
