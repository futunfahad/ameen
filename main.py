from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
import torch
import torchaudio
import soundfile as sf
from pydub import AudioSegment
from transformers import WhisperProcessor, WhisperForConditionalGeneration

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
SEGMENTS_FOLDER = "segments"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SEGMENTS_FOLDER, exist_ok=True)

# تحميل نموذج Whisper
try:
    print(">>> Loading Whisper processor/model…")
    processor = WhisperProcessor.from_pretrained("openai/whisper-small")
    model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-small")
    model.eval()
    print(">>> Whisper model loaded successfully.")
except Exception as e:
    print("🚨 Exception during model load:", e)
    import sys
    sys.exit(1)


def load_audio(filepath):
    waveform, sample_rate = sf.read(filepath, always_2d=True)
    waveform = torch.tensor(waveform).float()
    if waveform.shape[1] > 1:
        waveform = waveform.mean(dim=1)
    return waveform, sample_rate

def transcribe_audio(audio_path, lang="ar"):
    waveform, sample_rate = load_audio(audio_path)

    if sample_rate != 16000:
        waveform = torchaudio.functional.resample(
            waveform.unsqueeze(0), orig_freq=sample_rate, new_freq=16000
        ).squeeze(0)

    input_features = processor(
        waveform, sampling_rate=16000, return_tensors="pt"
    ).input_features
    decoder_ids = processor.get_decoder_prompt_ids(language=lang, task="transcribe")
    predicted_ids = model.generate(input_features, forced_decoder_ids=decoder_ids)
    return processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]

@app.route("/")
def index():
    return "✅ Whisper transcription API is running."

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" not in request.files or request.files["file"].filename == "":
        return jsonify({"error": "يرجى إرسال ملف صوتي صالح"}), 400

    file = request.files["file"]
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    full_transcription = ""

    try:
        # قراءة الملف
        audio = AudioSegment.from_file(filepath)
        segment_length = 30 * 1000  # 30 ثانية
        num_segments = len(audio) // segment_length + 1

        for i in range(num_segments):
            start = i * segment_length
            end = min((i + 1) * segment_length, len(audio))
            segment = audio[start:end]
            segment_path = os.path.join(SEGMENTS_FOLDER, f"seg_{i}.wav")
            segment.export(segment_path, format="wav")

            transcript = transcribe_audio(segment_path)
            full_transcription += transcript + "\n"

        return jsonify({"text": full_transcription.strip()})

    except Exception as e:
        print("⚠️ Exception:", str(e))
        return jsonify({"error": "حصل خطأ أثناء التفريغ الصوتي", "details": str(e)}), 500

    finally:
        # تنظيف الملفات دائمًا
        if os.path.exists(filepath):
            os.remove(filepath)
        for seg_file in os.listdir(SEGMENTS_FOLDER):
            seg_path = os.path.join(SEGMENTS_FOLDER, seg_file)
            if os.path.exists(seg_path):
                os.remove(seg_path)

if __name__ == "__main__":
    # no re-loader → one process, model loaded once
    app.run(debug=True, use_reloader=False, host="0.0.0.0", port=5009)
