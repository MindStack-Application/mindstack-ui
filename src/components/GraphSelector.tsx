/**
 * GRAPH SELECTOR COMPONENT
 * 
 * A component for selecting graph nodes with search and creation capabilities.
 * Handles the requirement for linking Problems and Learning Items to Graph Nodes.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Check } from 'lucide-react';
import { apiClient } from '../utils/apis';
import type { GraphNode } from '../types/graph';

interface GraphSelectorProps {
    selectedNodeIds: number[];
    onNodeIdsChange: (nodeIds: number[]) => void;
    graphId?: number; // Optional graph ID to filter nodes
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

interface NodeOption extends GraphNode {
    isNew?: boolean;
}

const GraphSelector: React.FC<GraphSelectorProps> = ({
    selectedNodeIds,
    onNodeIdsChange,
    graphId,
    placeholder = "Search for nodes...",
    className = "",
    disabled = false
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [nodes, setNodes] = useState<NodeOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [creatingNode, setCreatingNode] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load nodes when search term changes
    useEffect(() => {
        const loadNodes = async () => {
            if (searchTerm.length < 2) {
                setNodes([]);
                return;
            }

            setLoading(true);
            try {
                const response = await apiClient.getNodes({
                    search: searchTerm,
                    limit: 10,
                    graphId: graphId
                });

                if (response.success) {
                    // Handle both array and {rows, count} response formats
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

        const timeoutId = setTimeout(loadNodes, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
    };

    const handleNodeSelect = async (node: NodeOption) => {
        if (node.isNew) {
            // Create new node
            await createNewNode(node.title);
        } else {
            // Select existing node
            if (!selectedNodeIds.includes(node.id)) {
                onNodeIdsChange([...selectedNodeIds, node.id]);
            }
        }

        setSearchTerm('');
        setIsOpen(false);
    };

    const createNewNode = async (title: string) => {
        setCreatingNode(true);
        try {
            const response = await apiClient.createNode({
                title,
                type: 'concept',
                description: `Created from ${placeholder.toLowerCase()}`,
                graphId: graphId
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

    const getSelectedNodes = async () => {
        if (selectedNodeIds.length === 0) return [];

        try {
            const response = await apiClient.getNodes({ graphId: graphId });
            if (response.success) {
                // Handle both array and {rows, count} response formats
                const nodeData = response.data;
                const nodesArray = Array.isArray(nodeData) ? nodeData : (nodeData?.rows || []);
                return nodesArray.filter((node: GraphNode) =>
                    selectedNodeIds.includes(node.id)
                );
            }
        } catch (error) {
            console.error('Error loading selected nodes:', error);
        }
        return [];
    };

    const [selectedNodes, setSelectedNodes] = useState<GraphNode[]>([]);

    useEffect(() => {
        getSelectedNodes().then(setSelectedNodes);
    }, [selectedNodeIds]);

    const showCreateOption = searchTerm.length >= 2 &&
        !(Array.isArray(nodes) && nodes.some(node => node.title.toLowerCase() === searchTerm.toLowerCase()));

    return (
        <div className={`relative ${className}`}>
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

            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`}
                />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
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
                                    No nodes found
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Validation Message */}
            {selectedNodeIds.length === 0 && (
                <div className="mt-1 text-sm text-red-600">
                    Select a Graph and at least one Node
                </div>
            )}
        </div>
    );
};

export default GraphSelector;
