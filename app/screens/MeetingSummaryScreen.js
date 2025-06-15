import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Audio } from "expo-av";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Calendar from "expo-calendar";
import colors from "../config/colors";
import AppText from "../components/Text";
import { useMeetingContext } from "../context/MeetingContext";

export default function MeetingSummaryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const passedText = route.params?.transcribedText || "";
  const audioUri = route.params?.audioUri || "";

  const { addMeeting } = useMeetingContext();

  const [isExpanded1, setIsExpanded1] = useState(false);
  const [isExpanded2, setIsExpanded2] = useState(false);
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [originalText, setOriginalText] = useState(passedText);
  const [sound, setSound] = useState();

  useEffect(() => {
    const processMeeting = async () => {
      if (!originalText) return;

      try {
        const summaryText = await fetchSummary(originalText);
        const datesList = await fetchDates(originalText);

        const datesText =
          datesList.length > 0 ? datesList.join("\n") : "لا توجد تواريخ مستخرجة.";

        setInput1(summaryText);
        setInput2(datesText);

        const createdAt = new Date().toISOString();
        addMeeting(originalText, summaryText, datesList, audioUri, createdAt);

        await addDatesToCalendar(datesList, summaryText);
      } catch (err) {
        console.error("❌ خطأ:", err);
        Alert.alert("خطأ", err.message);
      }
    };

    processMeeting();
  }, []);

  const fetchSummary = async (text) => {
    const res = await fetch("http://192.168.3.93:5040/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return data.summary || "";
  };

  const fetchDates = async (text) => {
    const res = await fetch("http://192.168.3.93:5030/extract-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return data.key_dates || [];
  };

  const handleSummarize = async () => {
    try {
      const summary = await fetchSummary(originalText);
      setInput1(summary);
      Alert.alert("✅", "تم تحديث الملخص");
    } catch (err) {
      Alert.alert("خطأ في التلخيص", err.message);
    }
  };

  const handleExtractDates = async () => {
    try {
      const dates = await fetchDates(originalText);
      setInput2(dates.length > 0 ? dates.join("\n") : "لا توجد تواريخ مستخرجة.");
      Alert.alert("✅", "تم استخراج التواريخ");
    } catch (err) {
      Alert.alert("خطأ في استخراج التواريخ", err.message);
    }
  };

  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  const addDatesToCalendar = async (datesArray, title) => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("❌", "لم يتم منح صلاحية الوصول إلى التقويم");
      return;
    }

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find((c) => c.allowsModifications) || calendars[0];

    for (const dateStr of datesArray) {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        await Calendar.createEventAsync(defaultCalendar.id, {
          title: title || "حدث اجتماع",
          startDate: parsedDate,
          endDate: new Date(parsedDate.getTime() + 60 * 60 * 1000),
          timeZone: "Asia/Riyadh",
        });
      }
    }
  };

  const handlePlayPress = async () => {
    if (!audioUri) {
      Alert.alert("لا يوجد تسجيل صوتي");
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      setSound(sound);
      await sound.playAsync();
    } catch (err) {
      Alert.alert("فشل التشغيل", err.message);
    }
  };

  const handleCopy = (text) => {
    Clipboard.setStringAsync(text);
    Alert.alert("✅ تم النسخ", "تم نسخ النص إلى الحافظة");
  };

  const handleShare = async (text) => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert("❌ غير مدعوم", "مشاركة النص غير مدعومة على هذا الجهاز");
      return;
    }

    try {
      const tmpUri = `${FileSystem.cacheDirectory}temp.txt`;
      await FileSystem.writeAsStringAsync(tmpUri, text);
      await Sharing.shareAsync(tmpUri);
    } catch (err) {
      Alert.alert("خطأ في المشاركة", err.message);
    }
  };

  const handleNavigateToHistory = () => {
    navigation.navigate("History");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.audioRow}>
        <Image source={require("../assets/audio.png")} style={{ width: 150, height: 60 }} />
        <TouchableOpacity onPress={handlePlayPress}>
          <MaterialCommunityIcons name="play-circle-outline" size={50} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* ملخص الاجتماع */}
      <AppText style={styles.cardTitle}>ملخص الاجتماع</AppText>
      <View style={[styles.card, isExpanded1 ? { minHeight: 200 } : { minHeight: 200, maxHeight: 180 }]}>
        <TouchableOpacity onPress={() => setIsExpanded1(!isExpanded1)} style={styles.expandIconAbsolute}>
          <MaterialCommunityIcons name={isExpanded1 ? "arrow-up-bold" : "arrow-down-bold"} size={25} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.iconRow}>
          <TouchableOpacity onPress={handleSummarize} style={[styles.iconWrapper, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="pen" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.shareRow}>
          <TouchableOpacity onPress={() => handleCopy(input1)} style={styles.shareButton}>
            <MaterialCommunityIcons name="content-copy" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(input1)} style={styles.shareButton}>
            <MaterialCommunityIcons name="share-variant" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }}>
          <TextInput
            style={[styles.input, isExpanded1 && { minHeight: 100 }]}
            placeholder="سيظهر الملخص هنا..."
            placeholderTextColor="#888"
            multiline
            textAlign="right"
            scrollEnabled={false}
            textAlignVertical="top"
            value={input1}
            onChangeText={setInput1}
          />
        </ScrollView>
      </View>

      {/* تواريخ مهمة */}
      <AppText style={styles.cardTitle}>تواريخ تهمك</AppText>
      <View style={[styles.card, isExpanded2 ? { minHeight: 200 } : { minHeight: 200, maxHeight: 180 }]}>
        <TouchableOpacity onPress={() => setIsExpanded2(!isExpanded2)} style={styles.expandIconAbsolute}>
          <MaterialCommunityIcons name={isExpanded2 ? "arrow-up-bold" : "arrow-down-bold"} size={25} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.iconRow}>
          <TouchableOpacity onPress={handleExtractDates} style={[styles.iconWrapper, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="calendar" size={25} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.shareRow}>
          <TouchableOpacity onPress={() => handleCopy(input2)} style={styles.shareButton}>
            <MaterialCommunityIcons name="content-copy" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(input2)} style={styles.shareButton}>
            <MaterialCommunityIcons name="share-variant" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }}>
          <TextInput
            style={[styles.input, isExpanded2 && { minHeight: 100 }]}
            placeholder="سيتم عرض التواريخ هنا..."
            placeholderTextColor="#888"
            multiline
            textAlign="right"
            scrollEnabled={false}
            textAlignVertical="top"
            value={input2}
            onChangeText={setInput2}
          />
        </ScrollView>
      </View>

      <View style={{ height: 100 }}>
        <TouchableOpacity style={styles.historyButton} onPress={handleNavigateToHistory}>
          <AppText style={styles.buttonText}>عرض سجل المحفوظات</AppText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  historyButton: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
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
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignSelf: "stretch",
    justifyContent: "flex-start",
    position: "relative",
  },
  cardTitle: {
    fontSize: 25,
    marginBottom: 10,
    textAlign: "right",
  },
  iconRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  iconWrapper: {
    backgroundColor: colors.secondary,
    padding: 8,
    borderRadius: 20,
  },
  input: {
    fontSize: 16,
    color: "#000",
    textAlignVertical: "top",
    padding: 5,
  },
  expandIconAbsolute: {
    position: "absolute",
    left: 10,
    top: 10,
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
    backgroundColor: "transparent",
  },
  shareRow: {
    flexDirection: "row-reverse",
    justifyContent: "flex-end",
    gap: 15,
    marginBottom: 10,
  },
  shareButton: {
    backgroundColor: colors.secondary,
    padding: 8,
    borderRadius: 20,
  },
});
