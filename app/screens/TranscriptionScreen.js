import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Audio } from "expo-av";

import colors from "../config/colors";
import AppText from "../components/Text";

export default function TranscriptionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const recordingUri = route.params?.uri;
  const sound = useRef(null);

  const [transcribedText, setTranscribedText] = useState("");
  const [editable, setEditable] = useState(false);
  const [originalText, setOriginalText] = useState("");

  const handleLeftIconPress = () => {
    setEditable(true);
    Alert.alert("تحرير", "يمكنك الآن تعديل النص");
  };

  const handleRightIconPress = () => {
    setEditable(false);
    setTranscribedText(originalText);
    Alert.alert("تمت إعادة النص", "رجعنا للنص الأصلي قبل التعديل");
  };

  const handlePlayPress = async () => {
    if (!recordingUri) {
      Alert.alert("لا يوجد تسجيل", "يرجى تسجيل الصوت أولاً");
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: false,
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
      });

      if (sound.current) {
        await sound.current.unloadAsync();
        sound.current = null;
      }

      const { sound: playbackObject } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      sound.current = playbackObject;
    } catch (error) {
      console.error("❌ Error playing sound:", error);
      Alert.alert("خطأ", "لم يتمكن من تشغيل الصوت:\n" + error.message);
    }
  };

  const handleTranscribePress = async () => {
    if (!recordingUri) {
      Alert.alert("لا يوجد تسجيل", "يرجى تسجيل الصوت أولاً");
      return;
    }

    const formData = new FormData();
    formData.append("file", {
      uri: recordingUri,
      name: "audio.m4a",
      type: "audio/m4a",
    });

    try {
      const response = await fetch("http://192.168.3.93:5009/transcribe", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();
      console.log("🎯 Received transcription:", data);

      if (data.text && typeof data.text === "string") {
        setTranscribedText(data.text);
        setOriginalText(data.text);
        setEditable(true);
      } else {
        Alert.alert("خطأ", "لم يتم الحصول على نص.");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      Alert.alert("فشل", "تعذر إرسال التسجيل:\n" + error.message);
    }
  };

  const handleNavigateToSummary = () => {
    if (!transcribedText) {
      Alert.alert("⚠️", "يرجى تفريغ النص أولاً");
      return;
    }

    navigation.navigate("Summary", {
      transcribedText: transcribedText,
      audioUri: recordingUri, // ✅ تمرير التسجيل
    });
  };

  return (
    <View style={styles.container}>
      <AppText style={{ fontSize: 25, marginBottom: 20 }}>
        النص المستخرج من اجتماعك
      </AppText>

      <View style={styles.audioRow}>
        <Image
          source={require("../assets/audio.png")}
          style={{ width: 150, height: 60 }}
        />
        <TouchableOpacity onPress={handlePlayPress}>
          <MaterialCommunityIcons
            name="play-circle-outline"
            size={50}
            color={colors.secondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.iconRow}>
          <TouchableOpacity
            onPress={handleLeftIconPress}
            style={[styles.iconWrapper, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="pen" size={25} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRightIconPress}
            style={styles.iconWrapper}
          >
            <MaterialCommunityIcons name="account" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="النص المفرغ سيظهر هنا..."
            placeholderTextColor="#888"
            multiline
            textAlign="right"
            editable={editable}
            value={transcribedText}
            onChangeText={setTranscribedText}
          />
        </View>
      </View>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.summaryButton, { marginBottom: 10 }]}
          onPress={handleTranscribePress}
        >
          <AppText style={styles.buttonText}>🎙️ تفريغ النص</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.summaryButton}
          onPress={handleNavigateToSummary}
        >
          <AppText style={styles.buttonText}>📄 الذهاب إلى الملخص</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  audioRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 10,
    width: "100%",
    justifyContent: "center",
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconWrapper: {
    backgroundColor: colors.secondary,
    padding: 8,
    borderRadius: 20,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    textAlignVertical: "top",
  },
  bottomButtons: {
    marginBottom: 20,
  },
  summaryButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
