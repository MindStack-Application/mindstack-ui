/**
 * GRAPH HOOKS
 * 
 * Custom hooks for managing graph data and metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/apis';
import type {
    GraphData,
    GraphNode,
    GraphEdge,
    CreateNodeData,
    UpdateNodeData,
    CreateEdgeData,
    PostReviewData,
    RevisionQueueOptions
} from '../types';

/**
 * Hook for managing graph data
 */
export const useGraphData = () => {
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGraphData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getGraph();
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
    }, []);

    const createNode = useCallback(async (nodeData: CreateNodeData): Promise<GraphNode | null> => {
        try {
            const response = await apiClient.createNode(nodeData);
            if (response.success) {
                await fetchGraphData(); // Refresh data
                return response.data;
            }
            return null;
        } catch (err) {
            console.error('Error creating node:', err);
            return null;
        }
    }, [fetchGraphData]);

    const updateNode = useCallback(async (nodeId: number, nodeData: UpdateNodeData): Promise<boolean> => {
        try {
            const response = await apiClient.updateNode(nodeId, nodeData);
            if (response.success) {
                await fetchGraphData(); // Refresh data
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error updating node:', err);
            return false;
        }
    }, [fetchGraphData]);

    const deleteNode = useCallback(async (nodeId: number): Promise<boolean> => {
        try {
            const response = await apiClient.deleteNode(nodeId);
            if (response.success) {
                await fetchGraphData(); // Refresh data
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error deleting node:', err);
            return false;
        }
    }, [fetchGraphData]);

    const createEdge = useCallback(async (edgeData: CreateEdgeData): Promise<GraphEdge | null> => {
        try {
            const response = await apiClient.createEdge(edgeData);
            if (response.success) {
                await fetchGraphData(); // Refresh data
                return response.data;
            }
            return null;
        } catch (err) {
            console.error('Error creating edge:', err);
            return null;
        }
    }, [fetchGraphData]);

    const deleteEdge = useCallback(async (edgeId: number): Promise<boolean> => {
        try {
            const response = await apiClient.deleteEdge(edgeId);
            if (response.success) {
                await fetchGraphData(); // Refresh data
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error deleting edge:', err);
            return false;
        }
    }, [fetchGraphData]);

    const postReview = useCallback(async (reviewData: PostReviewData): Promise<boolean> => {
        try {
            const response = await apiClient.postReview(reviewData);
            if (response.success) {
                await fetchGraphData(); // Refresh data
                return true;
            }
            return false;
        } catch (err) {
            console.error('Error posting review:', err);
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
        deleteNode,
        createEdge,
        deleteEdge,
        postReview
    };
};

/**
 * Hook for managing graph metrics and status
 */
export const useGraphMetrics = () => {
    const [revisionQueue, setRevisionQueue] = useState<GraphNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRevisionQueue = useCallback(async (options?: RevisionQueueOptions) => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.getRevisionQueue(options);
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
    }, []);

    const getNodeStatus = useCallback((node: GraphNode): 'due' | 'stale' | 'ok' => {
        if (!node.metric) return 'ok';
        return node.metric.status;
    }, []);

    const getNodeStrength = useCallback((node: GraphNode): number => {
        return node.metric?.strength || 0.5;
    }, []);

    const getNodeDueDate = useCallback((node: GraphNode): Date | null => {
        if (!node.metric?.dueDate) return null;
        return new Date(node.metric.dueDate);
    }, []);

    const getNodePredictedWeakDate = useCallback((node: GraphNode): Date | null => {
        if (!node.metric?.predictedWeakDate) return null;
        return new Date(node.metric.predictedWeakDate);
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

    const formatStrength = useCallback((strength: number): string => {
        return `${Math.round(strength * 100)}%`;
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
        formatDaysUntilDue,
        getStatusColor,
        getStatusIcon
    };
};
