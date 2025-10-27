import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, Target, RotateCcw, BookOpen, Code, ExternalLink, Network } from 'lucide-react';
import type { Problem, LearningItem, RevisionItem, RevisionAgenda, RevisionStats, GraphNode } from '../types';
import { apiClient } from '../utils/apis';
import { AuthContext } from './AuthContext';
import { useGraphMetrics } from '../hooks/useGraphData';
import {
    createRevisionItemFromProblem,
    createRevisionItemFromLearning,
    getRevisionAgenda,
    getRevisionStats,
    formatDateForDisplay,
    getRelativeDateDescription,
    completeRevisionItem
} from '../utils/revisionUtils';

interface RevisionProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Revision: React.FC<RevisionProps> = ({ activeTab, onTabChange }) => {
    const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [agenda, setAgenda] = useState<RevisionAgenda[]>([]);
    const [completingItems, setCompletingItems] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState<RevisionStats>({
        totalRevisions: 0,
        completedRevisions: 0,
        upcomingRevisions: 0,
        overdueRevisions: 0,
        currentStreak: 0,
    });
    const { user } = React.useContext(AuthContext);

    // MindGraph revision queue
    const {
        revisionQueue,
        loading: graphLoading,
        fetchRevisionQueue,
        getNodePriority,
        formatStrength,
        formatDaysUntilDue,
        getStatusColor,
        getStatusIcon
    } = useGraphMetrics();

    // Load revision items from backend
    const loadRevisionItems = async () => {
        if (!user?.id) return;

        try {
            const response = await apiClient.getRevisionItems(user.id);
            if (response.success) {
                setRevisionItems(response.data);

                // Calculate agenda for the next 30 days
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);

                const agendaData = getRevisionAgenda(
                    response.data,
                    startDate.toISOString().split('T')[0],
                    endDate.toISOString().split('T')[0]
                );

                setAgenda(agendaData);
                setStats(getRevisionStats(response.data));
            }
        } catch (error) {
            console.error('Error loading revision items:', error);
        }
    };

    // Complete a revision item
    const handleCompleteRevision = async (item: RevisionItem) => {
        if (completingItems.has(item.id)) return; // Prevent duplicate requests

        setCompletingItems(prev => new Set(prev).add(item.id));

        try {
            await apiClient.completeRevisionItem(item.id);
            await loadRevisionItems(); // Refresh from backend
        } catch (error) {
            console.error('Error completing revision item:', error);
        } finally {
            setCompletingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
        }
    };

    // Get items for selected date
    const getItemsForSelectedDate = (): RevisionItem[] => {
        return revisionItems.filter(item =>
            item.nextRevisionDate === selectedDate && !item.isCompleted
        );
    };

    // Load MindGraph revision queue
    const loadGraphRevisionQueue = async () => {
        if (!user?.id) return;
        await fetchRevisionQueue({ horizonDays: 14, limit: 100 });
    };

    // Handle MindGraph node review
    const handleNodeReview = async (nodeId: number, rating: number) => {
        try {
            const response = await apiClient.postReview({ nodeId, rating });
            if (response.success) {
                // Refresh the revision queue
                await loadGraphRevisionQueue();
                alert(`Review posted successfully! Rating: ${rating}/5`);
            } else {
                alert('Failed to post review');
            }
        } catch (error) {
            console.error('Error posting review:', error);
            alert('Error posting review');
        }
    };

    useEffect(() => {
        loadRevisionItems();
        loadGraphRevisionQueue();
    }, [user?.id]);

    if (activeTab !== 'revision') {
        return null;
    }

    const todayItems = getItemsForSelectedDate();
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const isPast = new Date(selectedDate) < new Date(new Date().toISOString().split('T')[0]);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Revisions</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalRevisions}</p>
                        </div>
                        <RotateCcw className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.completedRevisions}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Upcoming</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.upcomingRevisions}</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Overdue</p>
                            <p className="text-2xl font-bold text-red-600">{stats.overdueRevisions}</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Date Selector */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div>
                        <label htmlFor="date-selector" className="block text-sm font-medium text-gray-700 mb-1">
                            Select Date
                        </label>
                        <input
                            type="date"
                            id="date-selector"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">
                            {getRelativeDateDescription(selectedDate)} • {formatDateForDisplay(selectedDate)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Today's Agenda */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Target className="h-5 w-5 text-gray-600" />
                        Revision Agenda for {formatDateForDisplay(selectedDate)}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {todayItems.length} items scheduled for revision
                    </p>
                </div>

                <div className="p-6">
                    {todayItems.length === 0 ? (
                        <div className="text-center py-8">
                            <RotateCcw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No revisions scheduled</h3>
                            <p className="text-gray-600">
                                {isPast ? 'No revisions were scheduled for this date.' : 'No revisions scheduled for this date.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {todayItems.map((item) => {
                                const isProblem = item.itemType === 'problem';
                                const problemData = isProblem ? item.problem : null;
                                const learningData = !isProblem ? item.learningItem : null;

                                return (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-medium text-gray-900">
                                                        {isProblem ? problemData?.title : learningData?.title}
                                                    </h3>
                                                    {isProblem && problemData?.difficulty && (
                                                        <span className={`px-2 py-1 text-xs font-medium rounded ${problemData.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                                            problemData.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {problemData.difficulty}
                                                        </span>
                                                    )}
                                                    {!isProblem && learningData?.difficulty && (
                                                        <span className={`px-2 py-1 text-xs font-medium rounded ${learningData.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                                            learningData.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {learningData.difficulty}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                    {isProblem ? (
                                                        <>
                                                            <span>{problemData?.platform}</span>
                                                            <span>•</span>
                                                            <span>{problemData?.topic}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="capitalize">{learningData?.type}</span>
                                                            <span>•</span>
                                                            <span>{learningData?.category}</span>
                                                            {learningData?.platform && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{learningData.platform}</span>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    <span>•</span>
                                                    <span>Cycle {item.revisionCycle}</span>
                                                </div>

                                                {(isProblem ? problemData?.approachNotes : learningData?.notes) && (
                                                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                                        {isProblem ? problemData?.approachNotes : learningData?.notes}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 ml-4">
                                                {(isProblem ? problemData?.link : learningData?.link) && (
                                                    <a
                                                        href={isProblem ? problemData?.link : learningData?.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        {isProblem ? 'View Problem' : 'View Resource'}
                                                    </a>
                                                )}

                                                <button
                                                    onClick={() => handleCompleteRevision(item)}
                                                    disabled={completingItems.has(item.id)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 border border-green-600 rounded-lg hover:from-green-700 hover:to-green-800 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-green-400 disabled:to-green-500"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    {completingItems.has(item.id) ? 'Completing...' : 'Mark Complete'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Revisions */}
            {agenda.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-gray-600" />
                            Upcoming Revisions
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Your revision schedule for the next 30 days
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="space-y-3">
                            {agenda.slice(0, 7).map((day) => (
                                <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatDateForDisplay(day.date)}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {getRelativeDateDescription(day.date)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                            {day.totalItems} items
                                        </span>
                                        {day.date === selectedDate && (
                                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MindGraph Revision Queue */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Network className="h-5 w-5 text-gray-600" />
                        MindGraph Revision Queue
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Knowledge nodes that need review based on spaced repetition
                    </p>
                </div>

                <div className="p-6">
                    {graphLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading revision queue...</p>
                        </div>
                    ) : revisionQueue.length === 0 ? (
                        <div className="text-center py-8">
                            <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No nodes need review</h3>
                            <p className="text-gray-600">
                                All your knowledge nodes are up to date!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {revisionQueue
                                .sort((a, b) => getNodePriority(b) - getNodePriority(a))
                                .slice(0, 10)
                                .map((node) => {
                                    const status = node.metric?.status || 'ok';
                                    const strength = node.metric?.strength || 0.5;
                                    const dueDate = node.metric?.dueDate ? new Date(node.metric.dueDate) : null;

                                    return (
                                        <div key={node.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-medium text-gray-900">{node.title}</h3>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                                                            {status} {getStatusIcon(status)}
                                                        </span>
                                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                            {node.type}
                                                        </span>
                                                    </div>

                                                    {node.description && (
                                                        <p className="text-sm text-gray-600 mb-2">{node.description}</p>
                                                    )}

                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span>Strength: <span className="font-medium">{formatStrength(strength)}</span></span>
                                                        {dueDate && (
                                                            <span>Due: <span className="font-medium">{formatDaysUntilDue(dueDate)}</span></span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-4">
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map((rating) => (
                                                            <button
                                                                key={rating}
                                                                onClick={() => handleNodeReview(node.id, rating)}
                                                                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                                            >
                                                                {rating}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => onTabChange('mindgraph')}
                                                        className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                                    >
                                                        View in Graph
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Revision;
