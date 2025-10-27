/**
 * GRAPH CANVAS COMPONENT
 * 
 * React Flow canvas for visualizing and interacting with the graph.
 */

import React, { useCallback, useState, useRef } from 'react';
import ReactFlow, {
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    MiniMap,
    Background,
    BackgroundVariant,
    ReactFlowProvider,
} from 'reactflow';
import type {
    Node,
    Edge,
    Connection,
    NodeTypes,
    EdgeTypes,
    OnConnect,
    OnNodesChange,
    OnEdgesChange,
    OnNodeDragStop,
    ReactFlowInstance
} from '@reactflow/core';
import 'reactflow/dist/style.css';
import CustomNode from './NodeTypes';
import { useGraphData } from '../../hooks/useGraphData';
import type { GraphNode, GraphEdge, GraphSettings } from '../../types';

interface GraphCanvasProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    onNodeSelect: (node: GraphNode | null) => void;
    onNodeCreate: (position: { x: number; y: number }, title: string, type?: string) => void;
    onNodeUpdate: (nodeId: number, updates: any) => void;
    selectedNode: GraphNode | null;
    settings: GraphSettings;
    onCreateNodeAtCenter?: (type: string) => void;
}

const nodeTypes: NodeTypes = {
    custom: CustomNode,
};

const GraphCanvas: React.FC<GraphCanvasProps> = ({
    nodes,
    edges,
    onNodeSelect,
    onNodeCreate,
    onNodeUpdate,
    selectedNode,
    settings,
    onCreateNodeAtCenter
}) => {
    const [reactFlowNodes, setNodes, onNodesChange] = useNodesState([]);
    const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [isCreatingNode, setIsCreatingNode] = useState(false);
    const [newNodeTitle, setNewNodeTitle] = useState('');
    const [newNodePosition, setNewNodePosition] = useState<{ x: number; y: number } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { createEdge, deleteEdge } = useGraphData();

    // Convert GraphNode to ReactFlow Node (without selection)
    const convertToReactFlowNodes = useCallback((graphNodes: GraphNode[], selectedNodeId?: number): Node[] => {
        return graphNodes.map((node, index) => ({
            id: node.id.toString(),
            type: 'custom',
            position: node.position || {
                x: 100 + (index * 200),
                y: 100 + (index * 100)
            },
            data: {
                ...node,
                label: node.title,
                strength: node.metric?.strength || 0.5,
                status: node.metric?.status || 'ok',
                type: node.type
            },
            selected: selectedNodeId === node.id
        }));
    }, []);

    // Convert GraphEdge to ReactFlow Edge
    const convertToReactFlowEdges = useCallback((graphEdges: GraphEdge[]): Edge[] => {
        return graphEdges.map(edge => ({
            id: edge.id.toString(),
            source: edge.sourceNodeId.toString(),
            target: edge.targetNodeId.toString(),
            type: 'smoothstep',
            data: {
                relationshipType: edge.relationshipType,
                weight: edge.weight
            },
            style: {
                strokeWidth: edge.weight * 3,
                stroke: getEdgeColor(edge.relationshipType)
            }
        }));
    }, []);

    const getEdgeColor = (relationshipType: string): string => {
        switch (relationshipType) {
            case 'prerequisite': return '#ef4444';
            case 'related': return '#3b82f6';
            case 'depends_on': return '#f59e0b';
            case 'leads_to': return '#10b981';
            default: return '#6b7280';
        }
    };

    // Update ReactFlow nodes and edges when props change
    React.useEffect(() => {
        setNodes(convertToReactFlowNodes(nodes));
    }, [nodes, convertToReactFlowNodes, setNodes]);

    React.useEffect(() => {
        setEdges(convertToReactFlowEdges(edges));
    }, [edges, convertToReactFlowEdges, setEdges]);

    const onConnect: OnConnect = useCallback(async (connection: Connection) => {
        if (!connection.source || !connection.target) return;

        const edgeData = {
            sourceNodeId: parseInt(connection.source),
            targetNodeId: parseInt(connection.target),
            relationshipType: 'related' as const,
            weight: 1.0
        };

        const newEdge = await createEdge(edgeData);
        if (newEdge) {
            const edge: Edge = {
                id: newEdge.id.toString(),
                source: connection.source,
                target: connection.target,
                type: 'smoothstep',
                data: {
                    relationshipType: newEdge.relationshipType,
                    weight: newEdge.weight
                },
                style: {
                    strokeWidth: newEdge.weight * 3,
                    stroke: getEdgeColor(newEdge.relationshipType)
                }
            };
            setEdges(prev => addEdge(edge, prev));
        }
    }, [createEdge, setEdges]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        const graphNode = nodes.find(n => n.id.toString() === node.id);
        if (graphNode) {
            onNodeSelect(graphNode);
        }
    }, [nodes, onNodeSelect]);

    const onPaneClick = useCallback((event: React.MouseEvent) => {
        onNodeSelect(null);
    }, [onNodeSelect]);

    // Removed onPaneDoubleClick - nodes will be created via toolbar

    const handleCreateNode = useCallback(async () => {
        if (!newNodeTitle.trim() || !newNodePosition) return;

        await onNodeCreate(newNodePosition, newNodeTitle.trim());
        setIsCreatingNode(false);
        setNewNodeTitle('');
        setNewNodePosition(null);
    }, [newNodeTitle, newNodePosition, onNodeCreate]);

    // Method to create node at center of canvas
    const createNodeAtCenter = useCallback(async (type: string) => {
        if (!reactFlowInstance) {
            console.log('No ReactFlow instance available');
            return;
        }

        const viewport = reactFlowInstance.getViewport();
        console.log('Viewport:', viewport);

        const position = {
            x: 400, // Fixed center position
            y: 300
        };

        console.log('Creating node at position:', position, 'type:', type);

        const title = `${type.charAt(0).toUpperCase() + type.slice(1)} Node`;
        await onNodeCreate(position, title, type);
    }, [reactFlowInstance, onNodeCreate]);

    // Expose createNodeAtCenter to parent
    React.useEffect(() => {
        if (onCreateNodeAtCenter) {
            // This is a bit of a hack, but it works for now
            (window as any).createNodeAtCenter = createNodeAtCenter;
        }
    }, [createNodeAtCenter, onCreateNodeAtCenter]);

    const handleCancelCreate = useCallback(() => {
        setIsCreatingNode(false);
        setNewNodeTitle('');
        setNewNodePosition(null);
    }, []);

    const onNodeDragStop: OnNodeDragStop = useCallback(async (event, node) => {
        const updates = {
            position: { x: node.position.x, y: node.position.y }
        };
        await onNodeUpdate(parseInt(node.id), updates);
    }, [onNodeUpdate]);

    const onEdgeClick = useCallback(async (event: React.MouseEvent, edge: Edge) => {
        // Delete edge on click
        const success = await deleteEdge(parseInt(edge.id));
        if (success) {
            setEdges(prev => prev.filter(e => e.id !== edge.id));
        }
    }, [deleteEdge, setEdges]);

    return (
        <div className="h-full relative">
            <ReactFlow
                nodes={reactFlowNodes}
                edges={reactFlowEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onNodeDragStop={onNodeDragStop}
                onEdgeClick={onEdgeClick}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                fitView={false}
                attributionPosition="bottom-left"
            >
                <Controls />
                <MiniMap
                    nodeColor={(node) => {
                        const status = node.data?.status;
                        switch (status) {
                            case 'due': return '#ef4444';
                            case 'stale': return '#f59e0b';
                            case 'ok': return '#10b981';
                            default: return '#6b7280';
                        }
                    }}
                    nodeStrokeWidth={3}
                    nodeBorderRadius={2}
                />
                <Background
                    variant={settings.showGrid ? BackgroundVariant.Dots : BackgroundVariant.Cross}
                    gap={20}
                    size={1}
                />
            </ReactFlow>

            {/* Node Creation Modal */}
            {isCreatingNode && newNodePosition && (
                <div
                    className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-3"
                    style={{
                        left: newNodePosition.x,
                        top: newNodePosition.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Node title..."
                        value={newNodeTitle}
                        onChange={(e) => setNewNodeTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateNode();
                            } else if (e.key === 'Escape') {
                                handleCancelCreate();
                            }
                        }}
                        className="w-48 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleCreateNode}
                            disabled={!newNodeTitle.trim()}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            Create
                        </button>
                        <button
                            onClick={handleCancelCreate}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const GraphCanvasWithProvider: React.FC<GraphCanvasProps> = (props) => {
    return (
        <ReactFlowProvider>
            <GraphCanvas {...props} />
        </ReactFlowProvider>
    );
};

export default GraphCanvasWithProvider;
