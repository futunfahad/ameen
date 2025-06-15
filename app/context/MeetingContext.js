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
<<<<<<< HEAD
      await SecureStore.setItemAsync(
        STORAGE_KEY,
        JSON.stringify(updatedMeetings)
      );
=======
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updatedMeetings));
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
    } catch (error) {
      Alert.alert("خطأ", "فشل حفظ الاجتماعات");
    }
  };

<<<<<<< HEAD
  const addMeeting = (
    transcribedText,
    summary,
    importantDates,
    audioUri,
    createdAt
  ) => {
=======
  const addMeeting = (transcribedText, summary, importantDates, audioUri, createdAt) => {
>>>>>>> 28f59a3a1e20dc285a5a2d10aefcc5dae852e315
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
