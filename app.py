from flask import Flask, request, jsonify
from pydub import AudioSegment
import os, tempfile, wave, json
from vosk import Model, KaldiRecognizer

# ───────────────────── Flask & Vosk Setup ─────────────────────
app = Flask(__name__)
model = Model("vosk-model-ar-0.22-linto-1.1.0")  # ← Your Arabic model path

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    # Step 1: Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".input") as temp_input:
        file.save(temp_input.name)

    # Step 2: Convert to proper WAV format (16kHz, mono, 16-bit PCM)
    try:
        audio = AudioSegment.from_file(temp_input.name)
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
            wav_path = temp_wav.name
            audio.export(wav_path, format="wav")
    except Exception as e:
        os.unlink(temp_input.name)
        return jsonify({"error": f"Failed to convert audio: {e}"}), 500
    finally:
        try:
            os.unlink(temp_input.name)
        except:
            pass

    # Step 3: Run Vosk ASR
    try:
        wf = wave.open(wav_path, "rb")

        # Validate format
        if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 16000:
            wf.close()
            raise ValueError("Invalid WAV format: must be mono, 16-bit, 16kHz")

        rec = KaldiRecognizer(model, 16000)
        rec.SetWords(True)

        result_text = ""
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                result_text += result.get("text", "") + " "

        final = json.loads(rec.FinalResult())
        result_text += final.get("text", "")
        wf.close()

        return jsonify({"text": result_text.strip()})
    except Exception as e:
        return jsonify({"error": f"Transcription failed: {e}"}), 500
    finally:
        try:
            os.unlink(wav_path)
        except:
            print("⚠️ Failed to delete temp wav file")

# ───────────────────── Run the Server ─────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
