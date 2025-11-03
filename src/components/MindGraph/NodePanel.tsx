/**
 * NODE PANEL COMPONENT
 * 
 * Right panel for viewing and editing node details.
 */

import React, { useState, useEffect } from 'react';
import {
    X,
    Edit3,
    Trash2,
    Plus,
    Network,
    ExternalLink,
    Info,
    BarChart3,
    Zap,
    FileText,
    Settings,
    Hash,
    AlertCircle,
    Clock
} from 'lucide-react';
import { useGraphMetrics } from '../../hooks/useGraphData';
import { apiClient } from '../../utils/apis';
import { AuthContext } from '../AuthContext';
import { formatStrengthContextual, hasNodeBeenStudied } from '../../utils/strengthUtils';
import type { GraphNode } from '../../types/graph';

interface NodePanelProps {
    node: GraphNode;
    onUpdate: (nodeId: number, updates: any) => Promise<boolean>;
    onDelete: (nodeId: number) => void;
    onClose: () => void;
    onAddChildNode?: (parentNodeId: number) => void;
    onRecalculateStrength?: (nodeId: number) => Promise<boolean>;
}

const NodePanel: React.FC<NodePanelProps> = ({ node, onUpdate, onDelete, onClose, onAddChildNode, onRecalculateStrength }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [linkedArtifacts, setLinkedArtifacts] = useState<any[]>([]);
    const [loadingArtifacts, setLoadingArtifacts] = useState(false);
    const [editData, setEditData] = useState({
        title: node.title,
        description: node.description || ''
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
    } = useGraphMetrics(user?.id);

    const status = getNodeStatus(node);
    const strength = getNodeStrength(node);
    const dueDate = getNodeDueDate(node);
    const predictedWeakDate = getNodePredictedWeakDate(node);

    // Use contextual strength display
    const hasStudied = hasNodeBeenStudied(node);
    const strengthDisplay = formatStrengthContextual(strength, hasStudied);

    const handleSave = async () => {
        const updates = {
            title: editData.title,
            description: editData.description
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

    const handleAddChildNode = () => {
        if (onAddChildNode) {
            onAddChildNode(node.id);
        }
    };


    const loadLinkedArtifacts = async () => {
        setLoadingArtifacts(true);
        try {
            const response = await apiClient.getNodeItems(node.id);
            if (response.success) {
                setLinkedArtifacts(response.data || []);
            }
        } catch (error) {
            console.error('Error loading linked artifacts:', error);
        } finally {
            setLoadingArtifacts(false);
        }
    };

    useEffect(() => {
        loadLinkedArtifacts();
    }, [node.id]);

    const getTypeColor = (type: string): string => {
        switch (type) {
            case 'concept': return '#3b82f6';
            case 'skill': return '#10b981';
            case 'topic': return '#f59e0b';
            case 'resource': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'concept': return Hash;
            case 'skill': return Zap;
            case 'topic': return FileText;
            case 'resource': return Network;
            default: return Hash;
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Node Header Card */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Add a description..."
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-start gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                    style={{ backgroundColor: getTypeColor(node.type) }}
                                >
                                    {React.createElement(getTypeIcon(node.type), { size: 20 })}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-semibold text-gray-900 truncate">{node.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span
                                            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white"
                                            style={{ backgroundColor: getTypeColor(node.type) }}
                                        >
                                            {node.type}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            Node #{node.id}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {node.description && (
                                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                    {node.description}
                                </p>
                            )}

                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                                <Edit3 size={14} />
                                Edit Details
                            </button>
                        </div>
                    )}
                </div>

                {/* Performance Metrics Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={18} className="text-blue-600" />
                        <h3 className="font-medium text-gray-900">Performance Metrics</h3>
                    </div>

                    <div className="space-y-3">
                        {/* Mastery Level */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Zap size={14} className="text-blue-600" />
                                    <span className="text-xs font-medium text-blue-800">Mastery Level</span>
                                </div>
                                {onRecalculateStrength && (
                                    <button
                                        onClick={() => onRecalculateStrength(node.id)}
                                        className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                                        title="Recalculate strength based on artifacts"
                                    >
                                        <BarChart3 size={12} />
                                    </button>
                                )}
                            </div>
                            <div className="text-xl font-bold text-blue-900">
                                {hasStudied ? `${Math.round(strength * 10) / 10}/5` : '1/5'}
                            </div>
                            <div className="text-xs text-blue-600">
                                {hasStudied ?
                                    (strength >= 4.5 ? 'Mastery' :
                                        strength >= 3.5 ? 'Advanced' :
                                            strength >= 2.5 ? 'Proficient' :
                                                strength >= 1.5 ? 'Developing' : 'Beginner')
                                    : 'Beginner'
                                }
                            </div>
                        </div>

                    </div>

                    {/* Status Banner */}
                    {status !== 'ok' && (
                        <div className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${status === 'due' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
                            }`}>
                            <AlertCircle size={14} className={status === 'due' ? 'text-red-600' : 'text-amber-600'} />
                            <span className={`text-xs font-medium ${status === 'due' ? 'text-red-800' : 'text-amber-800'
                                }`}>
                                {status === 'due' ? 'Review Due Now' : 'Knowledge May Be Stale'}
                            </span>
                            {dueDate && (
                                <span className={`ml-auto text-xs ${status === 'due' ? 'text-red-600' : 'text-amber-600'
                                    }`}>
                                    {formatDaysUntilDue(dueDate)}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Linked Artifacts Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Network size={18} className="text-purple-600" />
                        <h3 className="font-medium text-gray-900">Linked Artifacts</h3>
                        {linkedArtifacts.length > 0 && (
                            <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                                {linkedArtifacts.length}
                            </span>
                        )}
                    </div>

                    {loadingArtifacts ? (
                        <div className="text-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent mx-auto mb-2"></div>
                            <p className="text-sm text-gray-500">Loading artifacts...</p>
                        </div>
                    ) : linkedArtifacts.length === 0 ? (
                        <div className="text-center py-6">
                            <Network size={32} className="text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No artifacts linked to this node</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {linkedArtifacts.map((artifact) => (
                                <div key={`${artifact.itemType}-${artifact.itemId}`} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm">
                                            {artifact.itemType === 'learning' ? '📚' : '💻'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {artifact.item.title}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${artifact.itemType === 'learning'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {artifact.itemType}
                                                </span>
                                            </div>

                                            <div className="text-xs text-gray-600 mb-2">
                                                {artifact.itemType === 'learning' ? (
                                                    <>
                                                        {artifact.item.type} • {artifact.item.category}
                                                        {artifact.item.platform && ` • ${artifact.item.platform}`}
                                                    </>
                                                ) : (
                                                    <>
                                                        {artifact.item.platform} • {artifact.item.difficulty} • {artifact.item.topic}
                                                    </>
                                                )}
                                            </div>

                                        </div>

                                        {(artifact.item.link || artifact.item.resourceLink) && (
                                            <a
                                                href={artifact.item.link || artifact.item.resourceLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                                                title="View artifact"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Settings size={18} className="text-gray-600" />
                        <h3 className="font-medium text-gray-900">Actions</h3>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={handleAddChildNode}
                            disabled={!onAddChildNode}
                            className="w-full flex items-center gap-3 p-3 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Create a new child node connected to this one"
                        >
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            <span className="font-medium">Add Child Node</span>
                        </button>

                        <button
                            onClick={handleDelete}
                            className="w-full flex items-center gap-3 p-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Permanently delete this node and all its connections"
                        >
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <Trash2 size={16} />
                            </div>
                            <span className="font-medium">Delete Node</span>
                        </button>
                    </div>
                </div>

                {/* Status Alerts */}
                {status === 'due' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                <AlertCircle size={16} className="text-red-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-red-800">Review Overdue</div>
                                <div className="text-sm text-red-600">This node needs immediate attention</div>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'stale' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Clock size={16} className="text-amber-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-amber-800">Review Soon</div>
                                <div className="text-sm text-amber-600">This node may become weak soon</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NodePanel;
