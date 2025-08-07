// services/persist.js
import * as FileSystem from "expo-file-system";

const FILE = FileSystem.documentDirectory + "meetings.json";

export async function loadMeetings() {
  try {
    const info = await FileSystem.getInfoAsync(FILE);
    if (!info.exists) return [];
    const json = await FileSystem.readAsStringAsync(FILE, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const data = JSON.parse(json);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("loadMeetings failed:", e);
    return [];
  }
}

export async function saveMeetings(meetings) {
  try {
    const json = JSON.stringify(meetings);
    await FileSystem.writeAsStringAsync(FILE, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (e) {
    console.warn("saveMeetings failed:", e);
  }
}
