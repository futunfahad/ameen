// components/SecondaryButton.js
import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import AppText from "./Text";

export default function SecondaryButton({ text, color, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }]}
      onPress={onPress}
    >
      <AppText style={styles.text}>{text}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10, // added bottom margin
  },
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
