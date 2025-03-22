import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "../config/colors"; // adjust path if needed
import AppText from "../components/Text"; // adjust path if needed

export default function MeetingSummaryScreen() {
  const [isExpanded1, setIsExpanded1] = useState(false);
  const [isExpanded2, setIsExpanded2] = useState(false);
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Audio Row */}
      <View style={styles.audioRow}>
        <Image
          source={require("../assets/audio.png")} // adjust path if needed
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

      {/* Title */}
      <AppText style={styles.cardTitle}>ملخص الاجتماع</AppText>

      {/* Card 1 */}
      <View
        style={[
          styles.card,
          isExpanded1 ? { minHeight: 200 } : { minHeight: 200, maxHeight: 180 },
        ]}
      >
        <TouchableOpacity
          onPress={() => setIsExpanded1(!isExpanded1)}
          style={styles.expandIconAbsolute}
        >
          <MaterialCommunityIcons
            name={isExpanded1 ? "arrow-up-bold" : "arrow-down-bold"}
            size={25}
            color={colors.secondary}
          />
        </TouchableOpacity>

        <View style={styles.iconRow}>
          <TouchableOpacity
            onPress={handleLeftIconPress}
            style={[styles.iconWrapper, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="pen" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={!isExpanded1}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isExpanded1}
          >
            <TextInput
              style={[styles.input, isExpanded1 && { minHeight: 100 }]}
              placeholder="اكتب هنا..."
              placeholderTextColor="#888"
              multiline
              textAlign="right"
              scrollEnabled={false}
              textAlignVertical="top"
              value={input1}
              onChangeText={setInput1}
            />
          </ScrollView>
        </View>
      </View>

      {/* Title */}
      <AppText style={styles.cardTitle}>تواريخ تهمك</AppText>

      {/* Card 2 */}
      <View
        style={[
          styles.card,
          isExpanded2 ? { minHeight: 200 } : { minHeight: 200, maxHeight: 180 },
        ]}
      >
        <TouchableOpacity
          onPress={() => setIsExpanded2(!isExpanded2)}
          style={styles.expandIconAbsolute}
        >
          <MaterialCommunityIcons
            name={isExpanded2 ? "arrow-up-bold" : "arrow-down-bold"}
            size={25}
            color={colors.secondary}
          />
        </TouchableOpacity>

        <View style={styles.iconRow}>
          <TouchableOpacity
            onPress={handleLeftIconPress}
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.primary, marginLeft: 10 },
            ]}
          >
            <MaterialCommunityIcons name="pen" size={25} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.iconWrapper}
          >
            <MaterialCommunityIcons name="download" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={!isExpanded2}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!isExpanded2}
          >
            <TextInput
              style={[styles.input, isExpanded2 && { minHeight: 100 }]}
              placeholder="اكتب هنا..."
              placeholderTextColor="#888"
              multiline
              textAlign="right"
              scrollEnabled={false}
              textAlignVertical="top"
              value={input2}
              onChangeText={setInput2}
            />
          </ScrollView>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
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
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    elevation: 5,
    shadowColor: "#000",

    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignSelf: "stretch",
    justifyContent: "flex-start",
    position: "relative",
  },
  cardTitle: {
    fontSize: 25,
    marginBottom: 10,
    textAlign: "right",
  },
  iconRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  iconWrapper: {
    backgroundColor: colors.secondary,
    padding: 8,
    borderRadius: 20,
  },
  inputContainer: {
    flex: 1,
    minHeight: 120,
    overflow: "hidden",
  },
  input: {
    fontSize: 16,
    color: "#000",
    textAlignVertical: "top",
    padding: 5,
  },
  expandIconAbsolute: {
    position: "absolute",
    left: 10,
    top: 10,
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
    backgroundColor: "transparent", // optional
  },
});
