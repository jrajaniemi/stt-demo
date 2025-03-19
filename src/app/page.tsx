// src/app/page.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';

export default function Home() {
  // Nykyinen tila äänitykselle, tallennetulle URL:lle ja muille tuloksille.
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  // Uusi tila, jossa pidetään vain viimeisin transkriptio
  const [watchEvent, setWatchEvent] = useState<{ filename: string; content: string } | null>(null);

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

        try {
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

  // SSE-yhteyden luonti, jossa tallennetaan vain uusin tapahtuma
  useEffect(() => {
    const eventSource = new EventSource('/api/watch');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setWatchEvent(data); // Korvataan edellinen arvo uudella
    };
    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`text-white font-bold py-6 px-12 rounded-full text-2xl shadow-lg transition duration-300 ${
          recording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {recording ? 'Stop' : 'Record'}
      </button>

      {audioUrl && (
        <div className="absolute bottom-10 text-center">
          <h2 className="text-lg font-semibold mb-2">Tallennettu äänitiedosto</h2>
          <audio controls src={audioUrl} className="mx-auto"></audio>
        </div>
      )}

      {uploadResult && (
        <div className="absolute top-10 right-10 text-sm bg-white text-black p-4 rounded shadow">
          <h2 className="font-semibold">Lähetyksen tulos</h2>
          <pre>{JSON.stringify(uploadResult, null, 2)}</pre>
        </div>
      )}

      {watchEvent && (
        <div className="absolute top-10 left-10 text-sm bg-white text-black p-4 rounded shadow">
          <h2 className="font-semibold">Transkriptio</h2>
          <pre>{watchEvent.content}</pre>
        </div>
      )}
    </div>
  );
}
