// services/db.js
import * as SQLite from "expo-sqlite";

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;

  // SDK 52+: async API exists
  if (SQLite.openDatabaseAsync) {
    dbInstance = await SQLite.openDatabaseAsync("meetings.db");
    await dbInstance.execAsync("PRAGMA journal_mode = WAL;");
    return dbInstance;
  }

  // Fallback wrapper for older SDKs (keeps same async surface)
  const legacy = SQLite.openDatabase("meetings.db");
  dbInstance = {
    execAsync: (sql) =>
      new Promise((resolve, reject) => {
        legacy.transaction((tx) => {
          tx.executeSql(
            sql,
            [],
            () => resolve(),
            (_, err) => (reject(err), false)
          );
        });
      }),
    runAsync: (sql, ...args) =>
      new Promise((resolve, reject) => {
        legacy.transaction((tx) => {
          tx.executeSql(
            sql,
            args,
            () => resolve(),
            (_, err) => (reject(err), false)
          );
        });
      }),
    getAllAsync: (sql, ...args) =>
      new Promise((resolve, reject) => {
        legacy.transaction((tx) => {
          tx.executeSql(
            sql,
            args,
            (_, { rows }) => resolve(rows._array ?? []),
            (_, err) => (reject(err), false)
          );
        });
      }),
    getFirstAsync: async (sql, ...args) => {
      const rows = await dbInstance.getAllAsync(sql, ...args);
      return rows[0] ?? null;
    },
  };
  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY NOT NULL,
      topic TEXT,
      text_path TEXT,
      summary_path TEXT,
      dates_path TEXT,
      audio_path TEXT,
      preview TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);
}

export async function insertRow(row) {
  const db = await getDb();
  const {
    id,
    topic,
    text_path,
    summary_path,
    dates_path,
    audio_path,
    preview,
    created_at,
    updated_at,
  } = row;
  if (!id) throw new Error("insertRow(): missing id");

  await db.runAsync(
    `INSERT OR REPLACE INTO meetings
     (id, topic, text_path, summary_path, dates_path, audio_path, preview, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    topic ?? "",
    text_path ?? "",
    summary_path ?? "",
    dates_path ?? "",
    audio_path ?? "",
    preview ?? "",
    created_at,
    updated_at
  );
}

export async function updateRow(id, patch) {
  const db = await getDb();
  const keys = Object.keys(patch);
  if (!keys.length) return;
  const set = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => patch[k]);
  await db.runAsync(`UPDATE meetings SET ${set} WHERE id = ?`, ...values, id);
}

export async function getAllRows() {
  const db = await getDb();
  return db.getAllAsync(
    "SELECT * FROM meetings ORDER BY datetime(created_at) DESC, datetime(updated_at) DESC"
  );
}

export async function getRowById(id) {
  const db = await getDb();
  return db.getFirstAsync("SELECT * FROM meetings WHERE id = ?", id);
}

export async function deleteRow(id) {
  const db = await getDb();
  await db.runAsync("DELETE FROM meetings WHERE id = ?", id);
}
