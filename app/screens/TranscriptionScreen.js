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

import colors from "../config/colors";
import AppText from "../components/Text";

export default function TranscriptionScreen() {
  const handleLeftIconPress = () => {
    Alert.alert("رجوع", "تم الضغط على زر الرجوع");
  };

  const handleRightIconPress = () => {
    Alert.alert("إغلاق", "تم الضغط على زر الإغلاق");
  };

  const handlePlayPress = () => {
    Alert.alert("تشغيل الصوت", "جاري تشغيل التسجيل الصوتي");
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <AppText style={{ fontSize: 25, marginBottom: 20 }}>
        النص المستخرج من اجتماعك
      </AppText>

      {/* Audio Row: Play icon + waveform */}
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

      {/* Card with Icons & Input */}
      <View style={styles.card}>
        {/* Top Icons */}
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

        {/* Text Input fills the rest */}
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
    marginBottom: 50,
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
});
