/*// src/services/audioConverter.js
import { FFmpegKit } from "@react-native-oh-tpl/react-native-ffmpeg-kit";

import * as FileSystem from "expo-file-system";


 * Convert an input M4A (or whatever) to 16kHz mono PCM WAV.
 * @param {string} m4aUri – file:// URI of the recorded audio
 * @returns {Promise<string>} – file:// URI of the new WAV

export async function convertToWav(m4aUri) {
  // Strip the file:// prefix for FFmpegKit
  const inputPath = m4aUri.replace(/^file:\/\//, "");
  // Write output alongside, replacing extension
  const wavPath = inputPath.replace(/\.\w+$/, ".wav");

  // Make sure the folder exists
  const folder = wavPath.substring(0, wavPath.lastIndexOf("/"));
  await FileSystem.makeDirectoryAsync(folder, { intermediates: true });

  // Run FFmpeg: -ar 16000 (rate), -ac 1 (mono), WAV container
  const cmd = `-i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavPath}"`;
  await FFmpegKit.execute(cmd);

  // Verify
  const info = await FileSystem.getInfoAsync("file://" + wavPath);
  if (!info.exists) {
    throw new Error("WAV conversion failed");
  }
  return "file://" + wavPath;
}
*/
