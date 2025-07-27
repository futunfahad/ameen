import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import colors from "../config/colors";

function ListingButton({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.buttonContainer}>
      <View style={styles.button}>
        <MaterialCommunityIcons
          name="calendar-month-outline"
          color={colors.secondary}
          size={50}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: "absolute",
    bottom: 10, // Adjust to place above the tab bar
    alignSelf: "center", // Centers horizontally in the tab bar
    zIndex: 10, // Ensures it's above other elements
  },
  button: {
    backgroundColor: colors.white,
    width: 70,
    height: 70,
    borderRadius: 35, // Makes it circular
    justifyContent: "center",
    alignItems: "center",

    // Shadow settings

    elevation: 10, // For Android shadow
  },
});

export default ListingButton;
