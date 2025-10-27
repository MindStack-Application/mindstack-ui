/**
 * NODE PANEL COMPONENT
 * 
 * Right panel for viewing and editing node details.
 */

import React, { useState } from 'react';
import { X, Edit3, Trash2, Plus, BookOpen, Calendar, AlertCircle } from 'lucide-react';
import { useGraphMetrics } from '../../hooks/useGraphData';
import { apiClient } from '../../utils/apis';
import { AuthContext } from '../AuthContext';
import type { GraphNode } from '../../types';

interface NodePanelProps {
    node: GraphNode;
    onUpdate: (nodeId: number, updates: any) => void;
    onDelete: (nodeId: number) => void;
    onClose: () => void;
}

const NodePanel: React.FC<NodePanelProps> = ({ node, onUpdate, onDelete, onClose }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isTrackingLearning, setIsTrackingLearning] = useState(false);
    const [editData, setEditData] = useState({
        title: node.title,
        description: node.description || '',
        type: node.type
    });

    const { user } = React.useContext(AuthContext);

    const {
        getNodeStatus,
        getNodeStrength,
        getNodeDueDate,
        getNodePredictedWeakDate,
        formatStrength,
        formatDaysUntilDue,
        getStatusColor,
        getStatusIcon
    } = useGraphMetrics();

    const status = getNodeStatus(node);
    const strength = getNodeStrength(node);
    const dueDate = getNodeDueDate(node);
    const predictedWeakDate = getNodePredictedWeakDate(node);

    const handleSave = async () => {
        const updates = {
            title: editData.title,
            description: editData.description,
            type: editData.type
        };

        const success = await onUpdate(node.id, updates);
        if (success) {
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditData({
            title: node.title,
            description: node.description || '',
            type: node.type
        });
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this node?')) {
            await onDelete(node.id);
        }
    };

    const handleTrackAsLearning = async () => {
        if (!user?.id) return;

        setIsTrackingLearning(true);
        try {
            const response = await apiClient.createLearningItemFromNode(node.id, user);
            if (response.success) {
                // Show success message
                alert('Node tracked as learning item successfully!');
            } else {
                alert('Failed to track as learning item');
            }
        } catch (error) {
            console.error('Error tracking as learning item:', error);
            alert('Error tracking as learning item');
        } finally {
            setIsTrackingLearning(false);
        }
    };

    const getTypeColor = (type: string): string => {
        switch (type) {
            case 'concept': return '#3b82f6';
            case 'skill': return '#10b981';
            case 'topic': return '#f59e0b';
            case 'resource': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Node Details</h3>
                <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Basic Info */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>

                    {isEditing ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editData.title}
                                    onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    value={editData.type}
                                    onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value as any }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="concept">Concept</option>
                                    <option value="skill">Skill</option>
                                    <option value="topic">Topic</option>
                                    <option value="resource">Resource</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Title:</span>
                                <span className="text-sm font-medium text-gray-900">{node.title}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Type:</span>
                                <span
                                    className="px-2 py-1 text-xs font-medium rounded-full text-white"
                                    style={{ backgroundColor: getTypeColor(node.type) }}
                                >
                                    {node.type}
                                </span>
                            </div>

                            {node.description && (
                                <div>
                                    <span className="text-sm text-gray-600">Description:</span>
                                    <p className="text-sm text-gray-900 mt-1">{node.description}</p>
                                </div>
                            )}

                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                <Edit3 size={14} />
                                Edit Details
                            </button>
                        </div>
                    )}
                </div>

                {/* Metrics */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Metrics</h4>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Strength:</span>
                            <span className="text-sm font-medium" style={{ color: getTypeColor(node.type) }}>
                                {formatStrength(strength)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                                {status} {getStatusIcon(status)}
                            </span>
                        </div>

                        {dueDate && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Due:</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {formatDaysUntilDue(dueDate)}
                                </span>
                            </div>
                        )}

                        {predictedWeakDate && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Predicted Weak:</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {formatDaysUntilDue(predictedWeakDate)}
                                </span>
                            </div>
                        )}

                        {node.lastVisited && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Last Visited:</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {new Date(node.lastVisited).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
                    <div className="space-y-2">
                        <button
                            onClick={handleTrackAsLearning}
                            disabled={isTrackingLearning}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <BookOpen size={14} />
                            {isTrackingLearning ? 'Tracking...' : 'Track as Learning Item'}
                        </button>

                        <button
                            onClick={() => console.log('Add child node')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Plus size={14} />
                            Add Child Node
                        </button>

                        <button
                            onClick={() => console.log('Convert type')}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                            <Edit3 size={14} />
                            Convert Type
                        </button>

                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={14} />
                            Delete Node
                        </button>
                    </div>
                </div>

                {/* Warnings */}
                {status === 'due' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle size={16} />
                            <span className="text-sm font-medium">This node is overdue for review</span>
                        </div>
                    </div>
                )}

                {status === 'stale' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800">
                            <AlertCircle size={16} />
                            <span className="text-sm font-medium">This node may become weak soon</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NodePanel;
