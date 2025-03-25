'use client';

import { useState } from 'react';
import ResultCard from '@/components/ResultCard';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [type, setType] = useState('A');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults([]);

    try {
      const res = await fetch(`/api/dig?domain=${domain}&type=${type}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.results);
      }
    } catch (err: any) {
      setError('Something went wrong.');
    }
  };

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-900 text-black dark:text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">🔍 DNSpect</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          required
          className="w-full p-2 rounded border border-gray-300 dark:bg-zinc-800"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 rounded border border-gray-300 dark:bg-zinc-800"
        >
          <option value="A">A</option>
          <option value="AAAA">AAAA</option>
          <option value="MX">MX</option>
          <option value="TXT">TXT</option>
          <option value="NS">NS</option>
          <option value="SOA">SOA</option>
          <option value="CAA">CAA</option>
          <option value="ALL">ALL</option>
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Inspect
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {results.length > 0 && (
        <div className="mt-6 w-full max-w-xl bg-green-100 dark:bg-zinc-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">DNS Results:</h2>
          {results.map((record, index) => (
            <ResultCard
            key={index}
            type={record.type}
            records={record.records}
            error={record.error}
            />
            ))}
        </div>
      )}
    </main>
  );
}
