import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Text,
  Platform,
  ScrollView,
  SafeAreaView,
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
//////////////

/**
 * TranscriptionScreen Component
 *
 * This screen handles:
 * 1. Audio playback of recorded files
 * 2. AI-powered transcription using Whisper model
 * 3. Text editing and sharing capabilities
 * 4. Navigation to summary screen
 */
export default function TranscriptionScreen() {
  // Navigation hooks for screen transitions
  const navigation = useNavigation();
  const route = useRoute();

  // Extract the audio file URI from navigation params
  const recordingUri = route.params?.uri;

  // === STATE VARIABLES ===

  // Loading states
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState(""); // Status message for user
  const [isDownloading, setIsDownloading] = useState(false);

  // Audio playback states
  const [soundObj, setSoundObj] = useState(null); // Audio.Sound instance
  const [durationMillis, setDurationMillis] = useState(0); // Total audio duration
  const [positionMillis, setPositionMillis] = useState(0); // Current playback position
  const [isPlaying, setIsPlaying] = useState(false); // Playback state

  // Transcription state
  const [transcribedText, setTranscribedText] = useState(""); // AI-generated transcript

  // Whisper AI model reference
  const whisperRef = useRef(null);

  // === RELOAD PREVENTION GUARDS ===
  // These refs prevent infinite reload loops when handling audio files
  const isReloadingRef = useRef(false); // Flag to prevent concurrent reloads
  const lastSrcRef = useRef(null); // Cache last loaded source URI
  const lastSizeRef = useRef(null); // Cache last file size for comparison

  // === CLEANUP ON COMPONENT UNMOUNT ===
  useEffect(() => {
    return () => {
      // Clean up Whisper model instance when component unmounts
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

  /**
   * Audio Reload Function
   *
   * Handles loading/reloading audio files with smart caching to prevent
   * unnecessary reloads of the same file
   */
  const reloadAudio = useCallback(async () => {
    // Guard against missing URI or concurrent reloads
    if (!recordingUri || isReloadingRef.current) return;
    isReloadingRef.current = true;

    // Ensure file URI has proper protocol prefix
    const src = recordingUri.startsWith("file://")
      ? recordingUri
      : "file://" + recordingUri;

    try {
      // Verify file exists on device storage
      const info = await FileSystem.getInfoAsync(src);
      if (!info.exists) {
        console.error("Audio file does not exist:", src);
        Alert.alert("خطأ", "ملف الصوت غير موجود");
        return;
      }

      const size = info?.size ?? 0;

      // Skip reload if same file is already loaded (optimization)
      if (
        lastSrcRef.current === src &&
        lastSizeRef.current === size &&
        soundObj
      ) {
        isReloadingRef.current = false;
        return;
      }

      // Reset playback states before loading new audio
      setIsPlaying(false);
      setPositionMillis(0);
      setDurationMillis(0);

      // Clean up previous audio instance
      if (soundObj) {
        try {
          soundObj.setOnPlaybackStatusUpdate(null);
          await soundObj.unloadAsync();
        } catch (error) {
          console.warn("Error unloading previous sound:", error);
        }
        setSoundObj(null);
      }

      // Create temporary copy for playback (some platforms require this)
      const dest = `${FileSystem.cacheDirectory}play_${Date.now()}.wav`;
      await FileSystem.copyAsync({ from: src, to: dest });

      // Create new Audio.Sound instance with status callback
      const { sound } = await Audio.Sound.createAsync(
        { uri: dest },
        { shouldPlay: false },
        (status) => {
          // Update UI with playback status changes
          if (status.isLoaded) {
            setPositionMillis(status.positionMillis || 0);
            setIsPlaying(!!status.isPlaying);
            if (status.durationMillis != null) {
              setDurationMillis(status.durationMillis);
            }
          }
        }
      );

      // Store sound instance and get initial status
      setSoundObj(sound);
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setDurationMillis(status.durationMillis || 0);
        setPositionMillis(status.positionMillis || 0);
      }

      // Cache current file info to prevent unnecessary reloads
      lastSrcRef.current = src;
      lastSizeRef.current = size;
    } catch (error) {
      console.error("Audio reload error:", error);
      Alert.alert("خطأ", "فشل في تحميل الصوت");
    } finally {
      isReloadingRef.current = false;
    }
  }, [recordingUri, soundObj]);

  // Reload audio when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      reloadAudio();
    }, [reloadAudio])
  );

  // Clean up audio when component unmounts
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

  /**
   * Audio Playback Control
   *
   * Toggles between play and pause states
   */
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

  /**
   * Audio Seeking
   *
   * Allows user to jump to specific position in audio
   */
  const handleSeek = async (value) => {
    if (soundObj) {
      try {
        await soundObj.setPositionAsync(value);
      } catch (error) {
        console.error("Error seeking:", error);
      }
    }
  };

  /**
   * Time Formatting Utility
   *
   * Converts milliseconds to MM:SS format
   */
  const formatTime = (millis) => {
    const total = Math.floor((millis || 0) / 1000);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  /**
   * AI Transcription Handler with Enhanced Error Handling
   *
   * Main function that:
   * 1. Checks network connectivity
   * 2. Downloads Whisper AI model if needed (with retry logic)
   * 3. Initializes the AI engine
   * 4. Processes audio file to extract text
   * 5. Displays results to user
   */
  const handleTranscribePress = async () => {
    if (!recordingUri) {
      Alert.alert("لا يوجد تسجيل", "يرجى تسجيل الصوت أولاً");
      return;
    }

    // Verify audio file exists before proceeding
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
    setDownloadProgress(0);
    setDownloadStatus("جاري التحضير...");

    try {
      // Check if Whisper library is available
      setDownloadStatus("جاري فحص مكتبة الذكاء الاصطناعي...");
      if (!initWhisper || typeof initWhisper !== "function") {
        throw new Error("WHISPER_NOT_AVAILABLE");
      }

      // Check network connectivity first
      setDownloadStatus("جاري فحص الاتصال بالإنترنت...");
      const isConnected = await testNetworkConnection();

      if (!isConnected) {
        throw new Error(
          "لا يوجد اتصال بالإنترنت. يرجى التحقق من الاتصال والمحاولة مرة أخرى"
        );
      }

      // Clean up any existing Whisper instance
      if (whisperRef.current) {
        try {
          whisperRef.current.release?.();
        } catch (e) {
          console.warn("Error releasing previous whisper instance:", e);
        }
        whisperRef.current = null;
      }

      console.log("Ensuring Whisper model...");
      setDownloadStatus("جاري تحميل نموذج الذكاء الاصطناعي...");
      setIsDownloading(true);

      // Download AI model with progress tracking and retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let modelPath;

      while (retryCount < maxRetries) {
        try {
          modelPath = await ensureWhisperModel((progress) => {
            console.log("Model download progress:", progress + "%");
            setDownloadProgress(progress);

            // Update status message based on progress
            if (progress < 10) {
              setDownloadStatus("بدء التحميل...");
            } else if (progress < 50) {
              setDownloadStatus(`جاري التحميل... ${Math.round(progress)}%`);
            } else if (progress < 90) {
              setDownloadStatus(`اكتمال التحميل... ${Math.round(progress)}%`);
            } else {
              setDownloadStatus("جاري التحقق من الملف...");
            }
          });
          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          console.error(
            `Download attempt ${retryCount} failed:`,
            error.message
          );

          if (retryCount < maxRetries) {
            setDownloadStatus(
              `فشل في التحميل، محاولة ${retryCount + 1} من ${maxRetries}...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          } else {
            throw new Error(
              `فشل في تحميل النموذج بعد ${maxRetries} محاولات. يرجى التحقق من الاتصال بالإنترنت`
            );
          }
        }
      }

      setIsDownloading(false);
      setDownloadStatus("جاري تهيئة نموذج الذكاء الاصطناعي...");

      console.log("Model path:", modelPath);

      // Verify downloaded model file
      const modelInfo = await FileSystem.getInfoAsync("file://" + modelPath);
      if (!modelInfo.exists) {
        throw new Error("ملف النموذج غير موجود بعد التحميل");
      }
      console.log("Model file verified, size:", modelInfo.size, "bytes");

      console.log("Initializing Whisper with model...");

      // Initialize Whisper AI engine with error handling
      const whisperOptions = {
        filePath: modelPath,
      };

      console.log("Whisper init options:", whisperOptions);

      try {
        whisperRef.current = await initWhisper(whisperOptions);
        console.log("Whisper initialized successfully");
      } catch (initError) {
        console.error("Whisper initialization error:", initError);
        if (
          initError.message &&
          initError.message.includes("UnsatisfiedLinkError")
        ) {
          throw new Error("NATIVE_LIBRARY_ERROR");
        }
        throw initError;
      }

      // Prepare audio file for processing
      const audioPath = recordingUri.replace(/^file:\/\//, "");
      console.log("Starting transcription for audio:", audioPath);

      setDownloadStatus("جاري تحليل الصوت...");

      // Configure transcription for Arabic language
      const transcribeOptions = {
        language: "ar", // Arabic language code
      };

      console.log("Transcription options:", transcribeOptions);

      // Start AI transcription process
      const { promise } = whisperRef.current.transcribe(
        audioPath,
        transcribeOptions
      );

      setDownloadStatus("جاري استخراج النص...");
      const { result } = await promise;

      // Process and display results
      if (result && result.trim()) {
        console.log("Transcription successful:", result.length, "characters");
        console.log("First 100 chars:", result.substring(0, 100));
        setTranscribedText(result.trim());
        setDownloadStatus("تم الانتهاء بنجاح!");
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

      // Show user-friendly error message based on error type
      let errorMessage = "حدث خطأ أثناء التفريغ";
      let showTechnicalInfo = false;

      if (error.message === "WHISPER_NOT_AVAILABLE") {
        errorMessage =
          "مكتبة الذكاء الاصطناعي غير متاحة. يرجى التحقق من تثبيت التطبيق";
        showTechnicalInfo = true;
      } else if (error.message === "NATIVE_LIBRARY_ERROR") {
        errorMessage = "خطأ في مكتبة الذكاء الاصطناعي المحلية";
        showTechnicalInfo = true;
      } else if (
        error.message &&
        error.message.includes("UnsatisfiedLinkError")
      ) {
        errorMessage = "المكتبات المطلوبة غير مثبتة بشكل صحيح";
        showTechnicalInfo = true;
      } else if (
        error.message &&
        error.message.includes("Unable to resolve host")
      ) {
        errorMessage =
          "فشل في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت";
      } else if (
        error.message &&
        error.message.includes("No address associated with hostname")
      ) {
        errorMessage = "مشكلة في الاتصال بالإنترنت. يرجى المحاولة لاحقاً";
      }

      if (showTechnicalInfo) {
        Alert.alert(
          "خطأ تقني",
          errorMessage +
            "\n\nيرجى إعادة تشغيل التطبيق أو إعادة تثبيته إذا استمرت المشكلة",
          [
            {
              text: "إعادة محاولة",
              onPress: () => {
                // Allow user to retry
              },
            },
            {
              text: "موافق",
              style: "default",
            },
          ]
        );
      } else {
        Alert.alert("فشل", errorMessage);
      }
    } finally {
      setLoading(false);
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadStatus("");
    }
  };

  /**
   * Navigation to Summary Screen
   *
   * Passes transcribed text to next screen for AI summarization
   */
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

  /**
   * Copy Text to Clipboard
   *
   * Allows user to copy transcribed text for use in other apps
   */
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

  /**
   * Share Text Function
   *
   * Creates a text file and shares it via system share menu
   */
  const handleShareText = async () => {
    if (!transcribedText?.trim()) {
      Alert.alert("تحذير", "لا يوجد نص للمشاركة");
      return;
    }

    try {
      // Create temporary text file
      const path = `${FileSystem.cacheDirectory}transcript_${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(path, transcribedText);

      // Share via system share sheet
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

  /**
   * Simple Network Test
   *
   * Tests connectivity by making a simple fetch request
   */
  const testNetworkConnection = async () => {
    try {
      // Try to fetch a small resource with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      await fetch("https://www.google.com", {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.warn("Network test failed:", error.message);
      return false;
    }
  };

  /**
   * Custom Progress Bar Component
   *
   * Safe implementation that avoids native crashes
   */
  const CustomProgressBar = ({ progress }) => {
    const progressWidth = Math.max(0, Math.min(100, progress));

    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[styles.progressBarFill, { width: `${progressWidth}%` }]}
          />
        </View>
      </View>
    );
  };

  // === RENDER UI ===
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading Modal with Progress */}
        <Modal transparent visible={loading} animationType="fade">
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.statusText}>{downloadStatus}</Text>

              {/* Show progress bar during download */}
              {isDownloading && (
                <View style={styles.progressContainer}>
                  <CustomProgressBar progress={downloadProgress} />
                  <Text style={styles.progressText}>
                    {Math.round(downloadProgress)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Screen Title */}
        <AppText style={styles.header}>النص المستخرج من اجتماعك</AppText>

        {/* Audio Player Controls */}
        <View style={styles.audioControls}>
          {/* Play/Pause Button */}
          <TouchableOpacity onPress={handlePlayPause} disabled={!soundObj}>
            <MaterialCommunityIcons
              name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
              size={50}
              color={soundObj ? colors.secondary : "#ccc"}
            />
          </TouchableOpacity>

          {/* Audio Scrubber and Time Display */}
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

        {/* Transcribed Text Card with Actions */}
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

        {/* Action Buttons */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    padding: 20,
  },
  header: {
    fontSize: 25,
    marginBottom: 20,
    alignSelf: "center",
  },
  audioControls: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sliderWrapper: {
    flex: 1,
    marginHorizontal: 10,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
  },
  bottomButtons: {
    marginBottom: 20,
    alignItems: "stretch",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  loadingContainer: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",
    minWidth: 250,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    marginTop: 15,
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    fontWeight: "500",
  },
  progressContainer: {
    width: "100%",
    marginTop: 20,
    alignItems: "center",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarBackground: {
    width: "100%",
    height: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#007AFF", // Use your colors.primary here
    borderRadius: 4,
  },
  progressText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
});
