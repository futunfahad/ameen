import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AudioRecord from "react-native-audio-record";
import * as FileSystem from "expo-file-system";
import colors from "../config/colors";
import SecondaryButton from "../components/SecondaryButton";

const NUM_BARS = 20;

export default function HomeScreen() {
  const [recording, setRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [recorderReady, setRecorderReady] = useState(false);
  const navigation = useNavigation();

  const barHeights = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(10))
  ).current;
  const volumeInterval = useRef(null);

  useEffect(() => {
    const initRecorder = async () => {
      try {
        let granted = true;

        if (Platform.OS === "android") {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          granted = result === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (!granted) {
          Alert.alert("❌ الصلاحيات مرفوضة", "يجب السماح بالوصول للميكروفون.");
          return;
        }

        AudioRecord.init({
          sampleRate: 16000,
          channels: 1,
          bitsPerSample: 16,
          wavFile: "speech.wav",
          audioSource: 6,
        });

        setRecorderReady(true);
      } catch (err) {
        Alert.alert("خطأ", "فشل تهيئة المسجل: " + err.message);
      }
    };

    initRecorder();
  }, []);

  const animateBars = () => {
    barHeights.forEach((bar) => {
      Animated.timing(bar, {
        toValue: 10 + Math.random() * 60,
        duration: 150,
        useNativeDriver: false,
      }).start();
    });
  };

  const startRecording = async () => {
    if (!recorderReady) {
      Alert.alert("⏳", "المايكروفون غير جاهز بعد");
      return;
    }

    setRecordingUri(null);
    AudioRecord.start();
    setRecording(true);
    volumeInterval.current = setInterval(() => animateBars(), 150);
  };

  const stopRecording = async () => {
    const filePath = await AudioRecord.stop();
    clearInterval(volumeInterval.current);
    setRecording(false);
    setRecordingUri("file://" + filePath);
  };

  const handlePress = () => {
    recording ? stopRecording() : startRecording();
  };

  const goToTranscription = () => {
    if (recordingUri)
      navigation.navigate("Transcription", { uri: recordingUri });
  };

  const handleDelete = async () => {
    try {
      if (recordingUri) {
        const uri = recordingUri.startsWith("file://")
          ? recordingUri
          : "file://" + recordingUri;
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
      setRecordingUri(null);
      Alert.alert("🗑️", "تم حذف التسجيل");
    } catch (e) {
      Alert.alert("خطأ", "تعذر حذف التسجيل: " + (e?.message || e));
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.micButton} onPress={handlePress}>
        <MaterialCommunityIcons
          name={recording ? "microphone" : "microphone-outline"}
          size={150}
          color={colors.primary}
        />
      </TouchableOpacity>

      {recording && (
        <View style={styles.waveform}>
          {barHeights.map((bar, i) => (
            <Animated.View key={i} style={[styles.bar, { height: bar }]} />
          ))}
        </View>
      )}

      {recordingUri && !recording && (
        <>
          {/* نفس الأيقونة التي كانت عندك */}
          <TouchableOpacity
            onPress={goToTranscription}
            style={{ marginTop: 30 }}
          >
            <MaterialCommunityIcons
              name="file-document-outline"
              size={40}
              color={colors.secondary}
            />
          </TouchableOpacity>

          {/* الأزرار التي سألت عنها: عرض النص + حذف التسجيل */}
          <View style={{ width: "80%", marginTop: 16 }}>
            <SecondaryButton
              text="عرض النص المستخرج"
              color={colors.secondary}
              onPress={goToTranscription}
            />
            <SecondaryButton
              text="حذف التسجيل"
              color={colors.secondary}
              onPress={handleDelete}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
  },
  micButton: {
    backgroundColor: colors.white,
    width: 250,
    height: 250,
    borderRadius: 125,
    borderColor: colors.primary,
    borderWidth: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    marginBottom: 15,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginTop: 30,
    height: 100,
  },
  bar: {
    width: 10,
    marginHorizontal: 3,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
});
