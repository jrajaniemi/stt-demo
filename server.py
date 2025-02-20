#!/usr/bin/env python3
from flask import Flask, request, jsonify
import os
import time

app = Flask(__name__)

UPLOAD_DIR = os.path.join(os.getcwd(), 'uploads')
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@app.route('/process', methods=['POST'])
def process_file():
    print("Uusi pyyntö saapui")
    data = request.get_json()

    if not data or 'fileName' not in data:
        print("Tiedoston nimi puuttuu")
        return jsonify({"error": "Tiedoston nimeä ei annettu"}), 400

    file_name = data['fileName']
    file_path = os.path.join(UPLOAD_DIR, file_name)

    print(f"Tiedostonimi: {file_name}")
    print(f"Tiedostopolku: {file_path}")

    if not os.path.exists(file_path):
        print("Tiedostoa ei löytynyt polusta")
        return jsonify({"error": "Tiedostoa ei löytynyt"}), 404

    try:
        file_size = os.path.getsize(file_path)
    except Exception as e:
        return jsonify({"error": "Tiedoston koon määrittäminen epäonnistui", "details": str(e)}), 500

    timestamp = int(time.time() * 1000)
    result = {
        "timestamp": timestamp,
        "file": file_name,
        "size": file_size
    }

    print(f"Tulos: {result}")
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5051)
