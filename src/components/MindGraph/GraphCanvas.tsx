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
    OnNodeDrag,
    ReactFlowInstance
} from '@reactflow/core';
import 'reactflow/dist/style.css';
import CustomNode from './NodeTypes';
import type { GraphNode, GraphEdge, GraphSettings } from '../../types/graph';

interface GraphCanvasProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    onNodeSelect: (node: GraphNode | null) => void;
    onNodeCreate: (position: { x: number; y: number }, title: string, type?: string) => void;
    onNodeUpdate: (nodeId: number, updates: any) => void;
    updateNodePosition: (nodeId: number, position: { x: number; y: number }) => Promise<boolean>;
    selectedNode: GraphNode | null;
    settings: GraphSettings;
    onCreateNodeAtCenter?: (type?: string) => void;
    createEdge: (edgeData: any) => Promise<GraphEdge | null>;
    deleteEdge: (edgeId: number) => Promise<boolean>;
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
    updateNodePosition,
    selectedNode,
    settings,
    onCreateNodeAtCenter,
    createEdge,
    deleteEdge
}) => {
    const [reactFlowNodes, setNodes, onNodesChange] = useNodesState([]);
    const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const [isCreatingNode, setIsCreatingNode] = useState(false);
    const [newNodeTitle, setNewNodeTitle] = useState('');
    const [newNodePosition, setNewNodePosition] = useState<{ x: number; y: number } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Alignment guides state
    const [alignmentGuides, setAlignmentGuides] = useState<{
        vertical: number | null;
        horizontal: number | null;
    }>({ vertical: null, horizontal: null });

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
                strength: node.strength || 1.0, // Use node's own strength field
                status: 'ok', // Default status since we removed metrics
                artifactCount: node.artifactCount || 0
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
    const createNodeAtCenter = useCallback(async (type?: string) => {
        if (!reactFlowInstance) {
            return;
        }

        const viewport = reactFlowInstance.getViewport();

        const position = {
            x: 400, // Fixed center position
            y: 300
        };

        // Always use "New Node" as the default title, ignore type
        await onNodeCreate(position, 'New Node');
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
        const position = { x: node.position.x, y: node.position.y };
        await updateNodePosition(parseInt(node.id), position);
        // Clear alignment guides when drag stops
        setAlignmentGuides({ vertical: null, horizontal: null });
    }, [updateNodePosition]);

    // Alignment detection on node drag
    const onNodeDrag: OnNodeDrag = useCallback((event, node) => {
        const ALIGNMENT_THRESHOLD = 5; // pixels
        const NODE_WIDTH = 180; // Fixed node width
        const NODE_HEIGHT = 180; // Fixed node height

        // Get all other nodes (excluding the one being dragged)
        const otherNodes = reactFlowNodes.filter(n => n.id !== node.id);

        let verticalGuide: number | null = null;
        let horizontalGuide: number | null = null;
        let snappedX = node.position.x;
        let snappedY = node.position.y;

        // Calculate node edges
        const nodeCenterX = node.position.x + NODE_WIDTH / 2;
        const nodeLeft = node.position.x;
        const nodeRight = node.position.x + NODE_WIDTH;
        const nodeCenterY = node.position.y + NODE_HEIGHT / 2;
        const nodeTop = node.position.y;
        const nodeBottom = node.position.y + NODE_HEIGHT;

        let bestVerticalDiff = Infinity;
        let bestHorizontalDiff = Infinity;

        // Check vertical alignment (X-axis) - find the closest alignment
        for (const otherNode of otherNodes) {
            const otherCenterX = otherNode.position.x + NODE_WIDTH / 2;
            const otherLeft = otherNode.position.x;
            const otherRight = otherNode.position.x + NODE_WIDTH;

            // Check center alignment
            const centerDiff = Math.abs(nodeCenterX - otherCenterX);
            if (centerDiff < ALIGNMENT_THRESHOLD && centerDiff < bestVerticalDiff) {
                bestVerticalDiff = centerDiff;
                verticalGuide = otherCenterX;
                snappedX = otherCenterX - NODE_WIDTH / 2;
            }

            // Check left edge alignment
            const leftDiff = Math.abs(nodeLeft - otherLeft);
            if (leftDiff < ALIGNMENT_THRESHOLD && leftDiff < bestVerticalDiff) {
                bestVerticalDiff = leftDiff;
                verticalGuide = otherLeft;
                snappedX = otherLeft;
            }

            // Check right edge alignment
            const rightDiff = Math.abs(nodeRight - otherRight);
            if (rightDiff < ALIGNMENT_THRESHOLD && rightDiff < bestVerticalDiff) {
                bestVerticalDiff = rightDiff;
                verticalGuide = otherRight;
                snappedX = otherRight - NODE_WIDTH;
            }
        }

        // Check horizontal alignment (Y-axis) - find the closest alignment
        for (const otherNode of otherNodes) {
            const otherCenterY = otherNode.position.y + NODE_HEIGHT / 2;
            const otherTop = otherNode.position.y;
            const otherBottom = otherNode.position.y + NODE_HEIGHT;

            // Check center alignment
            const centerDiff = Math.abs(nodeCenterY - otherCenterY);
            if (centerDiff < ALIGNMENT_THRESHOLD && centerDiff < bestHorizontalDiff) {
                bestHorizontalDiff = centerDiff;
                horizontalGuide = otherCenterY;
                snappedY = otherCenterY - NODE_HEIGHT / 2;
            }

            // Check top edge alignment
            const topDiff = Math.abs(nodeTop - otherTop);
            if (topDiff < ALIGNMENT_THRESHOLD && topDiff < bestHorizontalDiff) {
                bestHorizontalDiff = topDiff;
                horizontalGuide = otherTop;
                snappedY = otherTop;
            }

            // Check bottom edge alignment
            const bottomDiff = Math.abs(nodeBottom - otherBottom);
            if (bottomDiff < ALIGNMENT_THRESHOLD && bottomDiff < bestHorizontalDiff) {
                bestHorizontalDiff = bottomDiff;
                horizontalGuide = otherBottom;
                snappedY = otherBottom - NODE_HEIGHT;
            }
        }

        // Snap node position if alignment found
        if (verticalGuide !== null || horizontalGuide !== null) {
            const finalX = verticalGuide !== null ? snappedX : node.position.x;
            const finalY = horizontalGuide !== null ? snappedY : node.position.y;

            // Only update if position actually changed
            if (Math.abs(finalX - node.position.x) > 0.1 || Math.abs(finalY - node.position.y) > 0.1) {
                setNodes((nds) =>
                    nds.map((n) => {
                        if (n.id === node.id) {
                            return { ...n, position: { x: finalX, y: finalY } };
                        }
                        return n;
                    })
                );
            }
        }

        setAlignmentGuides({ vertical: verticalGuide, horizontal: horizontalGuide });
    }, [reactFlowNodes, setNodes]);

    const onEdgeClick = useCallback(async (event: React.MouseEvent, edge: Edge) => {
        // Delete edge on click
        const success = await deleteEdge(parseInt(edge.id));
        if (success) {
            setEdges(prev => prev.filter(e => e.id !== edge.id));
        }
    }, [deleteEdge, setEdges]);

    return (
        <div className="h-full relative graph-canvas-container">
            {/* Custom styles for improved connection experience */}
            <style>{`
                /* Global handle cursor improvements */
                .react-flow__handle {
                    cursor: grab !important;
                    transition: all 0.2s ease !important;
                }
                .react-flow__handle:hover {
                    cursor: grab !important;
                    transform: scale(1.25);
                }
                .react-flow__handle:active {
                    cursor: grabbing !important;
                }
                
                /* Connection line preview styling */
                .react-flow__connection-line {
                    stroke: rgb(59, 130, 246) !important;
                    stroke-width: 2.5px !important;
                    stroke-dasharray: 5,5 !important;
                    animation: dashdraw 0.5s linear infinite !important;
                    opacity: 0.8;
                }
                
                .react-flow__connection-line.react-flow__connection-path {
                    stroke: rgb(59, 130, 246) !important;
                }
                
                @keyframes dashdraw {
                    to {
                        stroke-dashoffset: -10;
                    }
                }
                
                /* Connection handle hover glow */
                .react-flow__handle:hover {
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2), 0 4px 12px rgba(59, 130, 246, 0.3) !important;
                }
            `}</style>

            <ReactFlow
                nodes={reactFlowNodes}
                edges={reactFlowEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onNodeDrag={onNodeDrag}
                onNodeDragStop={onNodeDragStop}
                onEdgeClick={onEdgeClick}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                fitView={false}
                attributionPosition="bottom-left"
                connectionLineStyle={{ stroke: '#3b82f6', strokeWidth: 2.5, strokeDasharray: '5,5' }}
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

            {/* Alignment Guide Lines - rendered outside ReactFlow for proper positioning */}
            {reactFlowInstance && (alignmentGuides.vertical !== null || alignmentGuides.horizontal !== null) && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 20 }}
                >
                    {alignmentGuides.vertical !== null && (() => {
                        // Project flow coordinates to screen coordinates
                        const screenX = reactFlowInstance.project({ x: alignmentGuides.vertical, y: 0 }).x;
                        return (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: `${screenX}px`,
                                    top: '0px',
                                    bottom: '0px',
                                    width: '2px',
                                    background: '#3b82f6',
                                    opacity: 0.7,
                                    pointerEvents: 'none',
                                    transform: 'translateX(-50%)'
                                }}
                            />
                        );
                    })()}
                    {alignmentGuides.horizontal !== null && (() => {
                        // Project flow coordinates to screen coordinates
                        const screenY = reactFlowInstance.project({ x: 0, y: alignmentGuides.horizontal }).y;
                        return (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: `${screenY}px`,
                                    left: '0px',
                                    right: '0px',
                                    height: '2px',
                                    background: '#3b82f6',
                                    opacity: 0.7,
                                    pointerEvents: 'none',
                                    transform: 'translateY(-50%)'
                                }}
                            />
                        );
                    })()}
                </div>
            )}

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
