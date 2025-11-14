import React, { useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import { apiClient } from '../utils/apis';

export default function UploadProblems() {
  const { user } = React.useContext(AuthContext);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created?: number; errors?: any[] } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setLoading(true);
    try {
      const res = await apiClient.uploadProblems(String(user.id), file);
      setResult(res);
    } catch (err) {
      console.error('Upload failed', err);
      setResult({ created: 0, errors: [{ error: (err as Error).message }] });
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Import Problems</h3>
      <p className="text-sm text-gray-600 mb-4">Upload an Excel or CSV file with columns: url, tag/topic, editorial/solution</p>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
      {loading && <div className="mt-3 text-sm">Importing…</div>}
      {result && (
        <div className="mt-3">
          <div>Imported: {result.created}</div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-600">Errors: {JSON.stringify(result.errors)}</div>
          )}
        </div>
      )}
    </div>
  );
}
