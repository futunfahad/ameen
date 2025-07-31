import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Calendar } from "react-native-calendars";
import * as ExpoCalendar from "expo-calendar";
import colors from "../config/colors";
import { MeetingContext } from "../context/MeetingContext";

export default function CalendarScreen() {
  const { meetings } = useContext(MeetingContext);
  const [selectedDate, setSelectedDate] = useState(null);
  const [tasks, setTasks] = useState({});

  useEffect(() => {
    const tempTasks = {};

    meetings.forEach((meeting) => {
      if (!meeting.importantDates) return;

      let parsedDates = [];
      try {
        parsedDates = JSON.parse(meeting.importantDates);
      } catch {
        return;
      }

      parsedDates.forEach((entry) => {
        const date = entry.date || entry.day || Object.keys(entry)[0];
        const time =
          entry.time || (entry[date] && entry[date][0]?.time) || "00:00";
        const title =
          entry.title || (entry[date] && entry[date][0]?.title) || "اجتماع";

        if (!tempTasks[date]) tempTasks[date] = [];
        tempTasks[date].push({ time, title });
      });
    });

    setTasks(tempTasks);
  }, [meetings]);

  const today = selectedDate || new Date().toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const todaysTasks = tasks[today] || [];
  const tomorrowsTasks = tasks[tomorrowStr] || [];

  const createCalendarEvent = async (date, time, title) => {
    try {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("الصلاحية مرفوضة", "يرجى السماح للوصول إلى التقويم.");
        return;
      }

      const calendars = await ExpoCalendar.getCalendarsAsync(
        ExpoCalendar.EntityTypes.EVENT
      );
      const defaultCalendar =
        calendars.find((c) => c.allowsModifications) || calendars[0];

      const startDate = new Date(`${date}T${time}:00`);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      await ExpoCalendar.createEventAsync(defaultCalendar.id, {
        title,
        startDate,
        endDate,
        timeZone: "Asia/Riyadh",
      });

      Alert.alert("✅ تم إضافة الحدث إلى التقويم");
    } catch (error) {
      console.error("خطأ في إنشاء الحدث:", error);
      Alert.alert("حدث خطأ", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          [today]: {
            selected: true,
            marked: true,
            selectedColor: colors.secondary,
          },
          ...Object.keys(tasks).reduce((acc, date) => {
            acc[date] = { marked: true, dotColor: colors.primary };
            return acc;
          }, {}),
        }}
        enableSwipeMonths
        firstDay={6}
        theme={{
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.secondary,
          arrowColor: colors.secondary,
        }}
      />

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>جدولك اليوم:</Text>
        {todaysTasks.length === 0 ? (
          <Text style={styles.empty}>لا توجد مهام لهذا اليوم</Text>
        ) : (
          todaysTasks.map((task, index) => (
            <View key={index} style={styles.taskWrapper}>
              <Text style={styles.taskTime}>{task.time}</Text>
              <TouchableOpacity
                style={styles.taskCard}
                onPress={() =>
                  createCalendarEvent(today, task.time, task.title)
                }
              >
                <Text style={styles.taskTitle}>{task.title}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.title}>جدولك غدًا:</Text>
        {tomorrowsTasks.length === 0 ? (
          <Text style={styles.empty}>لا توجد مهام لغد</Text>
        ) : (
          tomorrowsTasks.map((task, index) => (
            <View key={index} style={styles.taskWrapper}>
              <Text style={styles.taskTime}>{task.time}</Text>
              <TouchableOpacity
                style={[styles.taskCard, styles.taskCard2]}
                onPress={() =>
                  createCalendarEvent(tomorrowStr, task.time, task.title)
                }
              >
                <Text style={styles.taskTitle}>{task.title}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15, paddingTop: 40 },
  scrollArea: { flex: 1, marginTop: 10 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 15,
    textAlign: "right",
    color: colors.dark,
  },
  taskWrapper: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 10,
  },
  taskTime: {
    fontSize: 14,
    color: colors.medium,
    marginLeft: 10,
    width: 60,
    textAlign: "right",
  },
  taskCard: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 10,
    flex: 1,
  },
  taskCard2: { backgroundColor: colors.primary },
  taskTitle: { fontSize: 16, color: "#fff", textAlign: "right" },
  empty: { color: "#aaa", textAlign: "center", marginBottom: 10 },
});
