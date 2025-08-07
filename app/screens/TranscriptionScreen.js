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

  const reloadAudio = useCallback(async () => {
    if (!recordingUri || isReloadingRef.current) return;
    isReloadingRef.current = true;

    const src = recordingUri.startsWith("file://")
      ? recordingUri
      : "file://" + recordingUri;

    try {
      const info = await FileSystem.getInfoAsync(src);
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

      if (soundObj) {
        try {
          soundObj.setOnPlaybackStatusUpdate(null);
          await soundObj.unloadAsync();
        } catch {}
        setSoundObj(null);
      }

      const dest = `${FileSystem.cacheDirectory}play_${Date.now()}.wav`;
      await FileSystem.copyAsync({ from: src, to: dest });

      const { sound } = await Audio.Sound.createAsync(
        { uri: dest },
        { shouldPlay: false },
        (st) => {
          setPositionMillis(st.positionMillis || 0);
          setIsPlaying(!!st.isPlaying);
          if (st.durationMillis != null) setDurationMillis(st.durationMillis);
        }
      );

      setSoundObj(sound);
      const status = await sound.getStatusAsync();
      setDurationMillis(status.durationMillis || 0);
      setPositionMillis(status.positionMillis || 0);

      lastSrcRef.current = src;
      lastSizeRef.current = size;
    } catch (e) {
      console.error("Audio reload error:", e);
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
        } catch {}
      }
    };
  }, [soundObj]);

  const handlePlayPause = async () => {
    if (!soundObj) return;
    const status = await soundObj.getStatusAsync();
    if (status.isPlaying) {
      await soundObj.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundObj.playAsync();
      setIsPlaying(true);
    }
  };

  const handleSeek = async (value) => {
    if (soundObj) await soundObj.setPositionAsync(value);
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
    setLoading(true);
    try {
      const modelPath = await ensureWhisperModel();
      if (!whisperRef.current) {
        whisperRef.current = await initWhisper({ filePath: modelPath });
      }
      const { promise } = whisperRef.current.transcribe(recordingUri, {
        language: "ar",
      });
      const { result } = await promise;
      if (result) {
        setTranscribedText(result.trim());
      } else {
        Alert.alert("خطأ", "لم يتم الحصول على نص.");
      }
    } catch (e) {
      console.error("Transcription error:", e);
      Alert.alert("فشل", e.message || "حدث خطأ أثناء التفريغ");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToSummary = () => {
    if (!transcribedText) {
      Alert.alert("⚠️", "يرجى تفريغ النص أولاً");
      return;
    }
    navigation.navigate("Summary", {
      transcribedText,
      audioUri: recordingUri,
    });
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
        <TouchableOpacity onPress={handlePlayPause}>
          <MaterialCommunityIcons
            name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
            size={50}
            color={colors.secondary}
          />
        </TouchableOpacity>
        <View style={styles.sliderWrapper}>
          <Slider
            style={{ flex: 1 }}
            value={positionMillis}
            minimumValue={0}
            maximumValue={durationMillis || 0}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={colors.secondary}
            maximumTrackTintColor="#ccc"
            thumbTintColor={colors.secondary}
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
            onPress: () => {
              Clipboard.setString(transcribedText);
              Alert.alert("📋", "تم نسخ النص");
            },
          },
          {
            icon: "share-variant",
            color: colors.secondary,
            onPress: async () => {
              const path = FileSystem.cacheDirectory + "transcript.txt";
              await FileSystem.writeAsStringAsync(path, transcribedText);
              Sharing.shareAsync(path);
            },
          },
        ]}
      />

      <View style={styles.bottomButtons}>
        <SecondaryButton
          text="تفريغ النص"
          color={colors.secondary}
          onPress={handleTranscribePress}
        />
        <SecondaryButton
          text="الذهاب إلى الملخص"
          color={colors.secondary}
          onPress={handleNavigateToSummary}
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
