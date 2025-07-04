import React from "react";
import { View, StyleSheet, Image, Text } from "react-native";

function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Top-right decorative image */}
      <Image
        style={styles.topRight}
        source={require("../assets/topright.png")}
        resizeMode="contain"
      />

      {/* Centered logo and tagline */}
      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require("../assets/logo.png")} />
        <Text style={styles.tagline}>
          آمين مجلسك الذكي لإدارة اجتماعاتك بفعالية، يوفر التلخيص الفوري، تتبع
          المواعيد النهائية، وتنظيم القرارات بسهولة.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#f2f2f2", // or your desired background color
  },
  topRight: {
    position: "absolute",
    top: 0,
    left: -10,
    width: 170,
    height: 170,
  },
  logoContainer: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 130,
  },
  tagline: {
    fontSize: 20,
    fontWeight: "600",
    paddingHorizontal: 20,
    textAlign: "center",
    marginTop: 20,
  },
});

export default WelcomeScreen;
