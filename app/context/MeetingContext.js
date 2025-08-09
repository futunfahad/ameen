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

  // Helper function to validate and normalize dates
  const normalizeDates = (dates) => {
    if (!Array.isArray(dates)) return [];

    return dates.map((item) => ({
      date: item.date || new Date().toISOString().split("T")[0],
      time: /^\d{2}:\d{2}$/.test(item.time) ? item.time : "00:00",
      title: item.title || "اجتماع",
    }));
  };

  // ─── Load list (preview + dates + audioUri) ───
  useEffect(() => {
    (async () => {
      try {
        await initDb();
        await ensureDirs();
        const rows = await getAllRows();
        const list = await Promise.all(
          rows.map(async (r) => {
            // load and validate dates JSON
            let dates = [];
            try {
              if (r.dates_path) {
                dates = await readJsonFile(r.dates_path);
                dates = normalizeDates(dates);
              }
            } catch (e) {
              console.warn(`Error loading dates for ${r.id}:`, e);
            }

            return {
              id: r.id,
              topic: r.topic,
              summary: r.preview,
              text: r.preview,
              importantDates: dates,
              audioUri: r.audio_path,
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            };
          })
        );
        setMeetings(list);
      } catch (e) {
        console.warn("Load meetings error", e);
        Alert.alert("خطأ", "فشل تحميل الاجتماعات");
      }
    })();
  }, []);

  const genId = () => Crypto.randomUUID();

  // ─── Add a brand-new meeting ───
  const addMeeting = useCallback(
    async (text, summary, dates, audioUri, topic) => {
      try {
        const id = genId();
        const now = new Date().toISOString();
        const p = pathsFor(id);

        // Normalize dates before saving
        const normalizedDates = normalizeDates(dates);
        console.log("Saving dates:", JSON.stringify(normalizedDates, null, 2));

        // write files
        await writeTextFile(p.textPath, text);
        await writeTextFile(p.summaryPath, summary);
        await writeJsonFile(p.datesPath, normalizedDates);

        // copy audio
        const audioPath = audioUri
          ? await copyAudioIntoVault(id, audioUri)
          : "";

        // preview = first 180 chars of summary
        const preview = summary.slice(0, 180);

        // insert row
        await insertRow({
          id,
          topic,
          text_path: p.textPath,
          summary_path: p.summaryPath,
          dates_path: p.datesPath,
          audio_path: audioPath,
          preview,
          created_at: now,
          updated_at: now,
        });

        // update in-memory list
        setMeetings((m) => [
          {
            id,
            topic,
            summary: preview,
            text: preview,
            importantDates: normalizedDates,
            audioUri: audioPath,
            createdAt: now,
            updatedAt: now,
          },
          ...m,
        ]);
      } catch (error) {
        console.error("Failed to add meeting:", error);
        throw error;
      }
    },
    []
  );

  // ─── Delete by ID ───
  const deleteMeeting = useCallback(async (id) => {
    await deleteRow(id);
    setMeetings((m) => m.filter((x) => x.id !== id));
  }, []);

  // ─── Get full meeting (for Archive) ───
  const getFullMeeting = useCallback(async (id) => {
    const row = await getRowById(id);
    if (!row) return null;

    try {
      const [text, summary, dates] = await Promise.all([
        readTextFile(row.text_path),
        readTextFile(row.summary_path),
        readJsonFile(row.dates_path).then(normalizeDates),
      ]);

      return {
        id,
        topic: row.topic,
        text,
        summary,
        importantDates: dates,
        audioUri: row.audio_path,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error(`Error loading full meeting ${id}:`, error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({ meetings, addMeeting, deleteMeeting, getFullMeeting }),
    [meetings, addMeeting, deleteMeeting, getFullMeeting]
  );

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
}

export const useMeetingContext = () => useContext(MeetingContext);
