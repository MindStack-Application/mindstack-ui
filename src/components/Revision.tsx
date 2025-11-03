import React, { useState, useEffect, useRef } from 'react';
import { Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, Target, RotateCcw, BookOpen, Code, ExternalLink, Network, Star, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Problem, LearningItem, RevisionItem, RevisionAgenda, RevisionStats } from '../types';
import type { GraphNode } from '../types/graph';
import { apiClient } from '../utils/apis';
import { AuthContext } from './AuthContext';
import { useGraphMetrics } from '../hooks/useGraphData';
import { useNotification } from './NotificationContext';
import { handleApiError } from '../utils/notificationService';
import {
    createRevisionItemFromProblem,
    createRevisionItemFromLearning,
    getRevisionAgenda,
    getRevisionStats,
    formatDateForDisplay,
    getRelativeDateDescription,
    completeRevisionItem
} from '../utils/revisionUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QK } from '../state/queryKeys';
import { format } from 'date-fns';

interface RevisionProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Revision: React.FC<RevisionProps> = ({ activeTab, onTabChange }) => {
    const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [agenda, setAgenda] = useState<RevisionAgenda[]>([]);
    const [completingItems, setCompletingItems] = useState<Set<string>>(new Set());
    const [loadingRevisionItems, setLoadingRevisionItems] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedRevisionItem, setSelectedRevisionItem] = useState<RevisionItem | null>(null);
    const [stats, setStats] = useState<RevisionStats>({
        totalRevisions: 0,
        completedRevisions: 0,
        upcomingRevisions: 0,
        overdueRevisions: 0,
        currentStreak: 0,
    });
    const { user } = React.useContext(AuthContext);
    const { showSuccess, showError, showWarning } = useNotification();
    const mountedRef = useRef(true);

    // MindGraph revision queue
    const {
        revisionQueue,
        loading: graphLoading,
        fetchRevisionQueue,
        getNodePriority,
        getStrengthContextual,
        formatDaysUntilDue,
        getStatusColor,
        getStatusIcon
    } = useGraphMetrics(user?.id);

    // Load revision items from backend
    const loadRevisionItems = async () => {
        if (!user?.id) return;

        try {
            setLoadingRevisionItems(true);
            const response = await apiClient.getRevisionItems(user.id);
            if (response.success) {
                setRevisionItems(response.data);

                // Calculate agenda for the next 90 days
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 90);

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
            handleApiError(error, 'Loading', 'revision items');
        } finally {
            setLoadingRevisionItems(false);
        }
    };

    // Open rating modal for a revision item
    const handleMarkCompleted = (item: RevisionItem) => {
        setSelectedRevisionItem(item);
        setShowRatingModal(true);
    };

    const qc = useQueryClient();
    const completionMutation = useMutation({
        mutationFn: (data: { id: number, rating: 1 | 2 | 3 | 4 | 5 }) => apiClient.completeRevisionItem(data.id.toString(), { rating: data.rating }),
        onSuccess: (updated) => {
            const today = format(new Date(), 'yyyy-MM-dd');
            // invalidate minimal sets
            qc.invalidateQueries({ queryKey: QK.TODAY() });
            qc.invalidateQueries({ queryKey: QK.REVISION_LIST() });
            // if your calendar uses a known window, invalidate it too
            // e.g., current month:
            const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');
            const monthEnd = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');
            qc.invalidateQueries({ queryKey: QK.CAL_RANGE(monthStart, monthEnd) });

            // Also refresh local state
            loadRevisionItems();

            if (mountedRef.current) {
                setShowRatingModal(false);
                setSelectedRevisionItem(null);
                showSuccess(
                    'Revision Completed',
                    `Successfully completed revision with ${updated.rating || 'your'} star${updated.rating > 1 ? 's' : ''}!`
                );
            }
        },
        onError: (error) => {
            console.error('Error completing revision item:', error);
            if (mountedRef.current) {
                handleApiError(error, 'Completing', 'revision item');
            }
        },
        onSettled: () => {
            if (mountedRef.current && selectedRevisionItem) {
                setCompletingItems(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(selectedRevisionItem.id);
                    return newSet;
                });
            }
        }
    });

    // Complete a revision item with performance rating
    const handleCompleteRevision = async (performanceRating: number) => {
        if (!selectedRevisionItem || completingItems.has(selectedRevisionItem.id)) return;

        // Validate performance rating
        if (performanceRating < 1 || performanceRating > 5) {
            showError('Invalid Rating', 'Performance rating must be between 1 and 5.');
            return;
        }

        setCompletingItems(prev => new Set(prev).add(selectedRevisionItem.id));
        completionMutation.mutate({ id: parseInt(selectedRevisionItem.id), rating: performanceRating as 1 | 2 | 3 | 4 | 5 });
    };

    // Bulk complete revision items
    const handleBulkComplete = async (items: { item: RevisionItem, rating: number }[]) => {
        if (!user?.id) return;

        try {
            const completions = items.map(({ item, rating }) => ({
                revisionItemId: item.id,
                performanceRating: rating
            }));

            await apiClient.bulkCompleteRevisionItems(user.id, { completions });
            await loadRevisionItems(); // Refresh from backend
        } catch (error) {
            console.error('Error bulk completing revision items:', error);
            handleApiError(error, 'Bulk completing', 'revision items');
        }
    };

    // Get items for selected date with better date comparison
    const getItemsForSelectedDate = (): RevisionItem[] => {
        return revisionItems.filter(item => {
            // Normalize dates to avoid timezone issues
            const itemDate = new Date(item.nextRevisionDate).toISOString().split('T')[0];
            return itemDate === selectedDate && !item.isCompleted;
        });
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
                showSuccess(
                    'Review Posted',
                    `Successfully posted ${rating}/5 star review!`
                );
            } else {
                showError('Review Failed', 'Failed to post review. Please try again.');
            }
        } catch (error) {
            console.error('Error posting review:', error);
            handleApiError(error, 'Posting', 'review');
        }
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const currentDate = new Date(selectedDate);
        const newDate = new Date(currentDate);

        if (direction === 'prev') {
            newDate.setDate(currentDate.getDate() - 1);
        } else {
            newDate.setDate(currentDate.getDate() + 1);
        }

        const newDateString = newDate.toISOString().split('T')[0];
        const minDate = '2020-01-01';
        const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        if (newDateString >= minDate && newDateString <= maxDate) {
            setSelectedDate(newDateString);
        }
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const isMinDate = selectedDate <= '2020-01-01';
    const isMaxDate = selectedDate >= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dateInputRef = useRef<HTMLInputElement>(null);

    const openDatePicker = () => {
        if (dateInputRef.current) {
            dateInputRef.current.showPicker?.() || dateInputRef.current.click();
        }
    };

    useEffect(() => {
        loadRevisionItems();
        loadGraphRevisionQueue();

        // Cleanup function
        return () => {
            mountedRef.current = false;
        };
    }, [user?.id]);

    // Set mounted flag on mount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    if (activeTab !== 'revision') {
        return null;
    }

    const todayItems = getItemsForSelectedDate();
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;
    const isPast = selectedDate < today;

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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-700">Revision Date</h3>
                        </div>

                        <button
                            onClick={goToToday}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Jump to Today
                        </button>
                    </div>

                    {/* Main Date Display */}
                    <div className="flex items-center justify-center mb-4">
                        <button
                            onClick={() => navigateDate('prev')}
                            disabled={isMinDate}
                            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-white/50 rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Previous day"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <div className="flex-1 text-center px-8">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                                {formatDateForDisplay(selectedDate)}
                            </div>
                            <div className="text-sm font-medium text-blue-800">
                                {getRelativeDateDescription(selectedDate)}
                            </div>
                        </div>

                        <button
                            onClick={() => navigateDate('next')}
                            disabled={isMaxDate}
                            className="p-3 text-gray-400 hover:text-blue-600 hover:bg-white/50 rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Next day"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Calendar picker button */}
                    <div className="text-center relative">
                        <button
                            onClick={openDatePicker}
                            className="px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/50 rounded-lg text-xs font-medium text-gray-600 hover:text-blue-700 hover:bg-white/80 hover:border-blue-200 cursor-pointer transition-all duration-200 flex items-center gap-2"
                        >
                            <Calendar className="h-3 w-3" />
                            Pick different date
                        </button>
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                const newDate = e.target.value;
                                if (newDate) {
                                    setSelectedDate(newDate);
                                }
                            }}
                            min="2020-01-01"
                            max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            className="absolute inset-0 opacity-0 pointer-events-none"
                        />
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
                    {loadingRevisionItems ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading revision items...</p>
                        </div>
                    ) : todayItems.length === 0 ? (
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
                                                {/* Linked Nodes Display */}
                                                {item.linkedNodes && item.linkedNodes.length > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                                        <Network className="h-3 w-3" />
                                                        <span>{item.linkedNodes.length} node{item.linkedNodes.length > 1 ? 's' : ''}</span>
                                                    </div>
                                                )}

                                                {(isProblem ? problemData?.link : learningData?.link) && (
                                                    <a
                                                        href={isProblem ? problemData?.link : learningData?.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        {isProblem ? 'View Problem' : 'View Resource'}
                                                    </a>
                                                )}

                                                {/* Mark Completed Button */}
                                                <button
                                                    onClick={() => handleMarkCompleted(item)}
                                                    disabled={completingItems.has(item.id)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 hover:border-green-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                    {completingItems.has(item.id) ? 'Completing...' : 'Mark Completed'}
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
                            Your revision schedule for the next 90 days
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
                                                        {(() => {
                                                            const strengthContext = getStrengthContextual(strength, node);
                                                            return (
                                                                <span>Strength: <span className={`font-medium ${strengthContext.colorClass}`}>{strengthContext.display}</span></span>
                                                            );
                                                        })()}
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

            {/* Rating Modal */}
            {showRatingModal && selectedRevisionItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Rate Your Performance
                        </h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                                How well did you understand/complete this item?
                            </p>
                            <p className="font-medium text-gray-900">
                                {selectedRevisionItem.itemType === 'problem'
                                    ? selectedRevisionItem.problem?.title
                                    : selectedRevisionItem.learningItem?.title}
                            </p>
                        </div>

                        <div className="grid grid-cols-5 gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                    key={rating}
                                    onClick={() => handleCompleteRevision(rating)}
                                    disabled={completingItems.has(selectedRevisionItem.id)}
                                    className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <div className="flex mb-1">
                                        {[...Array(rating)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                        ))}
                                        {[...Array(5 - rating)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 text-gray-300" />
                                        ))}
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">
                                        {rating === 1 ? 'Poor' :
                                            rating === 2 ? 'Below Avg' :
                                                rating === 3 ? 'Average' :
                                                    rating === 4 ? 'Good' : 'Excellent'}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRatingModal(false);
                                    setSelectedRevisionItem(null);
                                }}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Revision;
