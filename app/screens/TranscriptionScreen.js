<<<<<<< HEAD
import React, { useState, useEffect } from "react";
=======
import React, { useRef, useState } from "react";
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator, //للودينق
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Audio } from "expo-av";
<<<<<<< HEAD
import Slider from "@react-native-community/slider";
=======

>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
import colors from "../config/colors";
import AppText from "../components/Text";
import SecondaryButton from "../components/SecondaryButton";
import CustomCard from "../components/CustomCard";

export default function TranscriptionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const recordingUri = route.params?.uri;
<<<<<<< HEAD
  const [isTestingLoading, setIsTestingLoading] = useState(false); ///// , احذفي ل زر السكيب حوليه ل ملخص الاجتماع زر

  const [soundObj, setSoundObj] = useState(null);
  const [durationMillis, setDurationMillis] = useState(0);
  const [positionMillis, setPositionMillis] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [transcribedText, setTranscribedText] = useState("");
  const [editable, setEditable] = useState(false);
  const [originalText, setOriginalText] = useState("");

  useEffect(() => {
    return () => {
      if (soundObj) soundObj.unloadAsync();
    };
  }, [soundObj]);

  const handlePlayPause = async () => {
    try {
      if (soundObj) {
        const status = await soundObj.getStatusAsync();
        if (status.isPlaying) {
          await soundObj.pauseAsync();
          setIsPlaying(false);
        } else {
          await soundObj.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
        (status) => {
          setPositionMillis(status.positionMillis);
          setDurationMillis(status.durationMillis);
          setIsPlaying(status.isPlaying);
        }
      );
      setSoundObj(sound);
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  const handleSeek = async (value) => {
    if (soundObj) {
      await soundObj.setPositionAsync(value);
    }
  };

  const formatTime = (millis) => {
    const total = Math.floor(millis / 1000);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
=======
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
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
  };

  const handleTranscribePress = async () => {
    if (!recordingUri) {
      Alert.alert("لا يوجد تسجيل", "يرجى تسجيل الصوت أولاً");
      return;
    }
<<<<<<< HEAD
    const form = new FormData();
    form.append("file", {
=======

    const formData = new FormData();
    formData.append("file", {
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
      uri: recordingUri,
      name: "audio.m4a",
      type: "audio/m4a",
    });
<<<<<<< HEAD
    try {
      const res = await fetch("http://192.168.3.93:5009/transcribe", {
        method: "POST",
        body: form,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = await res.json();
      if (data.text) {
=======

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
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
        setTranscribedText(data.text);
        setOriginalText(data.text);
        setEditable(true);
      } else {
        Alert.alert("خطأ", "لم يتم الحصول على نص.");
      }
<<<<<<< HEAD
    } catch (e) {
      console.error(e);
      Alert.alert("فشل", e.message);
=======
    } catch (error) {
      console.error("❌ Error:", error);
      Alert.alert("فشل", "تعذر إرسال التسجيل:\n" + error.message);
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
    }
  };

  const handleNavigateToSummary = () => {
    if (!transcribedText) {
      Alert.alert("⚠️", "يرجى تفريغ النص أولاً");
      return;
    }
<<<<<<< HEAD
    navigation.navigate("Summary", { transcribedText, audioUri: recordingUri });
  };

  const handleLeftIconPress = () => {
    setEditable(true);
    Alert.alert("تحرير", "يمكنك الآن تعديل النص");
  };

  const handleRightIconPress = () => {
    setEditable(false);
    setTranscribedText(originalText);
    Alert.alert("تمت إعادة النص", "رجعنا للنص الأصلي قبل التعديل");
=======

    navigation.navigate("Summary", {
      transcribedText: transcribedText,
      audioUri: recordingUri, // ✅ تمرير التسجيل
    });
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
  };

  return (
    <View style={styles.container}>
<<<<<<< HEAD
      <AppText style={styles.header}>النص المستخرج من اجتماعك</AppText>

      <View style={styles.audioControls}>
        <TouchableOpacity onPress={handlePlayPause}>
=======
      <AppText style={{ fontSize: 25, marginBottom: 20 }}>
        النص المستخرج من اجتماعك
      </AppText>

      <View style={styles.audioRow}>
        <Image
          source={require("../assets/audio.png")}
          style={{ width: 150, height: 60 }}
        />
        <TouchableOpacity onPress={handlePlayPress}>
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
          <MaterialCommunityIcons
            name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
            size={50}
            color={colors.secondary}
          />
        </TouchableOpacity>
<<<<<<< HEAD
        <View style={styles.sliderWrapper}>
          <Slider
            style={{ flex: 1 }}
            value={positionMillis}
            minimumValue={0}
            maximumValue={durationMillis}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={colors.secondary}
            maximumTrackTintColor="#ccc"
            thumbTintColor={colors.secondary}
=======
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
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
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

<<<<<<< HEAD
      <CustomCard
        title="النص المفرغ"
        value={transcribedText}
        onChangeText={setTranscribedText}
        placeholder="النص المفرغ سيظهر هنا..."
        height={200}
        items={[
          { icon: "pen", color: colors.primary, onPress: handleLeftIconPress },
          {
            icon: "pen-off",
            color: colors.secondary,
            onPress: handleRightIconPress,
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

        {/**testing button  */}
        <TouchableOpacity
          style={[
            styles.summaryButton,
            { backgroundColor: "red", marginTop: 15 },
          ]}
          onPress={() => {
            setIsTestingLoading(true);
            setTimeout(() => {
              setIsTestingLoading(false);
              navigation.navigate("Summary", {
                transcribedText,
                audioUri: recordingUri,
              });
            }, 2000); // Simulated delay
          }}
          disabled={isTestingLoading}
        >
          {isTestingLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <AppText style={styles.buttonText}>🧪 Testing Testing</AppText>
          )}
=======
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
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
        </TouchableOpacity>
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
<<<<<<< HEAD
  timeText: { fontSize: 12, color: "#666" },
  bottomButtons: { marginBottom: 20, alignItems: "stretch" },
=======
  bottomButtons: {
    marginBottom: 20,
  },
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
  summaryButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
<<<<<<< HEAD
    width: "100%",
=======
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
