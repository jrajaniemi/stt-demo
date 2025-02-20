'use client';

import React, { useState, useRef } from 'react';

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();
      setRecording(true);

      mediaRecorderRef.current.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));

        // Generoidaan tiedostonimi aikaleimalla
        const timestamp = Date.now();
        const fileName = `audio_${timestamp}.webm`;

        const formData = new FormData();
        formData.append('file', blob, fileName);

        await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        // Tyhjennetään kerätty data
        audioChunksRef.current = [];

        // Sammutetaan stream ja mikrofoni
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
    } catch (error) {
      console.error('Tallennuksen aloituksessa tapahtui virhe:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Mikrofonin tallennus</h1>
      {!recording ? (
        <button onClick={startRecording}>Aloita tallennus</button>
      ) : (
        <button onClick={stopRecording}>Lopeta tallennus</button>
      )}
      {audioUrl && (
        <div style={{ marginTop: '1rem' }}>
          <h2>Tallennettu äänitiedosto</h2>
          <audio controls src={audioUrl}></audio>
        </div>
      )}
    </div>
  );
}
