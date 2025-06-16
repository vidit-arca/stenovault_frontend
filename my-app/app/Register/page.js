'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Recorder from 'recorder-js';

export default function Register() {
  const [status, setStatus] = useState('Waiting...');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [transcript, setTranscript] = useState('');
  const [microphones, setMicrophones] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [users, setUsers] = useState([]);
  const [usersVisible, setUsersVisible] = useState(false);



  const recorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);
  const lastBlobRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    recorderRef.current = new Recorder(audioContextRef.current);

    // Load microphones on mount
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const mics = devices.filter(device => device.kind === 'audioinput');
      setMicrophones(mics);
      if (mics[0]) setSelectedMicId(mics[0].deviceId); // default select first mic
    });
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMicId ? { exact: selectedMicId } : undefined }
      });

      await recorderRef.current.init(stream);
      streamRef.current = stream;
      await recorderRef.current.start();
      setStatus('🎙️ Recording...');
    } catch (err) {
      console.error(err);
      setStatus('❌ Microphone error');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recorderRef.current) return;
      setStatus('⏹️ Stopping...');

      const { blob } = await recorderRef.current.stop();
      streamRef.current.getTracks().forEach((track) => track.stop());

      if (blob.size === 0) {
        setStatus('❌ Empty audio blob (no sound captured)');
        return;
      }

      lastBlobRef.current = blob;

      const formData = new FormData();
      formData.append('audio', blob, 'newuser.wav');

      const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/upload-User', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setStatus(data.message || '✅ Uploaded');
    } catch (err) {
      console.error(err);
      setStatus('❌ Upload error');
    }
  };

  const processRecording = async () => {
    try {
      const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/transcribeUser',{
      method:"GET",
      headers: {
        "ngrok-skip-browser-warning": "true",  // ✅ correct spelling
        "Content-Type": "application/json"}
      });
      const data = await res.json();

      if (data.success) {
        setName(data.name);
        setPlace(data.place);
        setTranscript(data.text);
      } else {
        setTranscript(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      setTranscript(`❌ Network or server error`);
    }
  };

  const verify = async () => {
  alert(`✅ Verified!\nName: ${name}`);

  try {
    const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/register-speaker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (data.success) {
      setStatus('✅ Speaker registered!');
      setName(''); // Clear the input field
    } else {
      setStatus(`❌ ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    setStatus('❌ Speaker registration failed');
  }
};


  const fetchUsers = async () => {
  if (!usersVisible) {
    try {
      const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/list-users',{
      method:"GET",
      headers: {
        "ngrok-skip-browser-warning": "true",  // ✅ correct spelling
        "Content-Type": "application/json"}
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
      setUsersVisible(true);
    } catch (err) {
      console.error(err);
      setStatus('❌ Failed to fetch users');
    }
  } else {
    // If visible, hide the list on toggle
    setUsersVisible(false);
  }
};
useEffect(() => {
    const clearBackend = async () => {
      try {
        const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/clear_live', {
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


  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
      


          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline text-sm flex items-center"
          >
            ← Back
          </button>
        
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Register New Speaker</h2>

      <p className="text-gray-600 mb-6">
        Please say: <br />
        <span className="italic font-medium">
          &quot;Hi, my name is [Your Name]. The curious engineer quickly evaluated the results of every major experiment, balancing risk, precision, and time. From morning till night, she spoke with clarity, adjusting tone, pitch, and pace to match every situation&quot;
        </span>
      </p>


      <div className="mb-4">
        <label className="block text-gray-700 mb-1">🎙️ Select Microphone</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedMicId}
          onChange={(e) => setSelectedMicId(e.target.value)}
        >
          {microphones.map((mic) => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label || `Microphone ${mic.deviceId}`}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={startRecording}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition duration-200"
        >
          ▶️ Start
        </button>
        <button
          onClick={stopRecording}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition duration-200"
        >
          ⏹️ Stop & Upload
        </button>
        <button
          onClick={processRecording}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition duration-200"
        >
          🎙️ Transcribe
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-700">
        <strong>Status:</strong> {status}
      </p>

      <form className="space-y-4 mb-6">
        <div>
          <label className="block text-gray-700 mb-1">Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={verify}
          className="bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded transition duration-200"
        >
          ✅ Verify
        </button>
      </form>
      <div className="mb-4">
      <button
      onClick={fetchUsers}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded transition duration-200"
    >
      {usersVisible ? '❌ Close Users' : '👤 Show Users'}
    </button>

      {usersVisible && users.length > 0 && (
      <ul className="mt-2 max-h-40 overflow-y-auto border border-gray-300 rounded p-2 bg-gray-50">
        {users.map((user, i) => (
          <li key={i} className="text-gray-800">
            {user}
          </li>
        ))}
      </ul>
    )}

    </div>
    </div>
  );
}
