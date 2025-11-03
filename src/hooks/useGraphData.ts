/**
 * GRAPH HOOKS
 * 
 * Custom hooks for managing graph data and metrics.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../utils/apis';
import { formatStrengthDetailed, formatStrengthContextual, hasNodeBeenStudied } from '../utils/strengthUtils';
import type {
    GraphData,
    GraphNode,
    GraphEdge,
    CreateNodeData,
    UpdateNodeData,
    CreateEdgeData,
    PostReviewData,
    RevisionQueueOptions
} from '../types/graph';

/**
 * Hook for managing graph data
 */
export const useGraphData = (graphId?: string | number) => {
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const positionUpdateTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

    const fetchGraphData = useCallback(async () => {
        if (!graphId) {
            setError('No graph ID provided');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getGraph(Number(graphId));
            if (response.success) {
                setGraphData(response.data);
            } else {
                setError('Failed to fetch graph data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [graphId]);

    const createNode = useCallback(async (nodeData: CreateNodeData): Promise<GraphNode | null> => {
        try {
            const response = await apiClient.createNode(nodeData);
            if (response.success) {
                // Optimistic update - add node to local state immediately
                setGraphData(prev => prev ? {
                    ...prev,
                    nodes: [...prev.nodes, response.data]
                } : null);
                return response.data;
            }
            return null;
        } catch (err) {
            console.error('Error creating node:', err);
            // Revert optimistic update on error
            await fetchGraphData();
            return null;
        }
    }, [fetchGraphData]);

    const updateNodePosition = useCallback(async (nodeId: number, position: { x: number; y: number }): Promise<boolean> => {
        // Clear existing timeout for this node
        const existingTimeout = positionUpdateTimeoutRef.current.get(nodeId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Optimistic update - update position in local state immediately
        setGraphData(prev => prev ? {
            ...prev,
            nodes: prev.nodes.map(node =>
                node.id === nodeId ? { ...node, position } : node
            )
        } : null);

        // Debounce the API call
        return new Promise((resolve) => {
            const timeout = setTimeout(async () => {
                try {
                    const response = await apiClient.updateNode(nodeId, { position });
                    if (response.success) {
                        resolve(true);
                    } else {
                        // Revert optimistic update on error
                        await fetchGraphData();
                        resolve(false);
                    }
                } catch (err) {
                    console.error('Error updating node position:', err);
                    // Revert optimistic update on error
                    await fetchGraphData();
                    resolve(false);
                } finally {
                    positionUpdateTimeoutRef.current.delete(nodeId);
                }
            }, 500); // 500ms debounce

            positionUpdateTimeoutRef.current.set(nodeId, timeout);
        });
    }, [fetchGraphData]);

    const updateNode = useCallback(async (nodeId: number, nodeData: UpdateNodeData): Promise<boolean> => {
        try {
            // Optimistic update - update node in local state immediately
            setGraphData(prev => prev ? {
                ...prev,
                nodes: prev.nodes.map(node =>
                    node.id === nodeId ? { ...node, ...nodeData } : node
                )
            } : null);

            const response = await apiClient.updateNode(nodeId, nodeData);
            if (response.success) {
                return true;
            } else {
                // Revert optimistic update on error
                await fetchGraphData();
                return false;
            }
        } catch (err) {
            console.error('Error updating node:', err);
            // Revert optimistic update on error
            await fetchGraphData();
            return false;
        }
    }, [fetchGraphData]);

    const deleteNode = useCallback(async (nodeId: number): Promise<boolean> => {
        try {
            // Optimistic update - remove node from local state immediately
            setGraphData(prev => prev ? {
                ...prev,
                nodes: prev.nodes.filter(node => node.id !== nodeId),
                edges: prev.edges.filter(edge =>
                    edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
                )
            } : null);

            const response = await apiClient.deleteNode(nodeId);
            if (response.success) {
                return true;
            } else {
                // Revert optimistic update on error
                await fetchGraphData();
                return false;
            }
        } catch (err) {
            console.error('Error deleting node:', err);
            // Revert optimistic update on error
            await fetchGraphData();
            return false;
        }
    }, [fetchGraphData]);

    const createEdge = useCallback(async (edgeData: CreateEdgeData): Promise<GraphEdge | null> => {
        try {
            const response = await apiClient.createEdge(edgeData);
            if (response.success) {
                // Optimistic update - add edge to local state immediately
                setGraphData(prev => prev ? {
                    ...prev,
                    edges: [...prev.edges, response.data]
                } : null);
                return response.data;
            }
            return null;
        } catch (err) {
            console.error('Error creating edge:', err);
            // Revert optimistic update on error
            await fetchGraphData();
            return null;
        }
    }, [fetchGraphData]);

    const deleteEdge = useCallback(async (edgeId: number): Promise<boolean> => {
        try {
            // Optimistic update - remove edge from local state immediately
            setGraphData(prev => prev ? {
                ...prev,
                edges: prev.edges.filter(edge => edge.id !== edgeId)
            } : null);

            const response = await apiClient.deleteEdge(edgeId);
            if (response.success) {
                return true;
            } else {
                // Revert optimistic update on error
                await fetchGraphData();
                return false;
            }
        } catch (err) {
            console.error('Error deleting edge:', err);
            // Revert optimistic update on error
            await fetchGraphData();
            return false;
        }
    }, [fetchGraphData]);

    const postReview = useCallback(async (reviewData: PostReviewData): Promise<boolean> => {
        try {
            const response = await apiClient.postReview(reviewData);
            if (response.success) {
                // Only refresh data for reviews as they affect metrics
                await fetchGraphData();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error posting review:', err);
            return false;
        }
    }, [fetchGraphData]);

    const recalculateNodeStrength = useCallback(async (nodeId: number): Promise<boolean> => {
        try {
            const response = await apiClient.recalculateNodeStrength(nodeId);
            if (response.success) {
                // Refresh data to show updated strength
                await fetchGraphData();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error recalculating node strength:', err);
            return false;
        }
    }, [fetchGraphData]);


    useEffect(() => {
        fetchGraphData();
    }, [fetchGraphData]);

    return {
        graphData,
        nodes: graphData?.nodes || [],
        edges: graphData?.edges || [],
        loading,
        error,
        refetch: fetchGraphData,
        createNode,
        updateNode,
        updateNodePosition,
        deleteNode,
        createEdge,
        deleteEdge,
        postReview,
        recalculateNodeStrength
    };
};

/**
 * Hook for managing graph metrics and status
 * Simplified to only handle strength-related functionality
 */
export const useGraphMetrics = (userId?: string) => {
    const [revisionQueue, setRevisionQueue] = useState<GraphNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRevisionQueue = useCallback(async (options?: RevisionQueueOptions) => {
        if (!userId) {
            setError('User ID is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getRevisionQueue(userId, options);
            if (response.success) {
                setRevisionQueue(response.data);
            } else {
                setError('Failed to fetch revision queue');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const getNodeStatus = useCallback((node: GraphNode): 'due' | 'stale' | 'ok' => {
        // Simplified: always return 'ok' since we removed complex metrics
        return 'ok';
    }, []);

    const getNodeStrength = useCallback((node: GraphNode): number => {
        return node.strength || 1.0;
    }, []);

    const getNodeDueDate = useCallback((node: GraphNode): Date | null => {
        // Simplified: return null since we removed due date calculations
        return null;
    }, []);

    const getNodePredictedWeakDate = useCallback((node: GraphNode): Date | null => {
        // Simplified: return null since we removed weak date predictions
        return null;
    }, []);

    const isNodeDue = useCallback((node: GraphNode): boolean => {
        const dueDate = getNodeDueDate(node);
        if (!dueDate) return false;
        return dueDate <= new Date();
    }, [getNodeDueDate]);

    const isNodePredictedWeak = useCallback((node: GraphNode, horizonDays: number = 14): boolean => {
        const predictedWeakDate = getNodePredictedWeakDate(node);
        if (!predictedWeakDate) return false;

        const horizonDate = new Date();
        horizonDate.setDate(horizonDate.getDate() + horizonDays);

        return predictedWeakDate <= horizonDate;
    }, [getNodePredictedWeakDate]);

    const getNodePriority = useCallback((node: GraphNode): number => {
        const status = getNodeStatus(node);
        const strength = getNodeStrength(node);
        const isDue = isNodeDue(node);
        const isPredictedWeak = isNodePredictedWeak(node);

        let priority = 0;

        // Due nodes get highest priority
        if (isDue) priority += 100;

        // Predicted weak nodes get medium priority
        if (isPredictedWeak) priority += 50;

        // Lower strength increases priority
        priority += (1 - strength) * 30;

        // Status-based priority
        if (status === 'due') priority += 20;
        if (status === 'stale') priority += 10;

        return priority;
    }, [getNodeStatus, getNodeStrength, isNodeDue, isNodePredictedWeak]);

    const formatStrength = useCallback((strength: number, node?: any): string => {
        if (node) {
            const hasStudied = hasNodeBeenStudied(node);
            const contextual = formatStrengthContextual(strength, hasStudied);
            return contextual.display;
        }
        return formatStrengthDetailed(strength).percent;
    }, []);

    const getStrengthContextual = useCallback((strength: number, node?: any) => {
        if (node) {
            const hasStudied = hasNodeBeenStudied(node);
            return formatStrengthContextual(strength, hasStudied);
        }
        return {
            display: formatStrengthDetailed(strength).percent,
            colorClass: 'text-gray-700',
            showPercentage: true,
            description: `${Math.round(strength * 100)}% mastery`
        };
    }, []);

    const formatDaysUntilDue = useCallback((dueDate: Date): string => {
        const now = new Date();
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Overdue';
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `Due in ${diffDays} days`;
    }, []);

    const getStatusColor = useCallback((status: 'due' | 'stale' | 'ok'): string => {
        switch (status) {
            case 'due': return 'text-red-600 bg-red-50';
            case 'stale': return 'text-amber-600 bg-amber-50';
            case 'ok': return 'text-green-600 bg-green-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    }, []);

    const getStatusIcon = useCallback((status: 'due' | 'stale' | 'ok'): string => {
        switch (status) {
            case 'due': return '🔴';
            case 'stale': return '🟡';
            case 'ok': return '🟢';
            default: return '⚪';
        }
    }, []);

    return {
        revisionQueue,
        loading,
        error,
        fetchRevisionQueue,
        getNodeStatus,
        getNodeStrength,
        getNodeDueDate,
        getNodePredictedWeakDate,
        isNodeDue,
        isNodePredictedWeak,
        getNodePriority,
        formatStrength,
        getStrengthContextual,
        formatDaysUntilDue,
        getStatusColor,
        getStatusIcon
    };
};
