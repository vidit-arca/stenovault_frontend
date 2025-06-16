'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function File() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processSuccess, setProcessSuccess] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [actions, setActions] = useState('');
  const [translation, setTranslation] = useState('');
  const [language, setLanguage] = useState('en-IN');
  const [transcript, setTranscript] = useState('');
  const intervalIdRef = useRef(null);
  const transcriptRef = useRef(null); // For auto-scroll

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

  // Clean up polling interval
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  // Auto-scroll when transcript updates
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setAlertVisible(true);
        setTimeout(() => setAlertVisible(false), 3000);
      } else {
        alert('Upload failed: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during upload.');
    }
  };

  const startProcessing = async () => {
  setProcessing(true);      // Show loading popup
  setProcessSuccess(false); // Hide success popup

  // Start polling transcript updates too
  if (!intervalIdRef.current) {
    intervalIdRef.current = setInterval(fetchTranscript, 3000);
  }

  try {
    const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/process', { method: 'POST' });
    if (!res.ok) throw new Error('Server error');

    const data = await res.json();
    if (data.success) {
      setProcessSuccess(true); // Show success popup only after full processing
    } else {
      alert('Processing failed: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Error during processing.');
  } finally {
    setProcessing(false); // Stop loading popup
  }
};




    

  const fetchTranscript = async () => {
  try {
    const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/get_transcript',{
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


  const clearFiles = async () => {
  try {
    // Stop polling first
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/clear', { method: 'POST' });
    if (res.ok) {
      alert('Files cleared successfully.');

      // Reset UI and local storage
      setTranscript('');
      setSummary('');
      setKeyPoints('');
      setActions('');
      setTranslation('');
      setFile(null);
      setProcessing(false);

      localStorage.removeItem('transcript');
      localStorage.removeItem('summary');
      localStorage.removeItem('keyPoints');
      localStorage.removeItem('actions');
      localStorage.removeItem('translation');
    } else {
      alert('Failed to clear files.');
    }
  } catch (err) {
    console.error(err);
    alert('Error clearing files.');
  }
};


  const fetchSummary = async () => {
    try {
      const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/get_summary_live',{
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

  const fetchTranslation = async () => {
    try {
      const res = await fetch('https://e4ad-223-181-107-136.ngrok-free.app/get-translation',{
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

  return (
    <div className="flex flex-col items-center py-10 bg-gradient-to-r from-blue-100 to-white min-h-screen">
    <div className="relative w-full">
      <button
        onClick={() => router.push('/Register')}
        className="absolute top-4 right-4 bg-indigo-600 text-white px-4 py-2 text-sm rounded-lg shadow hover:bg-indigo-700 transition"
      >
        Register
      </button>
    </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="w-full max-w-lg mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:underline text-sm flex items-center"
          >
            ← Back
          </button>
        </div>
        <h3 className="text-2xl font-semibold text-center mb-6 text-gray-700">Upload a File</h3>

        {alertVisible && (
          <div className="bg-green-100 text-green-800 p-3 mb-4 rounded-lg shadow-sm">
            ✅ File uploaded successfully!
          </div>
        )}

        <div className="w-full max-w-lg mb-6">
          <label htmlFor="language-select" className="block mb-2 text-gray-700 font-medium">
            🎯 Language
          </label>
          <select
            id="language-select"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              fetch('https://e4ad-223-181-107-136.ngrok-free.app/set_language', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: e.target.value }),
              }).catch((err) => console.error('Language set failed:', err));
            }}
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi (India)</option>
            <option value="ta-IN">Tamil (India)</option>
            <option value="te-IN">Telugu (India)</option>
            <option value="kn-IN">Kannada (India)</option>
          </select>
        </div>

        <form onSubmit={handleUpload} className="mb-6">
          <label className="block mb-2 font-medium text-gray-600">Choose a file</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="border-2 border-gray-300 rounded-lg px-4 py-3 w-full mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Upload
          </button>
        </form>

        <div className="flex flex-col gap-4">
          <button
            onClick={startProcessing}
            className="bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            Start Processing
          </button>
          <button
            onClick={clearFiles}
            className="bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            Clear Files
          </button>
          <button
            onClick={fetchSummary}
            className="bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            Get Summary
          </button>
          <button
            onClick={fetchTranslation}
            className="bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            Get Translation
          </button>
        </div>

        {processing && (
          <div className="p-3 mt-6 rounded-lg shadow-sm bg-blue-100 text-blue-800">
            🔄 Please wait, processing the file and updating transcript...
          </div>
        )}

        {processSuccess && (
          <div className="p-3 mt-6 rounded-lg shadow-sm bg-green-100 text-green-800">
            ✅ Processing complete. Transcript updated.
          </div>
        )}



      </div>

      {/* Transcript */}
      <div className="mt-6 w-full max-w-4xl px-4">
        <h2 className="font-semibold text-gray-700 mb-2">📋 Transcript</h2>
        <div
          ref={transcriptRef}
          className="bg-gray-100 p-3 rounded font-mono h-60 overflow-y-auto whitespace-pre-wrap"
        >
          {transcript || 'Transcript will appear here as it is processed...'}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 w-full max-w-4xl px-4">
        <h2 className="font-semibold text-gray-700 mb-2">📝 Summary</h2>
        <div className="bg-gray-100 p-3 rounded h-40 overflow-y-auto whitespace-pre-wrap">
          {summary}
        </div>
      </div>

      {/* Key Points */}
      <div className="mt-6 w-full max-w-4xl px-4">
        <h2 className="font-semibold text-gray-700 mb-2">📌 Key Points</h2>
        <div className="bg-gray-100 p-3 rounded h-40 overflow-y-auto whitespace-pre-wrap">
          {keyPoints}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 w-full max-w-4xl px-4">
        <h2 className="font-semibold text-gray-700 mb-2">✅ Action Required</h2>
        <div className="bg-gray-100 p-3 rounded h-40 overflow-y-auto whitespace-pre-wrap">
          {actions}
        </div>
      </div>

      {/* Translation */}
      <div className="mt-6 w-full max-w-4xl px-4">
        <h2 className="font-semibold text-gray-700 mb-2">🌐 Translation</h2>
        <div className="bg-gray-100 p-3 rounded h-40 overflow-y-auto whitespace-pre-wrap">
          {translation}
        </div>
      </div>
    </div>
  );
}
