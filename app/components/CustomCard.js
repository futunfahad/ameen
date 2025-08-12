// CustomCard.js
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppText from "./Text";

export default function CustomCard({
  title,
  value,
  onChangeText,
  placeholder,
  height = 200,
  items = [],
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.cardWrapper}>
      <AppText style={styles.title}>{title}</AppText>

      <View
        style={[
          styles.card,
          expanded
            ? { minHeight: height + 50 }
            : { minHeight: height, maxHeight: height },
        ]}
      >
        {/* 1) Scrollable text area */}
        <ScrollView style={styles.scrollArea}>
          <TextInput
            style={[
              styles.input,
              expanded && { minHeight: 100, paddingTop: 45 },
            ]}
            placeholder={placeholder}
            placeholderTextColor="#888"
            multiline
            textAlign="right"
            scrollEnabled={false}
            textAlignVertical="top"
            value={value}
            onChangeText={onChangeText}
          />
        </ScrollView>

        {/* 2) Expand/collapse button */}
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.expandButton}
        >
          <MaterialCommunityIcons
            name={expanded ? "arrow-up-bold" : "arrow-down-bold"}
            size={24}
            color="#888"
          />
        </TouchableOpacity>

        {/* 3) Action icons */}
        <View style={styles.iconsContainer}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={
                typeof item.onPress === "function"
                  ? item.onPress
                  : () =>
                      Alert.alert(
                        "زر",
                        `تم الضغط على زر الأيقونة: ${item.icon}`
                      )
              }
              style={[
                styles.icon,
                index !== items.length - 1 && { marginLeft: 10 },
                { backgroundColor: item.color || "#ccc" },
              ]}
            >
              <MaterialCommunityIcons name={item.icon} size={20} color="#fff" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: "right",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    elevation: 4,
    position: "relative",
  },
  scrollArea: {
    flex: 1,
    zIndex: 0, // ensure this sits beneath the icons
  },
  input: {
    fontSize: 16,
    color: "#000",
    textAlignVertical: "top",
    padding: 5,
    paddingTop: 45,
  },
  expandButton: {
    position: "absolute",
    left: 10,
    top: 10,
    zIndex: 2,
  },
  iconsContainer: {
    position: "absolute",
    right: 10,
    top: 10,
    flexDirection: "row-reverse",
    zIndex: 2, // bring icons above the ScrollView
  },
  icon: {
    padding: 8,
    borderRadius: 20,
  },
});
