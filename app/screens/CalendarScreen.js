import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Calendar } from "react-native-calendars";
import colors from "../config/colors"; // Adjust if needed

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(null);

  const tasks = {
    "2025-03-25": [{ time: "10:00", title: "محاضرة شبكات" }],
    "2025-03-26": [
      { time: "14:00", title: "مناقشة مشروع" },
      { time: "14:00", title: "مناقشة مشروع" },
      { time: "14:00", title: "مناقشة مشروع" },
      { time: "14:00", title: "مناقشة مشروع" },
      { time: "14:00", title: "مناقشة مشروع" },
      { time: "18:00", title: "اجتماع مع الفريق" },
    ],
    "2025-03-27": [{ time: "09:00", title: "تسليم التقرير النهائي" }],
  };

  const today = selectedDate || new Date().toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const todaysTasks = tasks[today] || [];
  const tomorrowsTasks = tasks[tomorrowStr] || [];

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
        {/* Today's Tasks */}
        <Text style={styles.title}>جدولك اليوم:</Text>
        {todaysTasks.length === 0 ? (
          <Text style={styles.empty}>لا توجد مهام لهذا اليوم</Text>
        ) : (
          todaysTasks.map((task, index) => (
            <View key={index} style={styles.taskWrapper}>
              <Text style={styles.taskTime}>{task.time}</Text>
              <View style={styles.taskCard}>
                <Text style={styles.taskTitle}>{task.title}</Text>
              </View>
            </View>
          ))
        )}

        {/* Tomorrow's Tasks */}
        <Text style={styles.title}>جدولك غدًا:</Text>
        {tomorrowsTasks.length === 0 ? (
          <Text style={styles.empty}>لا توجد مهام لغد</Text>
        ) : (
          tomorrowsTasks.map((task, index) => (
            <View key={index} style={styles.taskWrapper}>
              <Text style={styles.taskTime}>{task.time}</Text>
              <View style={[styles.taskCard, styles.taskCard2]}>
                <Text style={styles.taskTitle}>{task.title}</Text>
              </View>
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
