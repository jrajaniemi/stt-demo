#!/usr/bin/env python3
import os
import sys
import logging
import openai
from dotenv import load_dotenv

# Logging settings
logging.basicConfig(
    filename='stt_agent.log',
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    logging.error("OPENAI_API_KEY not found in .env file")
    sys.exit(1)

openai.api_key = OPENAI_API_KEY

# Supported audio file extensions
ALLOWED_EXTENSIONS = {'.flac', '.m4a', '.mp3', '.mp4', '.mpeg', '.mpga', '.oga', '.ogg', '.wav', '.webm'}


def transcribe_audio_file(file_path: str) -> str:
    """Transcribe an audio file using OpenAI Whisper API and save the result to a text file."""
    file_ext = os.path.splitext(file_path)[1].lower()

    if not os.path.exists(file_path):
        msg = f"File not found: {file_path}"
        logging.error(msg)
        raise FileNotFoundError(msg)

    if file_ext not in ALLOWED_EXTENSIONS:
        msg = f"Unsupported file extension: {file_ext}"
        logging.info(msg)
        raise ValueError(msg)

    try:
        with open(file_path, "rb") as audio_file:
            logging.info(f"Starting transcription for file: {file_path}")
            transcription = openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

            transcription_text = transcription  # String response
            txt_file_path = os.path.splitext(file_path)[0] + ".txt"

            with open(txt_file_path, "w", encoding="utf-8") as txt_file:
                txt_file.write(transcription_text)

            logging.info(f"Transcription saved to file: {txt_file_path}")
            return transcription_text

    except Exception as e:
        msg = f"Transcription failed for file {file_path}: {e}"
        logging.error(msg)
        raise RuntimeError(msg)


def main():
    """Main entry point for command-line usage."""
    if len(sys.argv) != 2:
        logging.error("Missing file path. Usage: python3 stt-agent.py /path/to/file")
        sys.exit(1)

    file_path = sys.argv[1]

    try:
        result = transcribe_audio_file(file_path)
        print(result)
    except (FileNotFoundError, ValueError, RuntimeError):
        sys.exit(1)


if __name__ == "__main__":
    main()
