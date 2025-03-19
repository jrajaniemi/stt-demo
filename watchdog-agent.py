#!/usr/bin/env python3
import os
import time
import logging
import sys
from collections import deque
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from stt_agent import transcribe_audio_file  # Import the transcription function

UPLOAD_DIR = os.path.join(os.getcwd(), 'uploads')
MODIFICATION_DELAY = 2  # seconds without modifications = file ready
MAX_TRACKED_FILES = 100000  # upper limit for memory management
ALLOWED_EXTENSIONS = {'.flac', '.m4a', '.mp3', '.mp4', '.mpeg', '.mpga', '.oga', '.ogg', '.wav', '.webm'}

# Logging configuration
logging.basicConfig(
    filename='upload_monitor.log',
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

class UploadEventHandler(FileSystemEventHandler):
    def __init__(self):
        self.file_mod_times = {}
        self.file_queue = deque()

    def on_created(self, event):
        if not event.is_directory:
            self._track_file(event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self._track_file(event.src_path)

    def _track_file(self, file_path):
        current_time = time.time()
        if file_path not in self.file_mod_times:
            if len(self.file_mod_times) >= MAX_TRACKED_FILES:
                oldest_file = self.file_queue.popleft()
                del self.file_mod_times[oldest_file]
                logging.warning(f"Memory management: Removed oldest file from tracking queue: {oldest_file}")
        self.file_mod_times[file_path] = current_time
        self.file_queue.append(file_path)

    def check_files(self):
        current_time = time.time()
        completed_files = []

        for file_path in list(self.file_mod_times):
            last_mod_time = self.file_mod_times[file_path]
            if current_time - last_mod_time > MODIFICATION_DELAY:
                completed_files.append(file_path)

        for file_path in completed_files:
            file_name = os.path.basename(file_path)
            file_ext = os.path.splitext(file_path)[1].lower()

            if file_ext not in ALLOWED_EXTENSIONS:
                logging.info(f"Skipped unsupported file type: {file_path}")
                self.file_queue.remove(file_path)
                del self.file_mod_times[file_path]
                continue

            try:
                file_size = os.path.getsize(file_path)
                print(f"Ready file: {file_name}, Size: {file_size} bytes")
                logging.info(f"Ready file: {file_name}, Size: {file_size} bytes")

                # Transcribe using imported function
                result = transcribe_audio_file(file_path)
                print(result)

            except Exception as e:
                logging.error(f"Error processing file: {file_path}, Error: {e}")

            self.file_queue.remove(file_path)
            del self.file_mod_times[file_path]

if __name__ == "__main__":
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    event_handler = UploadEventHandler()
    observer = Observer()
    observer.schedule(event_handler, path=UPLOAD_DIR, recursive=False)
    observer.start()

    print(f"AI agent is monitoring directory: {UPLOAD_DIR}")
    logging.info(f"AI agent started. Monitoring directory: {UPLOAD_DIR}")

    try:
        while True:
            time.sleep(1)
            event_handler.check_files()
    except KeyboardInterrupt:
        observer.stop()
        logging.info("AI agent stopped by user.")
    observer.join()
