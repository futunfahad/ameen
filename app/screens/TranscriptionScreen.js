import React from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // ✅ Add this

import colors from "../config/colors";
import AppText from "../components/Text";

export default function TranscriptionScreen() {
  const navigation = useNavigation(); // ✅ Hook for navigation

  const handleLeftIconPress = () => {
    Alert.alert("رجوع", "تم الضغط على زر الرجوع");
  };

  const handleRightIconPress = () => {
    Alert.alert("إغلاق", "تم الضغط على زر الإغلاق");
  };

  const handlePlayPress = () => {
    Alert.alert("تشغيل الصوت", "جاري تشغيل التسجيل الصوتي");
  };

  const handleNavigateToSummary = () => {
    navigation.navigate("Summary"); // ✅ Navigates to MeetingSummaryScreen
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <AppText style={{ fontSize: 25, marginBottom: 20 }}>
        النص المستخرج من اجتماعك
      </AppText>

      {/* Audio Row */}
      <View style={styles.audioRow}>
        <Image
          source={require("../assets/audio.png")}
          style={{ width: 150, height: 60 }}
        />
        <TouchableOpacity onPress={handlePlayPress}>
          <MaterialCommunityIcons
            name="play-circle-outline"
            size={50}
            color={colors.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.iconRow}>
          <TouchableOpacity
            onPress={handleLeftIconPress}
            style={[styles.iconWrapper, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="pen" size={25} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.iconWrapper}
          >
            <MaterialCommunityIcons name="account" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="اكتب هنا..."
            placeholderTextColor="#888"
            multiline
            textAlign="right"
          />
        </View>
      </View>

      {/* ✅ Bottom Button */}
      <TouchableOpacity
        style={styles.summaryButton}
        onPress={handleNavigateToSummary}
      >
        <AppText style={styles.buttonText}>الذهاب إلى الملخص</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  audioRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
    justifyContent: "center",
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconWrapper: {
    backgroundColor: colors.secondary,
    padding: 8,
    borderRadius: 20,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    textAlignVertical: "top",
  },
  summaryButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
