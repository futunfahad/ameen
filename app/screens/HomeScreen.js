import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import colors from "../config/colors";

function HomeScreen() {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const navigation = useNavigation();

  // ✅ بدء التسجيل
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("الصلاحية مطلوبة", "يجب السماح باستخدام الميكروفون.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      console.log("🎙️ تم بدء التسجيل...");
    } catch (err) {
      console.error("❌ فشل بدء التسجيل:", err);
    }
  };

  // ✅ إيقاف التسجيل
  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log("✅ تم حفظ التسجيل:", uri);
      setRecording(null);
      setRecordingUri(uri);
    } catch (err) {
      console.error("❌ فشل إيقاف التسجيل:", err);
    }
  };

  // ✅ عند الضغط على زر التسجيل
  const handlePress = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ✅ الانتقال لصفحة التفريغ مع تمرير uri
  const goToTranscription = () => {
    if (recordingUri) {
      navigation.navigate("Transcription", { uri: recordingUri });
    } else {
      Alert.alert("لا يوجد تسجيل", "يرجى تسجيل الصوت أولاً");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <MaterialCommunityIcons
          name={recording ? "microphone" : "microphone-outline"}
          color={colors.primary}
          size={150}
        />
      </TouchableOpacity>

      {recordingUri && (
        <TouchableOpacity style={styles.transcriptionButton} onPress={goToTranscription}>
          <Text style={styles.transcriptionText}>عرض النص المستخرج</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f4f4",
    padding: 20,
  },
  button: {
    backgroundColor: colors.white,
    width: 250,
    height: 250,
    borderRadius: 125,
    borderColor: colors.primary,
    borderWidth: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  transcriptionButton: {
    marginTop: 40,
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  transcriptionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default HomeScreen;
