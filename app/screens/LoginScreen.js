import React, { useState } from "react";
import {
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  View,
} from "react-native";
import * as Yup from "yup";

import Screen from "../components/Screen";
import { Form, FormField, SubmitButton } from "../components/forms";

import { Button } from "react-native-paper";

const validationSchema = Yup.object().shape({
  email: Yup.string().required().email().label("Email"),
  password: Yup.string().required().min(4).label("Password"),
});

function LoginScreen({ setIsLoggedIn }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async ({ email, password }) => {
    try {
      setLoading(true);

      const response = await fetch("http://192.168.8.217:5020/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      const data = isJson ? await response.json() : {};

      if (response.ok) {
        Alert.alert("✅ تم", data.message || "تم تسجيل الدخول بنجاح");
        setIsLoggedIn(true);
      } else {
        Alert.alert("❌ فشل", data.message || "بيانات غير صحيحة");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("⚠️ خطأ", `فشل الاتصال بالسيرفر:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      <Image style={styles.logo} source={require("../assets/logo.png")} />

      <Form
        initialValues={{ email: "", password: "" }}
        onSubmit={handleLogin}
        validationSchema={validationSchema}
      >
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          icon="email"
          keyboardType="email-address"
          name="email"
          placeholder="ايميل"
          textContentType="emailAddress"
        />
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          icon="lock"
          name="password"
          placeholder="الرقم السري"
          secureTextEntry
          textContentType="password"
        />
        <SubmitButton title="تسجيل دخول" disabled={loading} />
        {/* احذفي للاختبار بس */}
        <Button
          textStyle={{ color: "white" }}
          style={{ backgroundColor: "red", color: "white" }}
          title="تخطي"
          onPress={() => {
            Alert.alert("🔓 تم", "تم تخطي تسجيل الدخول");
            setIsLoggedIn(true);
          }}
        />
      </Form>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  logo: {
    width: 130,
    height: 100,
    alignSelf: "center",
    marginTop: 50,
    marginBottom: 20,
  },
  loading: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
});

export default LoginScreen;
