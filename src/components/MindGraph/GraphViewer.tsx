/**
 * GRAPH VIEWER COMPONENT
 * 
 * Standalone graph viewer that opens in new tabs/windows.
 * Shows only the graph canvas and essential controls.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { X, Settings, Download, Share } from 'lucide-react';
import GraphCanvas from './GraphCanvas';
import GraphToolbar from './GraphToolbar';
import NodePanel from './NodePanel';
import GraphControls from './GraphControls';
import GraphSettings from './GraphSettings';
import { useGraphData, useGraphMetrics } from '../../hooks/useGraphData';
import type { GraphNode, GraphSettings as GraphSettingsType } from '../../types/graph';

interface GraphViewerProps {
    graphId?: string;
}

const GraphViewer: React.FC<GraphViewerProps> = ({ graphId: propGraphId }) => {
    const { graphId: urlGraphId } = useParams<{ graphId: string }>();
    const graphId = propGraphId || urlGraphId;
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedTool, setSelectedTool] = useState('select');
    const [settings, setSettings] = useState<GraphSettingsType>({
        showGrid: true,
        showMinimap: true,
        horizonDays: 14
    });

    const {
        nodes,
        edges,
        loading,
        createNode,
        updateNode,
        updateNodePosition,
        deleteNode,
        createEdge,
        deleteEdge,
        recalculateNodeStrength
    } = useGraphData(graphId);

    const safeNodes = nodes || [];
    const safeEdges = edges || [];

    // Show error message if no graphId is provided
    if (!graphId) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Graph Selected</h3>
                    <p className="text-gray-600">Please select a graph to view.</p>
                </div>
            </div>
        );
    }

    const handleNodeSelect = useCallback((node: GraphNode | null) => {
        setSelectedNode(node);
    }, []);

    const handleNodeCreate = useCallback(async (position: { x: number; y: number }, title: string, type: string = 'concept') => {
        const newNode = await createNode({
            title,
            type: type as any,
            position,
            description: ''
        });

        if (newNode) {
            setSelectedNode(newNode);
        }
    }, [createNode]);

    const handleToolSelect = useCallback((tool: string) => {
        setSelectedTool(tool);
    }, []);

    const handleCreateNodeFromToolbar = useCallback(async () => {
        // Use the global function exposed by GraphCanvas
        if ((window as any).createNodeAtCenter) {
            await (window as any).createNodeAtCenter();
        }
    }, []);

    const handleNodeUpdate = useCallback(async (nodeId: number, updates: any) => {
        const success = await updateNode(nodeId, updates);

        // Update selected node if it's the one being updated
        if (success && selectedNode?.id === nodeId) {
            setSelectedNode(prev => prev ? { ...prev, ...updates } : null);
        }

        return success;
    }, [updateNode, selectedNode]);

    const handleNodeDelete = useCallback(async (nodeId: number) => {
        const success = await deleteNode(nodeId);
        if (success) {
            // Clear selection if the deleted node was selected
            if (selectedNode?.id === nodeId) {
                setSelectedNode(null);
            }
        }
        return success;
    }, [deleteNode, selectedNode]);

    const handleAddChildNode = useCallback(async (parentNodeId: number) => {
        const parentNode = safeNodes.find(n => n.id === parentNodeId);
        if (!parentNode) return;

        // Create position for child node (slightly below and to the right)
        const childPosition = {
            x: (parentNode.position?.x || 0) + 150,
            y: (parentNode.position?.y || 0) + 100
        };

        // Create the child node
        const childNode = await createNode({
            title: 'New Child Node',
            type: 'concept',
            position: childPosition,
            description: ''
        });

        if (childNode) {
            // Create edge connecting parent to child
            await createEdge({
                sourceNodeId: parentNodeId,
                targetNodeId: childNode.id,
                relationshipType: 'parent_child',
                weight: 1.0
            });

            // Select the new child node
            setSelectedNode(childNode);
        }
    }, [safeNodes, createNode, createEdge, setSelectedNode]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle Delete key when a node is selected and not in an input field
            if (event.key === 'Delete' && selectedNode && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
                event.preventDefault();
                handleNodeDelete(selectedNode.id);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNode, handleNodeDelete]);

    const handleClose = () => {
        window.close();
    };

    const handleExport = () => {
        // Export graph data as JSON
        const graphData = {
            nodes: safeNodes,
            edges: safeEdges,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `graph-${graphId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleShare = () => {
        // Copy current URL to clipboard
        navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading graph...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <h1 className="text-lg font-semibold text-gray-900">
                        Knowledge Graph
                    </h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{safeNodes.length} nodes</span>
                        <span>•</span>
                        <span>{safeEdges.length} connections</span>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={handleExport}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md toolbar-button"
                        title="Export Graph"
                    >
                        <Download className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md toolbar-button"
                        title="Share Graph"
                    >
                        <Share className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md toolbar-button"
                        title="Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md toolbar-button"
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Toolbar */}
                <GraphToolbar
                    onToolSelect={handleToolSelect}
                    selectedTool={selectedTool}
                    onCreateNode={handleCreateNodeFromToolbar}
                />

                {/* Graph Canvas */}
                <div className="flex-1 relative">
                    <GraphCanvas
                        nodes={safeNodes}
                        edges={safeEdges}
                        onNodeSelect={handleNodeSelect}
                        onNodeCreate={handleNodeCreate}
                        onNodeUpdate={updateNode}
                        updateNodePosition={updateNodePosition}
                        selectedNode={selectedNode}
                        settings={settings}
                        onCreateNodeAtCenter={handleCreateNodeFromToolbar}
                        createEdge={createEdge}
                        deleteEdge={deleteEdge}
                    />

                    {/* Graph Controls Overlay */}
                    <div className="absolute top-4 left-4">
                        <GraphControls />
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
                    {selectedNode ? (
                        <NodePanel
                            node={selectedNode}
                            onUpdate={handleNodeUpdate}
                            onDelete={handleNodeDelete}
                            onClose={() => setSelectedNode(null)}
                            onAddChildNode={handleAddChildNode}
                            onRecalculateStrength={recalculateNodeStrength}
                        />
                    ) : (
                        <div className="p-6 text-center text-gray-600">
                            <div className="mb-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-2xl">📝</span>
                                </div>
                                <h3 className="font-medium text-gray-900 mb-2">No node selected</h3>
                                <p className="text-sm">
                                    Click on a node to view its details, or double-click on empty space to create a new node.
                                </p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Total nodes:</span>
                                    <span className="font-medium">{safeNodes.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Connections:</span>
                                    <span className="font-medium">{safeEdges.length}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="w-80 bg-white border-l border-gray-200">
                        <GraphSettings
                            settings={settings}
                            onSettingsChange={setSettings}
                            onClose={() => setShowSettings(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphViewer;
