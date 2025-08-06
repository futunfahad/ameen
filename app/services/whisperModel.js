import * as FileSystem from "expo-file-system";

export const MODEL_FILE = "ggml-large-v3-turbo.bin";
export const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin";
const EXPECTED_MIN_BYTES = 22 * 1024 * 1024;

export async function ensureWhisperModel(progressCb) {
  const dirUri = FileSystem.documentDirectory;
  const fileUri = dirUri + MODEL_FILE;
  const filePath = fileUri.replace(/^file:\/\//, "");

  let info = await FileSystem.getInfoAsync(fileUri);
  if (info.exists && info.size >= EXPECTED_MIN_BYTES) return filePath;

  if (info.exists) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }

  const downloadResumable = FileSystem.createDownloadResumable(
    MODEL_URL,
    fileUri,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (progressCb && totalBytesExpectedToWrite) {
        const pct = Math.floor(
          (totalBytesWritten / totalBytesExpectedToWrite) * 100
        );
        progressCb(pct);
      }
    }
  );

  await downloadResumable.downloadAsync();

  info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists || info.size < EXPECTED_MIN_BYTES) {
    throw new Error("Model download incomplete or corrupted");
  }

  return filePath;
}
