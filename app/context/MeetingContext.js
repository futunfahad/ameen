import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

const STORAGE_KEY = "meeting_data";

export const MeetingContext = createContext();

export const MeetingProvider = ({ children }) => {
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        setMeetings(JSON.parse(stored));
      }
    } catch (error) {
      Alert.alert("خطأ", "فشل تحميل الاجتماعات");
    }
  };

  const saveMeetings = async (updatedMeetings) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedMeetings));
    } catch (error) {
      Alert.alert("خطأ", "فشل حفظ الاجتماعات");
    }
  };

  const addMeeting = (transcribedText, summary, importantDates, audioUri, createdAt) => {
    const newMeeting = {
      id: Date.now().toString(),
      transcribedText,
      summary,
      importantDates,
      audioUri,
      createdAt,
    };
    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    saveMeetings(updated);
  };

  return (
    <MeetingContext.Provider value={{ meetings, addMeeting }}>
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeetingContext = () => useContext(MeetingContext);
