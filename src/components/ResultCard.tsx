'use client';

import React from 'react';

interface ResultCardProps {
  type: string;
  records?: any;
  error?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ type, records, error }) => {
  return (
    <div className="mb-4">
      <h3 className="font-bold mb-1">{type} Records:</h3>
      <ul className="list-disc list-inside">
        {error ? (
          <li className="text-sm italic text-red-500">{error}</li>
        ) : Array.isArray(records) && records.length > 0 ? (
          records.map((r: any, i: number) => (
            <li key={i} className="text-sm break-words">
              {typeof r === 'string' ? r : JSON.stringify(r, null, 2)}
            </li>
          ))
        ) : typeof records === 'object' && records !== null ? (
          Object.entries(records).map(([key, value], i) => (
            <li key={i} className="text-sm break-words">
              <strong>{key}:</strong> {String(value)}
            </li>
          ))
        ) : (
          <li className="text-sm italic text-gray-500">No records found or unsupported</li>
        )}
      </ul>
    </div>
  );
};

export default ResultCard;
