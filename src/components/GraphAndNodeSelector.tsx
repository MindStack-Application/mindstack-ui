/**
 * GRAPH AND NODE SELECTOR COMPONENT
 * 
 * A component that first asks users to select a graph, then allows them to select nodes within that graph.
 * This prevents duplicate graphs and provides a proper graph-first workflow.
 */

import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Check, Brain, ChevronDown } from 'lucide-react';
import { apiClient } from '../utils/apis';
import type { GraphNode } from '../types/graph';

interface Graph {
    id: number;
    name: string;
    description?: string;
    color?: string;
    isDefault?: boolean;
}

interface GraphAndNodeSelectorProps {
    selectedNodeIds: number[];
    onNodeIdsChange: (nodeIds: number[]) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

interface NodeOption extends GraphNode {
    isNew?: boolean;
}

const GraphAndNodeSelector: React.FC<GraphAndNodeSelectorProps> = ({
    selectedNodeIds,
    onNodeIdsChange,
    placeholder = "Select a graph first, then choose nodes...",
    className = "",
    disabled = false
}) => {
    const [selectedGraph, setSelectedGraph] = useState<Graph | null>(null);
    const [graphs, setGraphs] = useState<Graph[]>([]);
    const [showGraphSelector, setShowGraphSelector] = useState(false);
    const [showNodeSelector, setShowNodeSelector] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [nodes, setNodes] = useState<NodeOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [creatingNode, setCreatingNode] = useState(false);
    const [selectedNodes, setSelectedNodes] = useState<GraphNode[]>([]);

    // Load graphs on mount
    useEffect(() => {
        loadGraphs();
    }, []);

    // Load selected nodes when nodeIds change
    useEffect(() => {
        if (selectedNodeIds.length > 0 && selectedGraph) {
            loadSelectedNodes();
        } else {
            setSelectedNodes([]);
        }
    }, [selectedNodeIds, selectedGraph]);

    const loadGraphs = async () => {
        try {
            const response = await apiClient.getGraphs();
            if (response.success) {
                setGraphs(response.data);
            }
        } catch (error) {
            console.error('Error loading graphs:', error);
        }
    };

    const loadSelectedNodes = async () => {
        if (!selectedGraph) return;

        try {
            const response = await apiClient.getNodes({
                graphId: selectedGraph.id
            });
            if (response.success) {
                const nodeData = response.data;
                const nodesArray = Array.isArray(nodeData) ? nodeData : (nodeData?.rows || []);
                const filtered = nodesArray.filter((node: GraphNode) =>
                    selectedNodeIds.includes(node.id)
                );
                setSelectedNodes(filtered);
            }
        } catch (error) {
            console.error('Error loading selected nodes:', error);
        }
    };

    const loadNodes = async (searchTerm: string) => {
        if (!selectedGraph || searchTerm.length < 2) {
            setNodes([]);
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.getNodes({
                search: searchTerm,
                limit: 10,
                graphId: selectedGraph.id
            });

            if (response.success) {
                const nodeData = response.data;
                const nodesArray = Array.isArray(nodeData) ? nodeData : (nodeData?.rows || []);
                setNodes(nodesArray);
            }
        } catch (error) {
            console.error('Error loading nodes:', error);
            setNodes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGraphSelect = (graph: Graph) => {
        setSelectedGraph(graph);
        setShowGraphSelector(false);
        setShowNodeSelector(true);
        setSearchTerm('');
        setNodes([]);
    };

    const handleNodeSelect = async (node: NodeOption) => {
        if (node.isNew) {
            await createNewNode(node.title);
        } else {
            if (!selectedNodeIds.includes(node.id)) {
                onNodeIdsChange([...selectedNodeIds, node.id]);
            }
        }
        setSearchTerm('');
        setShowNodeSelector(false);
    };

    const createNewNode = async (title: string) => {
        if (!selectedGraph) return;

        setCreatingNode(true);
        try {
            const response = await apiClient.createNode({
                title,
                type: 'concept',
                description: `Created from ${placeholder.toLowerCase()}`,
                graphId: selectedGraph.id
            });

            if (response.success) {
                const newNode = response.data;
                onNodeIdsChange([...selectedNodeIds, newNode.id]);
            }
        } catch (error) {
            console.error('Error creating node:', error);
        } finally {
            setCreatingNode(false);
        }
    };

    const removeNode = (nodeId: number) => {
        onNodeIdsChange(selectedNodeIds.filter(id => id !== nodeId));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        // Debounce the search
        const timeoutId = setTimeout(() => {
            loadNodes(value);
        }, 300);

        return () => clearTimeout(timeoutId);
    };

    const showCreateOption = searchTerm.length >= 2 &&
        !(Array.isArray(nodes) && nodes.some(node => node.title.toLowerCase() === searchTerm.toLowerCase()));

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Graph Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Graph *
                </label>
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => !disabled && setShowGraphSelector(!showGraphSelector)}
                        disabled={disabled}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left flex items-center justify-between ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Brain size={16} className="text-gray-400" />
                            <span className={selectedGraph ? 'text-gray-900' : 'text-gray-500'}>
                                {selectedGraph ? selectedGraph.name : 'Choose a graph...'}
                            </span>
                        </div>
                        <ChevronDown size={16} className="text-gray-400" />
                    </button>

                    {/* Graph Dropdown */}
                    {showGraphSelector && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {graphs.length === 0 ? (
                                <div className="p-3 text-center text-gray-500">
                                    No graphs found. Create your first graph!
                                </div>
                            ) : (
                                graphs.map((graph) => (
                                    <button
                                        key={graph.id}
                                        onClick={() => handleGraphSelect(graph)}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: graph.color || '#3B82F6' }}></div>
                                        <div>
                                            <div className="font-medium">{graph.name}</div>
                                            {graph.description && (
                                                <div className="text-xs text-gray-500">{graph.description}</div>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Node Selection - Only show if graph is selected */}
            {selectedGraph && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Nodes *
                    </label>

                    {/* Selected Nodes Display */}
                    {selectedNodes.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                            {selectedNodes.map((node) => (
                                <div
                                    key={node.id}
                                    className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                                >
                                    <span>{node.title}</span>
                                    {!disabled && (
                                        <button
                                            onClick={() => removeNode(node.id)}
                                            className="hover:bg-blue-200 rounded-full p-0.5"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Node Search Input */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setShowNodeSelector(true)}
                            placeholder={`Search nodes in "${selectedGraph.name}"...`}
                            disabled={disabled}
                            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                    </div>

                    {/* Node Dropdown */}
                    {showNodeSelector && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {loading ? (
                                <div className="p-3 text-center text-gray-500">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
                                    <span className="ml-2">Searching...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Existing Nodes */}
                                    {Array.isArray(nodes) && nodes.map((node) => (
                                        <button
                                            key={node.id}
                                            onClick={() => handleNodeSelect(node)}
                                            disabled={selectedNodeIds.includes(node.id)}
                                            className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between ${selectedNodeIds.includes(node.id)
                                                ? 'bg-blue-50 text-blue-600 cursor-not-allowed'
                                                : 'text-gray-900'
                                                }`}
                                        >
                                            <div>
                                                <div className="font-medium">{node.title}</div>
                                                <div className="text-xs text-gray-500 capitalize">{node.type}</div>
                                            </div>
                                            {selectedNodeIds.includes(node.id) && (
                                                <Check size={16} className="text-blue-600" />
                                            )}
                                        </button>
                                    ))}

                                    {/* Create New Node Option */}
                                    {showCreateOption && (
                                        <button
                                            onClick={() => handleNodeSelect({
                                                id: -1,
                                                title: searchTerm,
                                                type: 'concept',
                                                isNew: true
                                            } as NodeOption)}
                                            disabled={creatingNode}
                                            className="w-full px-3 py-2 text-left hover:bg-green-50 text-green-700 border-t border-gray-200 flex items-center gap-2"
                                        >
                                            <Plus size={16} />
                                            <span>
                                                {creatingNode ? 'Creating...' : `+ Create "${searchTerm}"`}
                                            </span>
                                        </button>
                                    )}

                                    {/* No Results */}
                                    {Array.isArray(nodes) && nodes.length === 0 && searchTerm.length >= 2 && !showCreateOption && (
                                        <div className="p-3 text-center text-gray-500">
                                            No nodes found in this graph
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Validation Message */}
            {(!selectedGraph || selectedNodeIds.length === 0) && (
                <div className="text-sm text-red-600">
                    {!selectedGraph ? 'Select a graph first' : 'Select at least one node'}
                </div>
            )}
        </div>
    );
};

export default GraphAndNodeSelector;
