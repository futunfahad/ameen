import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Alert } from "react-native";
import * as Crypto from "expo-crypto";

import {
  initDb,
  getAllRows,
  insertRow,
  deleteRow,
  getRowById,
} from "../services/db";
import {
  ensureDirs,
  writeTextFile,
  readTextFile,
  writeJsonFile,
  readJsonFile,
  copyAudioIntoVault,
  pathsFor,
} from "../services/largeFiles";

export const MeetingContext = createContext();

export function MeetingProvider({ children }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to validate and normalize dates
  const normalizeDates = useCallback((dates) => {
    if (!Array.isArray(dates)) return [];

    return dates.map((item) => {
      if (typeof item !== "object" || item === null) {
        return {
          date: new Date().toISOString().split("T")[0],
          time: "00:00",
          title: "اجتماع",
        };
      }

      return {
        date: item.date || new Date().toISOString().split("T")[0],
        time: /^\d{2}:\d{2}$/.test(item.time) ? item.time : "00:00",
        title: item.title || "اجتماع",
      };
    });
  }, []);

  // Load meetings on component mount
  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        setError(null);

        await initDb();
        await ensureDirs();

        const rows = await getAllRows();
        console.log(`Loading ${rows.length} meetings from database`);

        const list = await Promise.all(
          rows.map(async (r) => {
            try {
              // Load and validate dates JSON
              let dates = [];
              try {
                if (r.dates_path) {
                  const rawDates = await readJsonFile(r.dates_path);
                  dates = normalizeDates(rawDates);
                }
              } catch (dateError) {
                console.warn(
                  `Error loading dates for meeting ${r.id}:`,
                  dateError
                );
                dates = [];
              }

              return {
                id: r.id,
                topic: r.topic || "اجتماع بدون عنوان",
                summary: r.preview || "",
                text: r.preview || "",
                importantDates: dates,
                audioUri: r.audio_path || "",
                createdAt: r.created_at,
                updatedAt: r.updated_at,
              };
            } catch (meetingError) {
              console.error(`Error processing meeting ${r.id}:`, meetingError);
              return null;
            }
          })
        );

        // Filter out null entries (failed to load)
        const validMeetings = list.filter((meeting) => meeting !== null);
        setMeetings(validMeetings);

        console.log(`Successfully loaded ${validMeetings.length} meetings`);
      } catch (error) {
        console.error("Error loading meetings:", error);
        setError(error.message);
        Alert.alert("خطأ", "فشل تحميل الاجتماعات");
      } finally {
        setLoading(false);
      }
    };

    loadMeetings();
  }, [normalizeDates]);

  const genId = useCallback(() => {
    try {
      return Crypto.randomUUID();
    } catch (error) {
      // Fallback if Crypto.randomUUID() fails
      return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
  }, []);

  // Add a brand-new meeting
  const addMeeting = useCallback(
    async (text, summary, dates, audioUri, topic) => {
      try {
        if (!text || !summary) {
          throw new Error("النص والملخص مطلوبان");
        }

        const id = genId();
        const now = new Date().toISOString();
        const p = pathsFor(id);

        console.log(`Adding new meeting with ID: ${id}`);

        // Normalize and validate dates before saving
        const normalizedDates = normalizeDates(dates || []);
        console.log("Saving dates:", JSON.stringify(normalizedDates, null, 2));

        // Write files with error handling
        await writeTextFile(p.textPath, text);
        await writeTextFile(p.summaryPath, summary);
        await writeJsonFile(p.datesPath, normalizedDates);

        // Copy audio with error handling
        let audioPath = "";
        if (audioUri) {
          try {
            audioPath = await copyAudioIntoVault(id, audioUri);
            console.log(`Audio copied to: ${audioPath}`);
          } catch (audioError) {
            console.warn(
              "Failed to copy audio, proceeding without it:",
              audioError
            );
            audioPath = "";
          }
        }

        // Create preview (first 180 chars of summary)
        const preview = summary.slice(0, 180);

        // Insert row into database
        await insertRow({
          id,
          topic: topic || "اجتماع جديد",
          text_path: p.textPath,
          summary_path: p.summaryPath,
          dates_path: p.datesPath,
          audio_path: audioPath,
          preview,
          created_at: now,
          updated_at: now,
        });

        // Update in-memory list
        const newMeeting = {
          id,
          topic: topic || "اجتماع جديد",
          summary: preview,
          text: preview,
          importantDates: normalizedDates,
          audioUri: audioPath,
          createdAt: now,
          updatedAt: now,
        };

        setMeetings((prevMeetings) => [newMeeting, ...prevMeetings]);

        console.log(`Meeting ${id} added successfully`);
        return id;
      } catch (error) {
        console.error("Failed to add meeting:", error);
        Alert.alert("خطأ", error.message || "فشل في إضافة الاجتماع");
        throw error;
      }
    },
    [genId, normalizeDates]
  );

  // Delete meeting by ID
  const deleteMeeting = useCallback(async (id) => {
    try {
      if (!id) {
        throw new Error("معرف الاجتماع مطلوب");
      }

      console.log(`Deleting meeting: ${id}`);
      await deleteRow(id);

      setMeetings((prevMeetings) =>
        prevMeetings.filter((meeting) => meeting.id !== id)
      );

      console.log(`Meeting ${id} deleted successfully`);
    } catch (error) {
      console.error("Failed to delete meeting:", error);
      Alert.alert("خطأ", error.message || "فشل في حذف الاجتماع");
      throw error;
    }
  }, []);

  // Get full meeting data (for Archive screen)
  const getFullMeeting = useCallback(
    async (id) => {
      try {
        if (!id) {
          throw new Error("معرف الاجتماع مطلوب");
        }

        console.log(`Loading full meeting: ${id}`);
        const row = await getRowById(id);
        if (!row) {
          console.warn(`Meeting ${id} not found in database`);
          return null;
        }

        try {
          const [text, summary, dates] = await Promise.all([
            readTextFile(row.text_path).catch(() => ""),
            readTextFile(row.summary_path).catch(() => ""),
            readJsonFile(row.dates_path)
              .then(normalizeDates)
              .catch(() => []),
          ]);

          const fullMeeting = {
            id,
            topic: row.topic || "اجتماع بدون عنوان",
            text,
            summary,
            importantDates: dates,
            audioUri: row.audio_path || "",
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };

          console.log(`Full meeting ${id} loaded successfully`);
          return fullMeeting;
        } catch (fileError) {
          console.error(`Error loading files for meeting ${id}:`, fileError);
          throw new Error("فشل في تحميل ملفات الاجتماع");
        }
      } catch (error) {
        console.error(`Error loading full meeting ${id}:`, error);
        throw error;
      }
    },
    [normalizeDates]
  );

  // Update meeting (if you need this functionality)
  const updateMeeting = useCallback(
    async (id, updates) => {
      try {
        if (!id || !updates) {
          throw new Error("معرف الاجتماع والتحديثات مطلوبة");
        }

        const meeting = meetings.find((m) => m.id === id);
        if (!meeting) {
          throw new Error("الاجتماع غير موجود");
        }

        // Update the meeting in the list
        setMeetings((prevMeetings) =>
          prevMeetings.map((m) =>
            m.id === id
              ? { ...m, ...updates, updatedAt: new Date().toISOString() }
              : m
          )
        );

        console.log(`Meeting ${id} updated successfully`);
      } catch (error) {
        console.error("Failed to update meeting:", error);
        Alert.alert("خطأ", error.message || "فشل في تحديث الاجتماع");
        throw error;
      }
    },
    [meetings]
  );

  const value = useMemo(
    () => ({
      meetings,
      loading,
      error,
      addMeeting,
      deleteMeeting,
      getFullMeeting,
      updateMeeting,
    }),
    [
      meetings,
      loading,
      error,
      addMeeting,
      deleteMeeting,
      getFullMeeting,
      updateMeeting,
    ]
  );

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
}

export const useMeetingContext = () => {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error("useMeetingContext must be used within a MeetingProvider");
  }
  return context;
};
