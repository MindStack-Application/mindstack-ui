/**
 * GRAPH DASHBOARD COMPONENT
 * 
 * Dashboard for managing multiple knowledge graphs.
 * Shows graph statistics and provides access to graph visualization.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Network, ExternalLink, Edit3, Trash2, Palette } from 'lucide-react';
import { apiClient } from '../../utils/apis';
import MetricsJobStatusWidget from './MetricsJobStatusWidget';
import type { Graph, CreateGraphData } from '../../types/graph';

interface GraphSummary extends Graph {
    nodeCount: number;
    edgeCount: number;
    lastModified: string;
}

const GraphDashboard: React.FC = () => {
    const [graphs, setGraphs] = useState<GraphSummary[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState<number | null>(null);
    const [newGraphName, setNewGraphName] = useState('');
    const [newGraphDescription, setNewGraphDescription] = useState('');
    const [newGraphColor, setNewGraphColor] = useState('#3B82F6');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Load graphs on mount
    useEffect(() => {
        loadGraphs();
    }, []);

    const loadGraphs = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getGraphs();
            if (response.success) {
                setGraphs(response.data);
            } else {
                setError('Failed to load graphs');
            }
        } catch (error) {
            console.error('Error loading graphs:', error);
            setError('Failed to load graphs');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGraph = async () => {
        if (!newGraphName.trim()) return;

        try {
            const graphData: CreateGraphData = {
                name: newGraphName.trim(),
                description: newGraphDescription.trim() || undefined,
                color: newGraphColor
            };

            const response = await apiClient.createGraph(graphData);
            if (response.success) {
                await loadGraphs(); // Reload graphs
                setNewGraphName('');
                setNewGraphDescription('');
                setNewGraphColor('#3B82F6');
                setIsCreating(false);
            } else {
                setError(response.message || 'Failed to create graph');
            }
        } catch (error) {
            console.error('Error creating graph:', error);
            setError('Failed to create graph');
        }
    };

    const handleUpdateGraph = async (graphId: number) => {
        if (!newGraphName.trim()) return;

        try {
            const graphData = {
                name: newGraphName.trim(),
                description: newGraphDescription.trim() || undefined,
                color: newGraphColor
            };

            const response = await apiClient.updateGraph(graphId, graphData);
            if (response.success) {
                await loadGraphs(); // Reload graphs
                setNewGraphName('');
                setNewGraphDescription('');
                setNewGraphColor('#3B82F6');
                setIsEditing(null);
            } else {
                setError(response.message || 'Failed to update graph');
            }
        } catch (error) {
            console.error('Error updating graph:', error);
            setError('Failed to update graph');
        }
    };

    const handleDeleteGraph = async (graphId: number) => {
        if (!confirm('Are you sure you want to delete this graph? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await apiClient.deleteGraph(graphId);
            if (response.success) {
                await loadGraphs(); // Reload graphs
            } else {
                setError(response.message || 'Failed to delete graph');
            }
        } catch (error) {
            console.error('Error deleting graph:', error);
            setError('Failed to delete graph');
        }
    };

    const handleOpenGraph = (graphId: number) => {
        const graphUrl = `/mindgraph/${graphId}`;
        window.open(graphUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    };

    const startEdit = (graph: GraphSummary) => {
        setNewGraphName(graph.name);
        setNewGraphDescription(graph.description || '');
        setNewGraphColor(graph.color);
        setIsEditing(graph.id);
        setIsCreating(false);
    };

    const cancelEdit = () => {
        setNewGraphName('');
        setNewGraphDescription('');
        setNewGraphColor('#3B82F6');
        setIsEditing(null);
        setIsCreating(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Knowledge Graphs</h1>
                <p className="text-gray-600">Manage and explore your knowledge graphs</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => setError('')}
                        className="mt-2 text-red-500 hover:text-red-700 text-sm"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Metrics Job Status */}
            <div className="mb-6">
                <MetricsJobStatusWidget />
            </div>

            {/* Create/Edit Graph Form */}
            {(isCreating || isEditing) && (
                <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {isEditing ? 'Edit Graph' : 'Create New Graph'}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="graphName" className="block text-sm font-medium text-gray-700 mb-2">
                                Graph Name *
                            </label>
                            <input
                                type="text"
                                id="graphName"
                                value={newGraphName}
                                onChange={(e) => setNewGraphName(e.target.value)}
                                placeholder="e.g., Computer Science, Mathematics, Programming"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="graphDescription" className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                id="graphDescription"
                                value={newGraphDescription}
                                onChange={(e) => setNewGraphDescription(e.target.value)}
                                placeholder="Optional description of what this graph contains..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="graphColor" className="block text-sm font-medium text-gray-700 mb-2">
                                Color
                            </label>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="color"
                                    id="graphColor"
                                    value={newGraphColor}
                                    onChange={(e) => setNewGraphColor(e.target.value)}
                                    className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={newGraphColor}
                                    onChange={(e) => setNewGraphColor(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="#3B82F6"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={cancelEdit}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => isEditing ? handleUpdateGraph(isEditing) : handleCreateGraph()}
                                disabled={!newGraphName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isEditing ? 'Update Graph' : 'Create Graph'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Graph Button */}
            {!isCreating && !isEditing && (
                <div className="mb-6">
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create New Graph</span>
                    </button>
                </div>
            )}

            {/* Graphs Grid */}
            {graphs.length === 0 ? (
                <div className="text-center py-12">
                    <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No graphs yet</h3>
                    <p className="text-gray-600 mb-4">Create your first knowledge graph to get started</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Create Graph
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {graphs.map((graph) => (
                        <div
                            key={graph.id}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="p-2 rounded-lg"
                                        style={{ backgroundColor: `${graph.color}20` }}
                                    >
                                        <Network
                                            className="w-6 h-6"
                                            style={{ color: graph.color }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{graph.name}</h3>
                                        {graph.isDefault && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => startEdit(graph)}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Edit graph"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    {!graph.isDefault && (
                                        <button
                                            onClick={() => handleDeleteGraph(graph.id)}
                                            className="text-gray-400 hover:text-red-600"
                                            title="Delete graph"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {graph.description && (
                                <p className="text-gray-600 text-sm mb-4">{graph.description}</p>
                            )}

                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                <div className="flex items-center space-x-4">
                                    <span>{graph.nodeCount} nodes</span>
                                    <span>{graph.edgeCount} edges</span>
                                </div>
                                <span>{new Date(graph.lastModified).toLocaleDateString()}</span>
                            </div>

                            <button
                                onClick={() => handleOpenGraph(graph.id)}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                <span>Open Graph</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GraphDashboard;