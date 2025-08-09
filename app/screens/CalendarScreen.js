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

  // In the useEffect hook
  useEffect(() => {
    const tempTasks = {};

    meetings.forEach((meeting) => {
      let dates = meeting.importantDates;

      // If dates is a string, parse it (shouldn't happen with our fixes but just in case)
      if (typeof dates === "string") {
        try {
          dates = JSON.parse(dates);
        } catch {
          dates = [];
        }
      }

      // Ensure we have an array
      if (!Array.isArray(dates)) dates = [];

      dates.forEach((entry) => {
        const date = entry.date;
        if (!date) return;

        const time = entry.time || "00:00";
        const title = entry.title || "اجتماع";

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

  const sortedTodayTasks = [...(tasks[today] || [])].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  const sortedTomorrowTasks = [...(tasks[tomorrowStr] || [])].sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  const createCalendarEvent = async (date, time, title) => {
    Alert.alert("إضافة إلى التقويم", `هل تريد إضافة "${title}" إلى التقويم؟`, [
      {
        text: "إلغاء",
        style: "cancel",
      },
      {
        text: "تأكيد",
        onPress: async () => {
          try {
            const { status } =
              await ExpoCalendar.requestCalendarPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("الصلاحية مرفوضة", "يرجى السماح للوصول إلى التقويم.");
              return;
            }

            const calendars = await ExpoCalendar.getCalendarsAsync(
              ExpoCalendar.EntityTypes.EVENT
            );
            const defaultCalendar =
              calendars.find((c) => c.allowsModifications) || calendars[0];

            const eventTime = time === "00:00" ? "09:00" : time;
            const startDate = new Date(`${date}T${eventTime}:00`);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

            await ExpoCalendar.createEventAsync(defaultCalendar.id, {
              title,
              startDate,
              endDate,
              timeZone: "Asia/Riyadh",
              alarms: [{ relativeOffset: -15 }],
            });

            Alert.alert("✅ تم بنجاح", `تمت إضافة "${title}" إلى التقويم`);
          } catch (error) {
            console.error("خطأ في إنشاء الحدث:", error);
            Alert.alert("حدث خطأ", error.message);
          }
        },
      },
    ]);
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
            acc[date] = {
              marked: true,
              dotColor: colors.primary,
              activeOpacity: 0.5,
            };
            return acc;
          }, {}),
        }}
        monthFormat={"MMMM yyyy"}
        hideArrows={false}
        firstDay={6}
        enableSwipeMonths
        theme={{
          calendarBackground: "#fff",
          textSectionTitleColor: colors.dark,
          todayTextColor: colors.primary,
          dayTextColor: "#2d4150",
          textDisabledColor: "#d9e1e8",
          selectedDayBackgroundColor: colors.secondary,
          selectedDayTextColor: "#fff",
          arrowColor: colors.secondary,
          monthTextColor: colors.dark,
          textDayFontWeight: "300",
          textMonthFontWeight: "bold",
          textDayHeaderFontWeight: "300",
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
      />

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>جدولك اليوم:</Text>
        {sortedTodayTasks.length === 0 ? (
          <Text style={styles.empty}>لا توجد مهام لهذا اليوم</Text>
        ) : (
          sortedTodayTasks.map((task, index) => (
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
        {sortedTomorrowTasks.length === 0 ? (
          <Text style={styles.empty}>لا توجد مهام لغد</Text>
        ) : (
          sortedTomorrowTasks.map((task, index) => (
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    paddingTop: 40,
  },
  scrollArea: {
    flex: 1,
    marginTop: 10,
  },
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
  taskCard2: {
    backgroundColor: colors.primary,
  },
  taskTitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "right",
  },
  empty: {
    color: "#aaa",
    textAlign: "center",
    marginBottom: 10,
  },
});
