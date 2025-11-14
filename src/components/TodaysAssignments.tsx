import React, { useEffect, useState } from 'react';
import { apiClient } from '../utils/apis';
import { AuthContext } from './AuthContext';

export default function TodaysAssignments() {
  const { user } = React.useContext(AuthContext);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await apiClient.getTodaysAssignments(String(user.id));
      if (res.success) setAssignments(res.assignments);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const complete = async (id: number) => {
    try {
      await apiClient.completeAssignment(id);
      await load();
    } catch (err) {
      console.error('Failed to complete', err);
    }
  };

  if (loading) return <div className="p-4 bg-white rounded-lg shadow-sm">Loading…</div>;
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-3">Today's Problems</h3>
      {assignments.length === 0 && <div className="text-sm text-gray-600">No assignments for today.</div>}
      <div className="space-y-3">
        {assignments.map((a:any) => (
          <div key={a.id} className="p-3 border border-gray-100 rounded-md flex justify-between items-center">
            <div>
              <div className="font-medium">{a.problem?.title || 'Untitled'}</div>
              <a href={a.problem?.link} className="text-sm text-blue-600" target="_blank" rel="noreferrer">Open</a>
            </div>
            <div className="flex items-center gap-2">
              {a.status !== 'completed' ? (
                <button onClick={() => complete(a.id)} className="px-3 py-1 bg-green-600 text-white rounded">Complete</button>
              ) : <div className="text-sm text-gray-500">Completed</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
