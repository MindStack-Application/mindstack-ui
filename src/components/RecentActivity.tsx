import React from 'react';
import type { Problem, LearningItem, RevisionItem, Roadmap } from '../types';
import { getDifficultyColor, getOutcomeColor } from '../utils/helpers';
import { Search, Download, Plus, FileText, Activity, Clock } from 'lucide-react';

interface RecentActivityProps {
    problems: Problem[];
    learningItems?: LearningItem[];
    revisionItems?: RevisionItem[];
    roadmaps?: Roadmap[];
    onAddProblem: () => void;
}

const RecentActivity: React.FC<RecentActivityProps> = ({ problems, learningItems = [], revisionItems = [], roadmaps = [], onAddProblem }) => {

    function formatDateToCustomString(isoDate: string): string {
        const options: Intl.DateTimeFormatOptions = {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata"
        };

        const raw = new Date(isoDate).toLocaleString("en-GB", options).replace(",", "");

        // Split into parts: "07 Jul 2025 02:11 PM"
        const [day, month, year, time, period] = raw.split(" ");

        return `${day} ${month}, ${year} ${time} ${period}`;
    }

    // Derive recent problem activities from props (latest first, limit 15)
    const recentProblems = [...problems]
        .filter(p => p.date)
        .map(p => ({
            id: p.id,
            type: 'problem' as const,
            title: p.title,
            description: p.topic + (p.subtopic ? ` • ${p.subtopic}` : ''),
            platform: p.platform || 'Unknown',
            difficulty: p.difficulty.toLowerCase(),
            outcome: p.outcome,
            timeSpent: p.timeSpent,
            date: p.date,
        }));

    const recentLearning = learningItems.map(item => ({
        id: item.id,
        type: 'learning' as const,
        title: item.title,
        description: item.category + (item.subtopic ? ` • ${item.subtopic}` : ''),
        platform: item.platform || 'Learning',
        difficulty: (item.difficulty || '').toLowerCase(),
        outcome: item.status,
        timeSpent: item.timeSpent,
        date: item.date,
    }));

    const recentRevisions = revisionItems.map(item => ({
        id: item.id,
        type: 'revision' as const,
        title: item.problem ? item.problem.title : item.learningItem ? item.learningItem.title : 'Revision Item',
        description: item.problem ? item.problem.topic : item.learningItem ? item.learningItem.category : '',
        platform: item.problem ? (item.problem.platform || 'Problem') : 'Revision',
        difficulty: item.problem ? item.problem.difficulty.toLowerCase() : (item.learningItem?.difficulty || '').toLowerCase(),
        outcome: item.isCompleted ? 'completed' : 'scheduled',
        timeSpent: item.problem ? item.problem.timeSpent : (item.learningItem?.timeSpent || 0),
        date: item.originalDate,
    }));

    const recentRoadmaps = roadmaps.map(r => ({
        id: r.id,
        type: 'roadmap' as const,
        title: r.title,
        description: (r.description || '').substring(0, 60),
        platform: 'Roadmap',
        difficulty: 'n/a',
        outcome: r.topics.filter(t => t.isCompleted).length + '/' + r.topics.length + ' topics',
        timeSpent: 0,
        date: r.updatedAt || r.createdAt,
    }));

    const unified = [...recentProblems, ...recentLearning, ...recentRevisions, ...recentRoadmaps]
        .filter(a => a.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);

    return (
        <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex justify-between items-center">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Activity size={20} className="text-gray-600" />
                    Recent Activity
                </h2>
                <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 transition-colors">
                        <Search size={14} />
                        Filter
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 transition-colors">
                        <Download size={14} />
                        Export
                    </button>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {unified.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No recent activity yet.
                    </div>
                )}
                {unified.map(activity => (
                    <div
                        key={`${activity.type}-${activity.id}`}
                        className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <div className="flex-shrink-0 mt-1">
                            <Activity size={20} className="text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-medium capitalize">
                                    {activity.type}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                                    {activity.platform}
                                </span>
                                <span className={`px-2 py-1 rounded text-[10px] font-medium ${getDifficultyColor(activity.difficulty)}`}>
                                    {activity.difficulty || 'n/a'}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[10px] font-medium flex items-center gap-1">
                                    <Clock size={10} />
                                    {activity.timeSpent}m
                                </span>
                                <span className={`px-2 py-1 rounded text-[10px] font-medium ${getOutcomeColor(activity.outcome)}`}>
                                    {activity.outcome.charAt(0).toUpperCase() + activity.outcome.slice(1)}
                                </span>
                            </div>
                            <div className="mt-2 text-gray-500 text-[11px]">
                                {formatDateToCustomString(activity.date)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex gap-2">
                <button
                    onClick={onAddProblem}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                    <Plus size={14} />
                    Add Activity
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 transition-colors">
                    <FileText size={14} />
                    View All
                </button>
            </div>
        </div>
    );
};

export default RecentActivity;
