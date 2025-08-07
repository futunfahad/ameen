// screens/TranscriptionScreen.js
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Text,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { initWhisper } from "whisper.rn";
import { whisperRef, safeReleaseWhisper } from "../services/whisperInstance";
import { ensureWhisperModel } from "../services/whisperModel";

import colors from "../config/colors";
import AudioPlayer from "../components/AudioPlayer";
import CustomCard from "../components/CustomCard";
import SecondaryButton from "../components/SecondaryButton";

export default function TranscriptionScreen() {
  const navigation = useNavigation();
  const { uri: recordingUri } = useRoute().params || {};

  const [transcribedText, setTranscribedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pct, setPct] = useState(0);

  const handleTranscribe = async () => {
    if (!recordingUri) {
      Alert.alert("لا يوجد تسجيل", "يرجى تسجيل الصوت أولاً");
      return;
    }
    setLoading(true);
    try {
      const modelPath = await ensureWhisperModel((p) => setPct(p));
      if (!whisperRef.current) {
        whisperRef.current = await initWhisper({ filePath: modelPath });
      }
      const { promise } = whisperRef.current.transcribe(recordingUri, {
        language: "ar",
      });
      const { result } = await promise;
      setTranscribedText((result || "").trim());
    } catch (e) {
      Alert.alert("خطأ", e.message || "فشل التفريغ");
    } finally {
      setLoading(false);
      setPct(0);
    }
  };

  const goNext = () => {
    if (!transcribedText.trim()) {
      Alert.alert("⚠️", "يرجى التفريغ أولاً");
      return;
    }
    safeReleaseWhisper("toSummary");
    navigation.navigate("Summary", {
      transcribedText,
      audioUri: recordingUri,
    });
  };

  return (
    <View style={styles.container}>
      <Modal transparent visible={loading}>
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.overlayText}>
            {pct ? `تحميل: ${pct}%` : "جاري التفريغ…"}
          </Text>
        </View>
      </Modal>

      {recordingUri ? (
        <AudioPlayer uri={recordingUri} />
      ) : (
        <Text style={styles.placeholder}>لا يوجد تسجيل لعرضه.</Text>
      )}

      <CustomCard
        title="النص المفرّغ"
        value={transcribedText}
        onChangeText={setTranscribedText}
        placeholder="اضغط تفريغ للحصول على النص…"
        height={200}
      />

      <View style={styles.buttons}>
        <SecondaryButton
          text="تفريغ"
          color={colors.secondary}
          onPress={handleTranscribe}
        />
        <SecondaryButton
          text="التالي"
          color={colors.primary}
          onPress={goNext}
          disabled={!transcribedText.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f2f2f2" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: { marginTop: 8, color: "#fff" },
  placeholder: {
    textAlign: "center",
    marginVertical: 40,
    color: "#999",
  },
  buttons: { marginTop: 20, gap: 12 },
});
