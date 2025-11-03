import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Play, Pause, CheckCircle, Clock, Target, TrendingUp, Link, AlertCircle, ExternalLink } from 'lucide-react';
import type { LearningItem } from '../types';
import { AuthContext } from './AuthContext';
import { apiClient } from '../utils/apis';
import LinkToGraphSidePanel from './LinkToGraphSidePanel';
import AddLearningFormStepper from './AddLearningFormStepper';

interface LearningProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Learning: React.FC<LearningProps> = ({ activeTab, onTabChange }) => {
    const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [linkStatuses, setLinkStatuses] = useState<Record<number, boolean>>({});
    const [linkSidePanel, setLinkSidePanel] = useState<{
        isOpen: boolean;
        itemId: number;
        itemTitle: string;
    }>({
        isOpen: false,
        itemId: 0,
        itemTitle: ''
    });
    const [formData, setFormData] = useState<Partial<LearningItem>>({
        title: '',
        type: 'course',
        category: '',
        subtopic: '',
        timeSpent: 0,
        progress: 0,
        status: 'not-started',
        link: '',
        tags: '',
        notes: '',
        resourceLink: '',
        isRevision: true,
        difficulty: 'beginner',
        platform: '',
    });
    const { user } = React.useContext(AuthContext);

    const handleAddLearning = async (formData: any) => {
        // The AddLearningForm handles the API call internally
        // Just refresh the learning items list and link statuses
        await loadLearningItems();
        setShowAddForm(false);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            type: 'course',
            category: '',
            subtopic: '',
            timeSpent: 0,
            progress: 0,
            status: 'not-started',
            link: '',
            tags: '',
            notes: '',
            resourceLink: '',
            isRevision: true,
            difficulty: 'beginner',
            platform: '',
        });
    };

    const handleOpenLinkPanel = (itemId: number, itemTitle: string) => {
        setLinkSidePanel({
            isOpen: true,
            itemId: itemId,
            itemTitle: itemTitle
        });
    };

    const handleCloseLinkPanel = () => {
        setLinkSidePanel({
            isOpen: false,
            itemId: 0,
            itemTitle: ''
        });
    };

    const handleLinkSuccess = async () => {
        // Refresh the learning items list to show updated link status
        await loadLearningItems();
    };

    const handleShowAddForm = () => {
        setShowAddForm(true);
    };

    const loadLearningItems = async () => {
        if (!user?.id) return;

        try {
            const response = await apiClient.getLearningItems(user.id);
            if (response.success) {
                setLearningItems(response.data);
                // Load link statuses for all items
                loadLinkStatuses(response.data);
            }
        } catch (error) {
            console.error('Error loading learning items:', error);
        }
    };

    const loadLinkStatuses = async (items: LearningItem[]) => {
        try {
            const statuses: Record<number, boolean> = {};

            for (const item of items) {
                try {
                    const response = await apiClient.getItemLinks('learning', item.id);
                    statuses[item.id] = response.success && response.data && response.data.length > 0;
                } catch (error) {
                    statuses[item.id] = false;
                }
            }

            setLinkStatuses(statuses);
        } catch (error) {
            console.error('Error loading link statuses:', error);
        }
    };

    const updateProgress = async (id: string, progress: number) => {
        try {
            const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started';
            await apiClient.updateLearningItem(id, { progress, status });
            loadLearningItems(); // Refresh from backend
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const updateStatus = async (id: string, status: LearningItem['status']) => {
        try {
            await apiClient.updateLearningItem(id, { status });
            loadLearningItems(); // Refresh from backend
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusColor = (status: LearningItem['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'paused': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type: LearningItem['type']) => {
        switch (type) {
            case 'course': return '🎓';
            case 'book': return '📚';
            case 'tutorial': return '📖';
            case 'article': return '📄';
            case 'video': return '🎥';
            case 'podcast': return '🎧';
            case 'workshop': return '🔧';
            default: return '📝';
        }
    };

    useEffect(() => {
        loadLearningItems();
    }, [user?.id]);

    if (activeTab !== 'learning') {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Items</p>
                            <p className="text-2xl font-bold text-gray-900">{learningItems.length}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completed</p>
                            <p className="text-2xl font-bold text-green-600">
                                {learningItems.filter(item => item.status === 'completed').length}
                            </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">In Progress</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {learningItems.filter(item => item.status === 'in-progress').length}
                            </p>
                        </div>
                        <Play className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Time</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {learningItems.reduce((sum, item) => sum + item.timeSpent, 0)}m
                            </p>
                        </div>
                        <Clock className="h-8 w-8 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Learning Items List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-gray-600" />
                        Learning Items
                    </h2>
                    <button
                        onClick={handleShowAddForm}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={14} />
                        Add Learning Item
                    </button>
                </div>

                <div className="p-6">
                    {learningItems.length === 0 ? (
                        <div className="text-center py-8">
                            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No learning items yet</h3>
                            <p className="text-gray-600 mb-4">Start tracking your learning journey by adding your first item</p>
                            <button
                                onClick={handleShowAddForm}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={14} />
                                Add Learning Item
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {learningItems.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-lg">{getTypeIcon(item.type)}</span>
                                                <h3 className="font-medium text-gray-900">{item.title}</h3>
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(item.status)}`}>
                                                    {item.status.replace('-', ' ')}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                <span className="capitalize">{item.type}</span>
                                                <span>•</span>
                                                <span>{item.category}</span>
                                                {item.platform && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{item.platform}</span>
                                                    </>
                                                )}
                                                {item.difficulty && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="capitalize">{item.difficulty}</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-2">
                                                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                                    <span>Progress</span>
                                                    <span>{item.progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${item.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {item.notes && (
                                                <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                                    {item.notes}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            {/* Link Status Button - only show if not linked */}
                                            {!linkStatuses[item.id] && (
                                                <button
                                                    onClick={() => handleOpenLinkPanel(item.id, item.title)}
                                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 hover:border-orange-300 transition-colors"
                                                >
                                                    <AlertCircle size={12} />
                                                    Link Required
                                                </button>
                                            )}

                                            {/* Show linked status if item is linked */}
                                            {linkStatuses[item.id] && (
                                                <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md">
                                                    <CheckCircle size={12} />
                                                    Linked to Graph
                                                </div>
                                            )}

                                            {item.link && (
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                    View Resource
                                                </a>
                                            )}

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => updateProgress(item.id, Math.max(0, item.progress - 10))}
                                                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                                >
                                                    -10%
                                                </button>
                                                <button
                                                    onClick={() => updateProgress(item.id, Math.min(100, item.progress + 10))}
                                                    className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                                                >
                                                    +10%
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Learning Form */}
            {showAddForm && (
                <AddLearningFormStepper
                    onSubmit={handleAddLearning}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {/* Link to Graph Side Panel */}
            <LinkToGraphSidePanel
                isOpen={linkSidePanel.isOpen}
                onClose={handleCloseLinkPanel}
                itemId={linkSidePanel.itemId}
                itemType="learning"
                itemTitle={linkSidePanel.itemTitle}
                onLinkSuccess={handleLinkSuccess}
            />
        </div>
    );
};

export default Learning;
