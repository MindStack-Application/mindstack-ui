import React, { useEffect, useState } from 'react';
import { apiClient } from '../utils/apis';
import { AuthContext } from '../components/AuthContext';
import AddProblemFormStepper from '../components/AddProblemFormStepper';
import UploadProblems from '../components/UploadProblems';
import { Bolt, BookOpen, ExternalLink } from 'lucide-react';

export default function ImportedProblemsPage() {
  const { user } = React.useContext(AuthContext);
  const [problemsByTopic, setProblemsByTopic] = useState<Record<string, any[]>>({});
  const [todays, setTodays] = useState<any[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<any|null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<'all'|'easy'|'medium'|'hard'>('all');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const resp = await apiClient.getProblems(String(user.id), { source: 'import' });
      if (resp.success) {
        const groups: Record<string, any[]> = {};
        resp.data.forEach((p:any) => {
          const t = p.topic || 'general';
          groups[t] = groups[t] || [];
          groups[t].push(p);
        });
        // sort problems within each topic by difficulty then date
        Object.keys(groups).forEach(k => {
          groups[k].sort((a,b) => {
            const diffOrder = { easy: 0, medium: 1, hard: 2 } as Record<string, number>;
            const da = diffOrder[a.difficulty] ?? 1;
            const db = diffOrder[b.difficulty] ?? 1;
            if (da !== db) return da - db;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
        });
        setProblemsByTopic(groups);
      }

      const tResp = await apiClient.getTodaysAssignments(String(user.id));
      if (tResp.success) setTodays(tResp.assignments);
    } catch (err) {
      console.error('Failed to load imported problems', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const difficultyBadge = (d: string) => {
    const cls = 'inline-flex items-center gap-2 px-2 py-0.5 text-xs font-semibold rounded-full';
    if (d === 'easy') return <span className={cls + ' bg-green-50 text-green-700 border border-green-100'}>Easy</span>;
    if (d === 'medium') return <span className={cls + ' bg-amber-50 text-amber-700 border border-amber-100'}>Medium</span>;
    if (d === 'hard') return <span className={cls + ' bg-red-50 text-red-700 border border-red-100'}>Hard</span>;
    return <span className={cls + ' bg-gray-50 text-gray-700 border border-gray-100'}>Unknown</span>;
  };

  const handleAddToTracker = (p: any) => {
    setSelectedProblem(p);
  };

  const filteredProblemsByTopic = Object.keys(problemsByTopic).reduce((acc: Record<string, any[]>, topic) => {
    const list = problemsByTopic[topic].filter(p => difficultyFilter === 'all' ? true : (p.difficulty === difficultyFilter));
    if (list.length) acc[topic] = list;
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Imported Problems</h1>
        <p className="text-sm text-gray-600">Review imported problems, add them to your tracker, or mark today's suggestions complete. Use the filters to quickly find problems by difficulty.</p>
      </div>

      {/* Upload area */}
      <div className="mb-6">
        <UploadProblems onComplete={load} />
      </div>

      {/* Difficulty Filters + Today's suggestions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDifficultyFilter('all')}
            className={`px-3 py-1 rounded-full ${difficultyFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >All</button>
          <button
            onClick={() => setDifficultyFilter('easy')}
            className={`px-3 py-1 rounded-full ${difficultyFilter === 'easy' ? 'bg-green-600 text-white' : 'bg-white text-green-700 border border-green-100'}`}
          >Easy</button>
          <button
            onClick={() => setDifficultyFilter('medium')}
            className={`px-3 py-1 rounded-full ${difficultyFilter === 'medium' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-100'}`}
          >Medium</button>
          <button
            onClick={() => setDifficultyFilter('hard')}
            className={`px-3 py-1 rounded-full ${difficultyFilter === 'hard' ? 'bg-red-600 text-white' : 'bg-white text-red-700 border border-red-100'}`}
          >Hard</button>
        </div>

        <div className="flex-1 md:flex md:justify-end gap-3">
          <div className="hidden md:flex items-center gap-3">
            <div className="text-sm text-gray-500">Today's suggestions</div>
            <div className="flex items-center gap-2">
              {todays.slice(0,2).map(a => (
                <a key={a.id} href={a.problem?.link} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-blue-600 hover:bg-blue-50">
                  {a.problem?.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Topics listing */}
      <div className="space-y-6">
        {loading && <div className="text-sm text-gray-500">Loading imported problems...</div>}
        {Object.keys(filteredProblemsByTopic).length === 0 && !loading && (
          <div className="p-6 bg-white rounded-lg border border-gray-200 text-center text-gray-600">No imported problems match the selected filter.</div>
        )}

        {Object.keys(filteredProblemsByTopic).map(topic => (
          <div key={topic} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{topic}</h3>
              <div className="text-sm text-gray-500">{filteredProblemsByTopic[topic].length} items</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProblemsByTopic[topic].map(p => (
                <div key={p.id} className="p-4 border border-gray-100 rounded-md flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-900">{p.title}</div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                          <span className="inline-flex items-center gap-2 text-xs text-gray-500">{p.platform || 'other'}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-xs text-gray-500">{p.tags?.join ? p.tags.join(', ') : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {difficultyBadge(p.difficulty || 'medium')}
                      </div>
                    </div>

                    {p.codeLink && (
                      <div className="mt-3">
                        <a href={p.codeLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600">
                          <BookOpen size={14} /> View editorial
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 flex flex-col gap-2 w-full md:w-auto items-stretch md:items-end">
                    <div className="flex gap-2">
                      <a href={p.link} target="_blank" rel="noreferrer" className="px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-blue-600 hover:bg-blue-50 inline-flex items-center gap-2"><ExternalLink size={14} /> Open</a>
                      <button onClick={() => handleAddToTracker(p)} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm">Add to tracker</button>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Imported on {new Date(p.date).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal-like area to add selected problem */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-lg">
            <AddProblemFormStepper
              initialData={{
                title: selectedProblem.title || '',
                platform: selectedProblem.platform || '',
                difficulty: selectedProblem.difficulty || 'medium',
                topic: selectedProblem.topic || '',
                subtopic: '',
                outcome: 'solved',
                timeSpent: 30,
                link: selectedProblem.link || '',
                tags: selectedProblem.tags || [],
                approachNotes: '',
                isRevision: true,
                codeLink: selectedProblem.codeLink || ''
              }}
              onCancel={() => setSelectedProblem(null)}
              onSubmit={() => { setSelectedProblem(null); load(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
