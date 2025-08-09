import * as FileSystem from "expo-file-system";

export const MODEL_FILE = "ggml-large-v3-turbo.bin";
export const MODEL_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin";

// Updated expected size based on actual model size
const EXPECTED_MIN_BYTES = 809 * 1024 * 1024; // ~809MB
const EXPECTED_MAX_BYTES = 8200 * 1024 * 1024; // ~820MB (with some tolerance)

export async function ensureWhisperModel(progressCb) {
  const dirUri = FileSystem.documentDirectory;
  const fileUri = dirUri + MODEL_FILE;
  const filePath = fileUri.replace(/^file:\/\//, "");

  console.log("Checking Whisper model at:", fileUri);

  try {
    let info = await FileSystem.getInfoAsync(fileUri);

    // Check if file exists and has correct size
    if (info.exists) {
      console.log("Model file found, size:", info.size, "bytes");

      if (info.size >= EXPECTED_MIN_BYTES && info.size <= EXPECTED_MAX_BYTES) {
        console.log("Model file size is correct");
        return filePath;
      } else {
        console.log(
          "Model file size incorrect, expected:",
          EXPECTED_MIN_BYTES,
          "-",
          EXPECTED_MAX_BYTES
        );
        console.log("Deleting corrupted model file");
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
      }
    } else {
      console.log("Model file does not exist");
    }

    // Download the model
    console.log("Downloading Whisper model from:", MODEL_URL);

    const downloadResumable = FileSystem.createDownloadResumable(
      MODEL_URL,
      fileUri,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; whisper-rn-app)",
        },
      },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (
          progressCb &&
          totalBytesExpectedToWrite &&
          totalBytesExpectedToWrite > 0
        ) {
          const pct = Math.floor(
            (totalBytesWritten / totalBytesExpectedToWrite) * 100
          );
          console.log("Download progress:", pct + "%");
          progressCb(pct);
        } else if (progressCb) {
          // If we don't know the total size, show bytes downloaded
          const mbDownloaded = (totalBytesWritten / (1024 * 1024)).toFixed(1);
          console.log("Downloaded:", mbDownloaded + "MB");
          progressCb(-1); // Indicate indeterminate progress
        }
      }
    );

    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult || !downloadResult.uri) {
      throw new Error("Download failed - no result URI");
    }

    // Verify the downloaded file
    info = await FileSystem.getInfoAsync(fileUri);
    console.log("Downloaded file size:", info.size, "bytes");

    if (!info.exists) {
      throw new Error("Model file does not exist after download");
    }

    if (info.size < EXPECTED_MIN_BYTES) {
      console.error(
        "Downloaded file too small:",
        info.size,
        "< expected:",
        EXPECTED_MIN_BYTES
      );
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      throw new Error(
        "Model download incomplete or corrupted (file too small)"
      );
    }

    if (info.size > EXPECTED_MAX_BYTES) {
      console.error(
        "Downloaded file too large:",
        info.size,
        "> expected:",
        EXPECTED_MAX_BYTES
      );
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      throw new Error("Model download corrupted (file too large)");
    }

    console.log("Model downloaded and verified successfully");
    return filePath;
  } catch (error) {
    console.error("Error in ensureWhisperModel:", error);

    // Clean up any partial download
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (cleanupError) {
      console.warn("Error cleaning up partial download:", cleanupError);
    }

    throw new Error(`Failed to ensure Whisper model: ${error.message}`);
  }
}

// Helper function to check if model exists and is valid
export async function isModelValid() {
  const dirUri = FileSystem.documentDirectory;
  const fileUri = dirUri + MODEL_FILE;

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    return (
      info.exists &&
      info.size >= EXPECTED_MIN_BYTES &&
      info.size <= EXPECTED_MAX_BYTES
    );
  } catch (error) {
    console.error("Error checking model validity:", error);
    return false;
  }
}

// Helper function to get model info
export async function getModelInfo() {
  const dirUri = FileSystem.documentDirectory;
  const fileUri = dirUri + MODEL_FILE;

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    return {
      exists: info.exists,
      size: info.size,
      sizeInMB: info.exists ? (info.size / (1024 * 1024)).toFixed(1) : 0,
      path: fileUri.replace(/^file:\/\//, ""),
      isValid:
        info.exists &&
        info.size >= EXPECTED_MIN_BYTES &&
        info.size <= EXPECTED_MAX_BYTES,
    };
  } catch (error) {
    console.error("Error getting model info:", error);
    return {
      exists: false,
      size: 0,
      sizeInMB: 0,
      path: "",
      isValid: false,
      error: error.message,
    };
  }
}

// Helper function to delete model (for debugging/reset)
export async function deleteModel() {
  const dirUri = FileSystem.documentDirectory;
  const fileUri = dirUri + MODEL_FILE;

  try {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    console.log("Model deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting model:", error);
    throw error;
  }
}
