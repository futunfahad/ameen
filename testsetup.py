import whisper
import os

model_dir = "D:/whisper_models"
os.makedirs(model_dir, exist_ok=True)

# Download and save the model manually to the directory
model = whisper.load_model("small", download_root=model_dir)

print("Model is ready.")
