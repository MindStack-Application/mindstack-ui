/**
 * GRAPH DASHBOARD COMPONENT
 * 
 * Dashboard showing all user's graphs with ability to open them in new tabs.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Network, Calendar, Users, Settings, ExternalLink } from 'lucide-react';
import { useGraphData } from '../../hooks/useGraphData';
import type { GraphNode, GraphEdge } from '../../types';

interface GraphSummary {
    id: string;
    name: string;
    nodeCount: number;
    edgeCount: number;
    lastModified: Date;
    description?: string;
}

const GraphDashboard: React.FC = () => {
    const [graphs, setGraphs] = useState<GraphSummary[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newGraphName, setNewGraphName] = useState('');
    const { nodes, edges, loading } = useGraphData();

    // Convert nodes/edges to graph summaries
    useEffect(() => {
        const safeNodes = nodes || [];
        const safeEdges = edges || [];

        if (safeNodes.length > 0) {
            // For now, create a single default graph
            // In the future, this would come from a separate graphs table
            const graphSummary: GraphSummary = {
                id: 'default',
                name: 'My Knowledge Graph',
                nodeCount: safeNodes.length,
                edgeCount: safeEdges.length,
                lastModified: new Date(Math.max(...safeNodes.map(n => new Date(n.updatedAt).getTime()))),
                description: 'Your personal knowledge graph'
            };
            setGraphs([graphSummary]);
        } else {
            setGraphs([]);
        }
    }, [nodes, edges]);

    const handleCreateGraph = async () => {
        if (!newGraphName.trim()) return;

        // In the future, this would create a new graph
        // For now, we'll just add a placeholder
        const newGraph: GraphSummary = {
            id: `graph-${Date.now()}`,
            name: newGraphName,
            nodeCount: 0,
            edgeCount: 0,
            lastModified: new Date(),
            description: 'A new knowledge graph'
        };

        setGraphs(prev => [...prev, newGraph]);
        setNewGraphName('');
        setIsCreating(false);
    };

    const handleOpenGraph = (graphId: string) => {
        // Open graph in new tab/window
        const graphUrl = `/mindgraph/${graphId}`;
        window.open(graphUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
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

            {/* Create New Graph */}
            <div className="mb-6">
                {isCreating ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center space-x-3">
                            <input
                                type="text"
                                value={newGraphName}
                                onChange={(e) => setNewGraphName(e.target.value)}
                                placeholder="Enter graph name..."
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <button
                                onClick={handleCreateGraph}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create New Graph</span>
                    </button>
                )}
            </div>

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
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => handleOpenGraph(graph.id)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Network className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{graph.name}</h3>
                                        {graph.description && (
                                            <p className="text-sm text-gray-600">{graph.description}</p>
                                        )}
                                    </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Nodes</span>
                                    <span className="font-medium">{graph.nodeCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Connections</span>
                                    <span className="font-medium">{graph.edgeCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Last modified</span>
                                    <span className="font-medium">{formatDate(graph.lastModified)}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenGraph(graph.id);
                                    }}
                                    className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Open Graph
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GraphDashboard;
