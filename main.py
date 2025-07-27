"""
Flask Whisper API
– Handles WAV and MP3
– Converts MP3 → WAV on the fly
– Logs file type / shape for debugging
"""

from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os, sys, mimetypes, tempfile

import torch, torchaudio, soundfile as sf
from pydub import AudioSegment            # needs ffmpeg in PATH
from transformers import (
    WhisperProcessor,
    WhisperForConditionalGeneration,
)

# ────────────────────────── Flask setup ──────────────────────────
app = Flask(__name__)
UPLOAD_FOLDER   = "uploads"
SEGMENTS_FOLDER = "segments"
os.makedirs(UPLOAD_FOLDER,   exist_ok=True)
os.makedirs(SEGMENTS_FOLDER, exist_ok=True)

# ────────────────────────── Whisper load ─────────────────────────
try:
    print(">>> Loading Whisper-small …")
    processor = WhisperProcessor.from_pretrained("openai/whisper-small")
    model     = WhisperForConditionalGeneration.from_pretrained("openai/whisper-small")
    model.eval()
    print(">>> Whisper model ready.")
except Exception as e:
    print("🚨 Failed to load model:", e)
    sys.exit(1)

# ──────────────────────── Audio helper ───────────────────────────
def load_audio_any(path):
    """
    Return (waveform 1-D FloatTensor, sample_rate int).
    Converts MP3 (or any non-WAV) to WAV so soundfile can read it.
    """
    mime, _ = mimetypes.guess_type(path)
    print(f"🛈 FILE: {path}  MIME: {mime}")

    # convert MP3 → temp WAV
    if mime == "audio/mpeg":
        tmp_wav = tempfile.mktemp(suffix=".wav")
        print("↪ Converting MP3 → WAV:", tmp_wav)
        AudioSegment.from_file(path).export(tmp_wav, format="wav")
        path = tmp_wav

    waveform, sr = sf.read(path, always_2d=True)     # shape (time, channels)
    print(f"🛈 Loaded shape {waveform.shape}  sr {sr}")

    # if stereo → mono
    if waveform.shape[1] > 1:
        waveform = waveform.mean(axis=1)

    waveform = torch.tensor(waveform.squeeze(), dtype=torch.float32)  # 1-D
    return waveform, sr

def transcribe_audio(segment_path, lang="ar"):
    waveform, sr = load_audio_any(segment_path)

    # resample to 16 kHz if needed
    if sr != 16000:
        waveform = torchaudio.functional.resample(
            waveform.unsqueeze(0), orig_freq=sr, new_freq=16000
        ).squeeze(0)

    feats = processor(waveform, sampling_rate=16000, return_tensors="pt").input_features
    dec_ids = processor.get_decoder_prompt_ids(language=lang, task="transcribe")
    pred_ids = model.generate(feats, forced_decoder_ids=dec_ids)
    return processor.batch_decode(pred_ids, skip_special_tokens=True)[0]

# ─────────────────────────── Routes ──────────────────────────────
@app.route("/")
def health():
    return "✅ Whisper transcription API is running."

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" not in request.files or request.files["file"].filename == "":
        return jsonify({"error": "يرجى إرسال ملف صوتي صالح"}), 400

    f = request.files["file"]
    filename  = secure_filename(f.filename)
    filepath  = os.path.join(UPLOAD_FOLDER, filename)
    f.save(filepath)

    full_text = ""
    try:
        # split long audio into 30-s WAV segments
        audio = AudioSegment.from_file(filepath)
        seg_len = 30 * 1000
        num_seg = len(audio) // seg_len + 1

        for i in range(num_seg):
            start, end = i * seg_len, min((i + 1) * seg_len, len(audio))
            segment    = audio[start:end]
            seg_path   = os.path.join(SEGMENTS_FOLDER, f"seg_{i}.wav")
            segment.export(seg_path, format="wav")

            full_text += transcribe_audio(seg_path) + "\n"

        return jsonify({"text": full_text.strip()})

    except Exception as e:
        print("⚠️ Server error:", e)
        return jsonify({"error": "حصل خطأ أثناء التفريغ الصوتي", "details": str(e)}), 500

    finally:
        # tidy up
        if os.path.exists(filepath):
            os.remove(filepath)
        for fn in os.listdir(SEGMENTS_FOLDER):
            os.remove(os.path.join(SEGMENTS_FOLDER, fn))

# ─────────────────────────── Run ─────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, host="0.0.0.0", port=5009)


