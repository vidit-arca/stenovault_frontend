'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === 'live') {
      router.push('/Live');
    } else if (value === 'upload') {
      router.push('/File'); // Update this if your actual route differs
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
  <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
    <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Choose an Option</h1>
    <select
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      defaultValue=""
    >
      <option value="" disabled>Select an option</option>
      <option value="live">🔴 Live</option>
      <option value="upload">📁 Upload File</option>
    </select>
  </div>
</div>

  );
}
