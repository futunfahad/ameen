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

  const { meetings } = useContext(MeetingContext);

  const handleFilterPress = () => {
    Alert.alert("فلترة", "تم الضغط على زر الفلترة");
  };

  const handleSearchPress = () => {
    Alert.alert("بحث", "تم الضغط على زر البحث");
  };

  const handleEnterPress = (item) => {
    navigation.navigate("Archive");
  };

  const handleSchedulePress = (item) => {
    Alert.alert("تواريخ", item.importantDates || "لا توجد تواريخ محفوظة");
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
          <Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
            لا توجد اجتماعات محفوظة حتى الآن.
          </Text>
        ) : (
          meetings.map((item, index) => (
            <View key={index} style={styles.card}>
              {/* Calendar icon */}
              <TouchableOpacity onPress={() => handleSchedulePress(item)}>
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={28}
                  color={colors.secondary}
                  style={styles.iconRight}
                />
              </TouchableOpacity>

              {/* Meeting summary or text */}
              <Text style={styles.cardText} numberOfLines={1}>
                {item.summary || item.text || "اجتماع بدون عنوان"}
              </Text>

              {/* Enter icon */}
              <TouchableOpacity onPress={() => handleEnterPress(item)}>
                <MaterialCommunityIcons
                  name="arrow-left-circle"
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
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
