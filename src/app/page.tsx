'use client';

import React, { useState, useRef } from 'react';

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
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

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));

        // Tiedostonimi aikaleimalla
        const timestamp = Date.now();
        const fileName = `audio_${timestamp}.webm`;

        const formData = new FormData();
        formData.append('file', blob, fileName);

        console.log('Lähetettävä FormData:', formData);

        try {
          // Lähetetään POST-pyyntö palvelimelle
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          setUploadResult(result);
        } catch (error) {
          console.error('Virhe lähetyksessä:', error);
        }

        // Tyhjennetään data ja pysäytetään mikrofoni
        audioChunksRef.current = [];
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
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
      {uploadResult && (
        <div style={{ marginTop: '1rem' }}>
          <h2>Lähetyksen tulos</h2>
          <pre>{JSON.stringify(uploadResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
