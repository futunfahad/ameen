// services/whisperInstance.js

// Always export a stable object (never null) so .current is safe to read.
export const whisperRef = { current: null };

/**
 * Safely release the Whisper instance if it exists.
 * - Does nothing if already released or never created.
 * - Never throws if whisperRef is unset/missing.
 */
export async function safeReleaseWhisper(tag = "safeReleaseWhisper") {
  try {
    const inst = whisperRef && whisperRef.current;
    if (inst && typeof inst.release === "function") {
      await inst.release();
      // Optional tiny delay helps the native layer settle on some devices
      await new Promise((r) => setTimeout(r, 50));
    }
  } catch (e) {
    console.warn(`⚠️ ${tag}: Whisper release failed:`, e);
  } finally {
    if (whisperRef) whisperRef.current = null;
  }
}
