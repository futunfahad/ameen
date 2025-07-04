import React from "react";
<<<<<<< HEAD
import { View, StyleSheet, Image, Text } from "react-native";

function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Top-right decorative image */}
      <Image
        style={styles.topRight}
=======
import { ImageBackground, StyleSheet, View, Image, Text } from "react-native";

function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.background}>
      <Image
        style={styles.topright}
>>>>>>> 1996626fccc7ee8595a2d4c73280e26fbf3a2a84
        source={require("../assets/topright.png")}
        resizeMode="contain"
      />

<<<<<<< HEAD
      {/* Centered logo and tagline */}
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require("../assets/logo.png")} />
=======
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require("../assets/logo.png")} />

>>>>>>> 1996626fccc7ee8595a2d4c73280e26fbf3a2a84
        <Text style={styles.tagline}>
          آمين مجلسك الذكي لإدارة اجتماعاتك بفعالية، يوفر التلخيص الفوري، تتبع
          المواعيد النهائية، وتنظيم القرارات بسهولة.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#f2f2f2", // or your desired background color
  },
  topRight: {
    position: "absolute",
    top: 0,
    right: -10,
    width: 170,
    height: 170,
  },
  logoContainer: {
    position: "absolute",
    top: 190,
    left: 0,
    right: 0,
    alignItems: "center",
  },
=======
  background: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  buttonsContainer: {
    padding: 20,
    width: "100%",
  },
>>>>>>> 1996626fccc7ee8595a2d4c73280e26fbf3a2a84
  logo: {
    width: 150,
    height: 130,
  },
<<<<<<< HEAD
  tagline: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 20,
    textAlign: "center",
    marginTop: 20,
=======
  logoContainer: {
    position: "absolute",
    top: 70,
    alignItems: "center",
    marginTop: 100,
  },
  tagline: {
    fontSize: 25,
    fontWeight: "600",
    paddingVertical: 20,
    paddingHorizontal: 10,
    textAlign: "center",
  },
  topright: {
    position: "absolute",
    right: 0,
    top: -170,
    width: 170, // Adjust width
>>>>>>> 1996626fccc7ee8595a2d4c73280e26fbf3a2a84
  },
});

export default WelcomeScreen;
