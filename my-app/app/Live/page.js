'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Recorder from 'recorder-js';
import '../globals.css'


export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [actions, setActions] = useState('');
  const [translation, setTranslation] = useState('');
  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const chunkCounter = useRef(1);
  const intervalIdRef = useRef(null);
  const router = useRouter();
  const [language, setLanguage] = useState('en-IN');

  const [micDevices, setMicDevices] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState('');

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    recorderRef.current = new Recorder(audioContextRef.current);

    const fetchDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((device) => device.kind === 'audioinput');
        setMicDevices(mics);
        if (mics.length > 0) setSelectedMicId(mics[0].deviceId);
      } catch (err) {
        console.error('Failed to get microphones', err);
      }
    };

    fetchDevices();

    const interval = setInterval(fetchTranscript, 3000);
    fetchTranscript();

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      clearInterval(interval);
    };
  }, []);

  const fetchTranscript = async () => {
  try {
    const res = await fetch('https://66eb-223-181-107-136.ngrok-free.app/get_transcript',{
      method:"GET",
      headers: {
        "ngrok-skip-browser-warning": "true",  // ✅ correct spelling
        "Content-Type": "application/json"}
      });
    const data = await res.json();
    setTranscript(data.transcript || '');        // original speaker-diarized transcript
    setTranslation(data.translation || '');      // speaker-diarized translation
  } catch (err) {
    console.error('Transcript fetch error', err);
  }
};

  const getSummary = async () => {
    try {
      const res = await fetch('https://66eb-223-181-107-136.ngrok-free.app/get_summary_live',{
      method:"GET",
      headers: {
        "ngrok-skip-browser-warning": "true",  // ✅ correct spelling
        "Content-Type": "application/json"}
      });
      const data = await res.json();
      setSummary(data.summary || 'No summary available.');
      setKeyPoints(data.key_points || 'No key points.');
      setActions(data.actions || 'No action items.');
    } catch (err) {
      console.error('Summary fetch error', err);
    }
  };

  const getTranslation = async () => {
    try {
      const res = await fetch('https://66eb-223-181-107-136.ngrok-free.app/get-translation',{
      method:"GET",
      headers: {
        "ngrok-skip-browser-warning": "true",  // ✅ correct spelling
        "Content-Type": "application/json"}
      });
      const data = await res.json();
      setTranslation(data.translation || 'No translation available.');
    } catch (err) {
      console.error('Translation fetch error', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMicId ? { exact: selectedMicId } : undefined,
        },
      });
      await recorderRef.current.init(stream);
      recorderRef.current.start();
      setIsRecording(true);

      intervalIdRef.current = setInterval(async () => {
        const { blob } = await recorderRef.current.stop();
        const filename = `chunk_${chunkCounter.current}.wav`;
        await uploadChunk(blob, filename);
        chunkCounter.current += 1;
        recorderRef.current.start();
      }, 6000);
    } catch (err) {
      console.error('Error accessing microphone', err);
    }
  };

  const stopRecording = async () => {
    clearInterval(intervalIdRef.current);
    if (recorderRef.current) {
      const { blob } = await recorderRef.current.stop();
      const filename = `chunk_${chunkCounter.current}.wav`;
      await uploadChunk(blob, filename);
    }
    setIsRecording(false);
    chunkCounter.current = 1;
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const uploadChunk = async (blob, filename) => {
    const formData = new FormData();
    formData.append('audio', blob, filename);

    try {
      const res = await fetch('https://66eb-223-181-107-136.ngrok-free.app/uploadchunk', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) console.error(`Upload failed for ${filename}`);
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  useEffect(() => {
    const clearBackend = async () => {
      try {
        const res = await fetch('https://66eb-223-181-107-136.ngrok-free.app/clear_live', {
          method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to clear');
        console.log('✅ Backend cleared for live session');
      } catch (err) {
        console.error('❌ Clear live error:', err);
      }
    };

    clearBackend();
  }, []);

  const clearData = async () => {
    try {
      const res = await fetch('https://66eb-223-181-107-136.ngrok-free.app/clear_live', {
        method: 'POST',
      });
      const data = await res.json();
      alert(data.status);

      setTranscript('');
      setSummary('');
      setKeyPoints('');
      setActions('');
      setTranslation('');
      router.refresh();
    } catch (err) {
      console.error('Clear data error:', err);
      alert('❌ Failed to clear data.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-blue-100 p-6">
      <div className="w-full overflow-hidden bg-yellow-100 text-yellow-800 py-2 mb-4">
        <div className="animate-marquee whitespace-nowrap font-semibold text-center">
          ⚠️ Please register your voice before starting the recording Click the Register button below
        </div>
      </div>


      <div className="flex justify-end mb-4">
        <button
          onClick={() => router.push('/Register')}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
        >
          Register
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg space-y-6">
        <div className="w-full max-w-lg mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline text-sm flex items-center"
          >
            ← Back
          </button>
        </div>
        <h1 className="text-2xl font-bold text-center mb-4">🎤 Live Speaker Diarization & Transcription</h1>

        {/* Language and Mic Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="language-select" className="block mb-2 text-gray-700 font-medium">
              🎯 Language
            </label>
            <select
              id="language-select"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                fetch('https://66eb-223-181-107-136.ngrok-free.app/set_language', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ language: e.target.value }),
                }).catch((err) => console.error("Language set failed:", err));
              }}
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (India)</option>
              <option value="ta-IN">Tamil (India)</option>
              <option value="te-IN">Telugu (India)</option>
              <option value="kn-IN">Kannada (India)</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-gray-700 font-medium">🎙️ Microphone</label>
            <select
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={selectedMicId}
              onChange={(e) => setSelectedMicId(e.target.value)}
            >
              {micDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <button
            onClick={toggleRecording}
            className={`px-6 py-2 rounded-lg shadow text-white ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          <button
            onClick={clearData}
            className="px-6 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600"
          >
            Clear Data
          </button>
          <button
            onClick={getSummary}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            Get Summary
          </button>
          <button
            onClick={getTranslation}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700"
          >
            Get Translation
          </button>
        </div>

        {/* Transcript */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-2">📋 Transcript</h2>
          <div className="bg-gray-100 p-3 rounded font-mono h-60 overflow-y-auto whitespace-pre-wrap">
            {transcript}
          </div>
        </div>

        {/* Summary */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-2">📝 Summary</h2>
          <div className="bg-gray-100 p-3 rounded h-40 overflow-y-auto whitespace-pre-wrap">{summary}</div>
        </div>

        {/* Key Points */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-2">📌 Key Points</h2>
          <div className="bg-gray-100 p-3 rounded h-40 overflow-y-auto whitespace-pre-wrap">{keyPoints}</div>
        </div>

        {/* Actions */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-2">✅ Action Required</h2>
          <div className="bg-gray-100 p-3 rounded h-40 overflow-y-auto whitespace-pre-wrap">{actions}</div>
        </div>

        {/* Translation */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-2">🌐 Translation</h2>
          <div className="bg-gray-100 p-3 rounded h-40 overflow-y-auto whitespace-pre-wrap">{translation}</div>
        </div>
      </div>
    </main>
  );
}
