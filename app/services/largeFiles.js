// services/largeFiles.js
import * as FileSystem from "expo-file-system";

const ROOT = FileSystem.documentDirectory + "meetings/";
const TXT_DIR = ROOT + "text/";
const SUM_DIR = ROOT + "summary/";
const DATES_DIR = ROOT + "dates/";
const AUDIO_DIR = ROOT + "audio/";

export async function ensureDirs() {
  for (const d of [ROOT, TXT_DIR, SUM_DIR, DATES_DIR, AUDIO_DIR]) {
    try {
      const info = await FileSystem.getInfoAsync(d);
      if (!info.exists)
        await FileSystem.makeDirectoryAsync(d, { intermediates: true });
    } catch {
      // noop
    }
  }
}

export function pathsFor(id) {
  return {
    textPath: `${TXT_DIR}${id}.txt`,
    summaryPath: `${SUM_DIR}${id}.txt`,
    datesPath: `${DATES_DIR}${id}.json`,
  };
}

export async function writeTextFile(path, content = "") {
  await FileSystem.writeAsStringAsync(path, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}

export async function readTextFile(path) {
  if (!path) return "";
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return "";
  return FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function writeJsonFile(path, obj) {
  await FileSystem.writeAsStringAsync(path, JSON.stringify(obj ?? []), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return path;
}

export async function readJsonFile(path) {
  if (!path) return [];
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return [];
  const raw = await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Copy the source audio into the app's vault with a UNIQUE filename.
 * We avoid "move" to keep the original recording intact.
 * Example destination: audio/<id>_1733582330123_abcd.m4a
 */
export async function copyAudioIntoVault(id, srcUri) {
  if (!srcUri) return "";
  const cleanSrc = srcUri.startsWith("file://") ? srcUri : "file://" + srcUri;
  const extGuess = cleanSrc.split(".").pop()?.split("?")[0] || "m4a";
  const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const dst = `${AUDIO_DIR}${id}_${unique}.${extGuess}`;

  await FileSystem.copyAsync({ from: cleanSrc, to: dst });
  return dst;
}
