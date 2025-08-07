// context/MeetingContext.js
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

  // Load list previews on mount
  useEffect(() => {
    (async () => {
      try {
        await initDb();
        await ensureDirs();
        const rows = await getAllRows();
        setMeetings(
          rows.map((r) => ({
            id: r.id,
            topic: r.topic,
            preview: r.preview,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }))
        );
      } catch (e) {
        console.warn("Load error", e);
        Alert.alert("خطأ", "فشل تحميل الاجتماعات");
      }
    })();
  }, []);

  const genId = () => Crypto.randomUUID();

  const addMeeting = useCallback(
    async (text, summary, dates, audioUri, topic) => {
      const id = genId();
      const now = new Date().toISOString();
      const p = pathsFor(id);

      await writeTextFile(p.textPath, text);
      await writeTextFile(p.summaryPath, summary);
      await writeJsonFile(p.datesPath, dates);

      const audioPath = audioUri ? await copyAudioIntoVault(id, audioUri) : "";

      const preview = summary.slice(0, 180);

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

      setMeetings((m) => [
        { id, topic, preview, createdAt: now, updatedAt: now },
        ...m,
      ]);
    },
    []
  );

  const deleteMeeting = useCallback(async (id) => {
    await deleteRow(id);
    setMeetings((m) => m.filter((x) => x.id !== id));
  }, []);

  /**
   * Load the full meeting payload (text, summary, dates, audioUri, topic).
   */
  const getFullMeeting = useCallback(async (id) => {
    const row = await getRowById(id);
    if (!row) return null;
    const [text, summary, importantDates] = await Promise.all([
      readTextFile(row.text_path),
      readTextFile(row.summary_path),
      readJsonFile(row.dates_path),
    ]);
    return {
      id,
      topic: row.topic,
      text,
      summary,
      importantDates,
      audioUri: row.audio_path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }, []);

  const value = useMemo(
    () => ({
      meetings,
      addMeeting,
      deleteMeeting,
      getFullMeeting,
    }),
    [meetings, addMeeting, deleteMeeting, getFullMeeting]
  );

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
}

export const useMeetingContext = () => useContext(MeetingContext);
