import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Text,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import * as FileSystem from "expo-file-system";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";

import colors from "../config/colors";
import AppText from "../components/Text";
import SecondaryButton from "../components/SecondaryButton";
import CustomCard from "../components/CustomCard";
import { ensureWhisperModel } from "../services/whisperModel";
import { initWhisper } from "whisper.rn";

export default function TranscriptionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const recordingUri = route.params?.uri;

  const [loading, setLoading] = useState(false);
  const [soundObj, setSoundObj] = useState(null);
  const [durationMillis, setDurationMillis] = useState(0);
  const [positionMillis, setPositionMillis] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const whisperRef = useRef(null);

  // Guards to avoid reload loops
  const isReloadingRef = useRef(false);
  const lastSrcRef = useRef(null);
  const lastSizeRef = useRef(null);

  // Don't initialize whisper on mount, do it only when needed
  useEffect(() => {
    // Cleanup whisper on unmount
    return () => {
      if (whisperRef.current) {
        try {
          whisperRef.current.release?.();
        } catch (error) {
          console.warn("Error releasing Whisper:", error);
        }
        whisperRef.current = null;
      }
    };
  }, []);

  const reloadAudio = useCallback(async () => {
    if (!recordingUri || isReloadingRef.current) return;
    isReloadingRef.current = true;

    const src = recordingUri.startsWith("file://")
      ? recordingUri
      : "file://" + recordingUri;

    try {
      const info = await FileSystem.getInfoAsync(src);
      if (!info.exists) {
        console.error("Audio file does not exist:", src);
        Alert.alert("خطأ", "ملف الصوت غير موجود");
        return;
      }

      const size = info?.size ?? 0;

      // Skip if already loaded
      if (
        lastSrcRef.current === src &&
        lastSizeRef.current === size &&
        soundObj
      ) {
        isReloadingRef.current = false;
        return;
      }

      setIsPlaying(false);
      setPositionMillis(0);
      setDurationMillis(0);

      // Unload previous sound
      if (soundObj) {
        try {
          soundObj.setOnPlaybackStatusUpdate(null);
          await soundObj.unloadAsync();
        } catch (error) {
          console.warn("Error unloading previous sound:", error);
        }
        setSoundObj(null);
      }

      // Create temporary copy for playback
      const dest = `${FileSystem.cacheDirectory}play_${Date.now()}.wav`;
      await FileSystem.copyAsync({ from: src, to: dest });

      const { sound } = await Audio.Sound.createAsync(
        { uri: dest },
        { shouldPlay: false },
        (status) => {
          if (status.isLoaded) {
            setPositionMillis(status.positionMillis || 0);
            setIsPlaying(!!status.isPlaying);
            if (status.durationMillis != null) {
              setDurationMillis(status.durationMillis);
            }
          }
        }
      );

      setSoundObj(sound);
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setDurationMillis(status.durationMillis || 0);
        setPositionMillis(status.positionMillis || 0);
      }

      lastSrcRef.current = src;
      lastSizeRef.current = size;
    } catch (error) {
      console.error("Audio reload error:", error);
      Alert.alert("خطأ", "فشل في تحميل الصوت");
    } finally {
      isReloadingRef.current = false;
    }
  }, [recordingUri, soundObj]);

  useFocusEffect(
    useCallback(() => {
      reloadAudio();
    }, [reloadAudio])
  );

  useEffect(() => {
    return () => {
      if (soundObj) {
        try {
          soundObj.setOnPlaybackStatusUpdate(null);
          soundObj.unloadAsync();
        } catch (error) {
          console.warn("Error cleaning up sound:", error);
        }
      }
    };
  }, [soundObj]);

  const handlePlayPause = async () => {
    if (!soundObj) return;

    try {
      const status = await soundObj.getStatusAsync();
      if (!status.isLoaded) {
        console.warn("Sound not loaded");
        return;
      }

      if (status.isPlaying) {
        await soundObj.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundObj.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error in play/pause:", error);
      Alert.alert("خطأ", "فشل في تشغيل/إيقاف الصوت");
    }
  };

  const handleSeek = async (value) => {
    if (soundObj) {
      try {
        await soundObj.setPositionAsync(value);
      } catch (error) {
        console.error("Error seeking:", error);
      }
    }
  };

  const formatTime = (millis) => {
    const total = Math.floor((millis || 0) / 1000);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleTranscribePress = async () => {
    if (!recordingUri) {
      Alert.alert("لا يوجد تسجيل", "يرجى تسجيل الصوت أولاً");
      return;
    }

    // Check if file exists
    try {
      const fileUri = recordingUri.startsWith("file://")
        ? recordingUri
        : "file://" + recordingUri;
      const info = await FileSystem.getInfoAsync(fileUri);
      if (!info.exists) {
        Alert.alert("خطأ", "ملف الصوت غير موجود");
        return;
      }
      console.log("Audio file exists, size:", info.size, "bytes");
    } catch (error) {
      console.error("Error checking file:", error);
      Alert.alert("خطأ", "فشل في التحقق من ملف الصوت");
      return;
    }

    setLoading(true);
    try {
      // Clean up any existing whisper instance first
      if (whisperRef.current) {
        try {
          whisperRef.current.release?.();
        } catch (e) {
          console.warn("Error releasing previous whisper instance:", e);
        }
        whisperRef.current = null;
      }

      console.log("Ensuring Whisper model...");
      const modelPath = await ensureWhisperModel((progress) => {
        console.log("Model download progress:", progress + "%");
      });

      console.log("Model path:", modelPath);

      // Verify model file exists and has correct size
      const modelInfo = await FileSystem.getInfoAsync("file://" + modelPath);
      if (!modelInfo.exists) {
        throw new Error("Model file does not exist after download");
      }
      console.log("Model file verified, size:", modelInfo.size, "bytes");

      console.log("Initializing Whisper with model...");

      // Try different initialization approaches
      const whisperOptions = {
        filePath: modelPath,
        // Remove any potentially problematic options
      };

      console.log("Whisper init options:", whisperOptions);
      whisperRef.current = await initWhisper(whisperOptions);
      console.log("Whisper initialized successfully");

      // Prepare audio file path
      const audioPath = recordingUri.replace(/^file:\/\//, "");
      console.log("Starting transcription for audio:", audioPath);

      // Simple transcription options
      const transcribeOptions = {
        language: "ar",
      };

      console.log("Transcription options:", transcribeOptions);
      const { promise } = whisperRef.current.transcribe(
        audioPath,
        transcribeOptions
      );

      const { result } = await promise;

      if (result && result.trim()) {
        console.log("Transcription successful:", result.length, "characters");
        console.log("First 100 chars:", result.substring(0, 100));
        setTranscribedText(result.trim());
      } else {
        console.warn("Empty transcription result");
        Alert.alert("تحذير", "لم يتم العثور على نص في التسجيل أو التسجيل فارغ");
      }
    } catch (error) {
      console.error("Transcription error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Clean up on error
      if (whisperRef.current) {
        try {
          whisperRef.current.release?.();
        } catch (e) {
          console.warn("Error releasing whisper on error:", e);
        }
        whisperRef.current = null;
      }

      Alert.alert("فشل", error.message || "حدث خطأ أثناء التفريغ");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToSummary = () => {
    if (!transcribedText?.trim()) {
      Alert.alert("⚠️", "يرجى تفريغ النص أولاً");
      return;
    }
    navigation.navigate("Summary", {
      transcribedText: transcribedText.trim(),
      audioUri: recordingUri,
    });
  };

  const handleCopyText = async () => {
    if (!transcribedText?.trim()) {
      Alert.alert("تحذير", "لا يوجد نص للنسخ");
      return;
    }

    try {
      await Clipboard.setStringAsync(transcribedText);
      Alert.alert("📋", "تم نسخ النص");
    } catch (error) {
      console.error("Copy error:", error);
      Alert.alert("خطأ", "فشل في نسخ النص");
    }
  };

  const handleShareText = async () => {
    if (!transcribedText?.trim()) {
      Alert.alert("تحذير", "لا يوجد نص للمشاركة");
      return;
    }

    try {
      const path = `${FileSystem.cacheDirectory}transcript_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(path, transcribedText);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: "text/plain",
          dialogTitle: "مشاركة النص المفرغ",
        });
      } else {
        Alert.alert("خطأ", "المشاركة غير متاحة على هذا الجهاز");
      }
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("خطأ", "فشل في مشاركة النص");
    }
  };

  return (
    <View style={styles.container}>
      <Modal transparent visible={loading} animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.statusText}>جاري التفريغ…</Text>
        </View>
      </Modal>

      <AppText style={styles.header}>النص المستخرج من اجتماعك</AppText>

      <View style={styles.audioControls}>
        <TouchableOpacity onPress={handlePlayPause} disabled={!soundObj}>
          <MaterialCommunityIcons
            name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
            size={50}
            color={soundObj ? colors.secondary : "#ccc"}
          />
        </TouchableOpacity>
        <View style={styles.sliderWrapper}>
          <Slider
            style={{ flex: 1 }}
            value={positionMillis}
            minimumValue={0}
            maximumValue={durationMillis || 1}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={colors.secondary}
            maximumTrackTintColor="#ccc"
            thumbTintColor={colors.secondary}
            disabled={!soundObj}
          />
          <View style={styles.timeRow}>
            <AppText style={styles.timeText}>
              {formatTime(positionMillis)}
            </AppText>
            <AppText style={styles.timeText}>
              {formatTime(durationMillis)}
            </AppText>
          </View>
        </View>
      </View>

      <CustomCard
        title="النص المفرغ"
        value={transcribedText}
        onChangeText={setTranscribedText}
        placeholder="النص المفرغ سيظهر هنا..."
        height={200}
        items={[
          {
            icon: "content-copy",
            color: colors.secondary,
            onPress: handleCopyText,
          },
          {
            icon: "share-variant",
            color: colors.secondary,
            onPress: handleShareText,
          },
        ]}
      />

      <View style={styles.bottomButtons}>
        <SecondaryButton
          text="تفريغ النص"
          color={colors.secondary}
          onPress={handleTranscribePress}
          disabled={loading || !recordingUri}
        />
        <SecondaryButton
          text="الذهاب إلى الملخص"
          color={colors.secondary}
          onPress={handleNavigateToSummary}
          disabled={!transcribedText?.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f2f2f2", padding: 20 },
  header: { fontSize: 25, marginBottom: 20, alignSelf: "center" },
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sliderWrapper: { flex: 1, marginHorizontal: 10 },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  timeText: { fontSize: 12, color: "#666" },
  bottomButtons: { marginBottom: 20, alignItems: "stretch" },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  statusText: { marginTop: 10, fontSize: 16, color: "#fff" },
});
