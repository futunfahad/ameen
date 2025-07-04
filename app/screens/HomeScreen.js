// screens/HomeScreen.js
import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import colors from "../config/colors";
import SecondaryButton from "../components/SecondaryButton";

const NUM_BARS = 20;

export default function HomeScreen() {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const volumeInterval = useRef(null);
  const barHeights = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(10))
  ).current;

  const animateBars = (amplitude = 0.5) => {
    barHeights.forEach((bar) => {
      const scale = Math.random() * amplitude + 0.1;
      Animated.timing(bar, {
        toValue: 10 + Math.pow(scale, 1.5) * 60,
        duration: 150,
        useNativeDriver: false,
      }).start();
    });
  };

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please enable microphone access.");
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.LOW_QUALITY
    );
    setRecording(recording);

    volumeInterval.current = setInterval(async () => {
      const { metering } = await recording.getStatusAsync();
      const amplitude = metering
        ? Math.max(0, 1 - Math.min(1, metering / -160))
        : 0.5;
      animateBars(amplitude);
    }, 150);
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setRecordingUri(uri);
    clearInterval(volumeInterval.current);
  };

  const handlePress = () => {
    recording ? stopRecording() : startRecording();
  };

  const goToTranscription = () => {
    navigation.navigate("Transcription", { uri: recordingUri });
  };

  const handleLoadAndNavigate = () => {
    setTimeout(() => {
      goToTranscription();
    });
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

      {/* Show buttons only if not recording AND recordingUri exists */}
      {recordingUri && !recording && (
        <View style={styles.buttonsContainer}>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.secondary}
              style={styles.loader}
            />
          ) : (
            <SecondaryButton
              text="عرض النص المستخرج"
              color={colors.secondary}
              onPress={handleLoadAndNavigate}
            />
          )}

          <SecondaryButton
            text="حذف التسجيل"
            color={colors.secondary}
            onPress={() => Alert.alert("🗑️", "تم حذف التسجيل")}
          />
        </View>
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
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  loader: {
    marginBottom: 15,
  },
});
