import React from "react";
import { ImageBackground, StyleSheet, View, Image, Text } from "react-native";

import Button from "../components/Button";
import routes from "../navigation/routes";

function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.background}>
      <Image
        style={styles.topright}
        source={require("../assets/topright.png")}
        resizeMode="contain"
      />

      <View style={styles.logoContainer}>
        <Image style={styles.logo} source={require("../assets/logo.png")} />

        <Text style={styles.tagline}>
          آمين مجلسك الذكي لإدارة اجتماعاتك بفعالية، يوفر التلخيص الفوري، تتبع
          المواعيد النهائية، وتنظيم القرارات بسهولة.
        </Text>
      </View>
      <View style={styles.buttonsContainer}>
        <Button
          title="تسجيل دخول"
          onPress={() => navigation.navigate(routes.LOGIN)}
        />
        <Button
          title="انشاء حساب"
          color="secondary"
          onPress={() => navigation.navigate(routes.REGISTER)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  buttonsContainer: {
    padding: 20,
    width: "100%",
  },
  logo: {
    width: 150,
    height: 130,
  },
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
  },
});

export default WelcomeScreen;
