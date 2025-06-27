import React, { useState } from "react";
import { StyleSheet, Alert, ActivityIndicator, View, Text } from "react-native";
import * as Yup from "yup";

import Screen from "../components/Screen";
import { Form, FormField, SubmitButton } from "../components/forms";

const validationSchema = Yup.object().shape({
  name: Yup.string().required().label("Name"),
  email: Yup.string().required().email().label("Email"),
  password: Yup.string().required().min(4).label("Password"),
});

function RegisterScreen({ setIsLoggedIn }) {
  const [loading, setLoading] = useState(false);

  const handleRegister = async ({ name, email, password }) => {
    try {
      setLoading(true);

      const response = await fetch("http://192.168.8.217:5020/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: name,
          email,
          password,
        }),
      });

      const contentType = response.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");

      const data = isJson ? await response.json() : {};

      if (response.ok) {
        Alert.alert("✅ تم", data.message || "تم إنشاء الحساب بنجاح");
        setIsLoggedIn(true);
      } else {
        Alert.alert("❌ فشل", data.message || "حدث خطأ أثناء التسجيل");
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("⚠️ خطأ", `فشل الاتصال بالسيرفر:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.container}>
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>جاري إنشاء الحساب...</Text>
        </View>
      )}

      <Form
        initialValues={{ name: "", email: "", password: "" }}
        onSubmit={handleRegister}
        validationSchema={validationSchema}
      >
        <FormField
          autoCorrect={false}
          icon="account"
          name="name"
          placeholder="Name"
        />
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          icon="email"
          keyboardType="email-address"
          name="email"
          placeholder="Email"
          textContentType="emailAddress"
        />
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          icon="lock"
          name="password"
          placeholder="Password"
          secureTextEntry
          textContentType="password"
        />
        <SubmitButton title="تسجيل حساب جديد" disabled={loading} />
      </Form>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  loadingBox: {
    alignItems: "center",
    marginBottom: 15,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default RegisterScreen;
