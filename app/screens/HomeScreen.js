import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"; // ✅ Add this

import colors from "../config/colors";

function HomeScreen(props) {
  const navigation = useNavigation(); // ✅ Hook to access navigation

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button}>
        <MaterialCommunityIcons
          name="microphone-outline"
          color={colors.primary}
          size={150}
          onPress={() => navigation.navigate("Transcription")}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Takes the full screen
    justifyContent: "center", // Centers vertically
    alignItems: "center", // Centers horizontally
    backgroundColor: "#f8f4f4", // Change if needed
  },
  button: {
    backgroundColor: colors.white,
    width: 250,
    height: 250,
    borderRadius: 125, // Makes it circular
    borderColor: colors.primary,
    borderWidth: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5, // Adds shadow for Android
  },
});

export default HomeScreen;
