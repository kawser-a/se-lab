import os
import wave
from pydub import AudioSegment
from pydub.utils import which
from google.cloud import speech_v1 as speech

# Ensure ffmpeg is discoverable by pydub
AudioSegment.converter = which("ffmpeg") or r"C:\FFmpeg\bin\ffmpeg.exe"

# Open the WAV file to extract the sample rate
with wave.open("sample_1.wav", "rb") as wav_file:
    sample_rate = wav_file.getframerate()
    print(f"Sample Rate: {sample_rate}")

# Initialize Google Cloud Speech client
client = speech.SpeechClient.from_service_account_file('gen-lang-client-0812402702-e7b7f6dc27bf.json')

def convert_to_mono(input_file, output_file):
    audio = AudioSegment.from_file(input_file)
    audio = audio.set_channels(1)
    audio.export(output_file, format="wav")
    print("Converted to mono")

def transcribe_audio(input_file):
    with open(input_file, 'rb') as audio_files:
        content = audio_files.read()
        audio = speech.RecognitionAudio(content=content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=sample_rate,
            language_code='en-US'
        )
        response = client.recognize(config=config, audio=audio)
        for result in response.results:
            print(f"Transcript: {result.alternatives[0].transcript}")
            print(f"Confidence: {result.alternatives[0].confidence}")
    return response

# Convert and transcribe
convert_to_mono("sample.wav", "sample_output.wav")
transcribe_audio("sample_output.wav")
