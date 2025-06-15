import React, { useState, useEffect } from "react";
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
import Slider from "@react-native-community/slider";
import colors from "../config/colors";
import AppText from "../components/Text";
import SecondaryButton from "../components/SecondaryButton";
import CustomCard from "../components/CustomCard";

export default function TranscriptionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const recordingUri = route.params?.uri;
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
  };

  const handleTranscribePress = async () => {
    if (!recordingUri) {
      Alert.alert("لا يوجد تسجيل", "يرجى تسجيل الصوت أولاً");
      return;
    }
    const form = new FormData();
    form.append("file", {
      uri: recordingUri,
      name: "audio.m4a",
      type: "audio/m4a",
    });
    try {
      const res = await fetch("http://192.168.3.93:5009/transcribe", {
        method: "POST",
        body: form,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = await res.json();
      if (data.text) {
        setTranscribedText(data.text);
        setOriginalText(data.text);
        setEditable(true);
      } else {
        Alert.alert("خطأ", "لم يتم الحصول على نص.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("فشل", e.message);
    }
  };

  const handleNavigateToSummary = () => {
    if (!transcribedText) {
      Alert.alert("⚠️", "يرجى تفريغ النص أولاً");
      return;
    }
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
  };

  return (
    <View style={styles.container}>
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
            maximumValue={durationMillis}
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
  timeText: { fontSize: 12, color: "#666" },
  bottomButtons: { marginBottom: 20, alignItems: "stretch" },
  summaryButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
