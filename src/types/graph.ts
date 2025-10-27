/**
 * GRAPH TYPES
 * 
 * TypeScript type definitions for the MindGraph feature.
 */

export interface GraphNode {
    id: number;
    userId: number;
    title: string;
    type: 'concept' | 'skill' | 'topic' | 'resource';
    description?: string;
    strength: number;
    lastVisited?: string;
    dueDate?: string;
    metadata: Record<string, any>;
    position: { x: number; y: number };
    createdAt: string;
    updatedAt: string;
    metric?: NodeMetric;
    reviews?: Review[];
}

export interface GraphEdge {
    id: number;
    userId: number;
    sourceNodeId: number;
    targetNodeId: number;
    relationshipType: 'prerequisite' | 'related' | 'depends_on' | 'leads_to';
    weight: number;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    source?: GraphNode;
    target?: GraphNode;
}

export interface NodeMetric {
    id: number;
    nodeId: number;
    strength: number;
    lastVisited?: string;
    dueDate?: string;
    status: 'due' | 'stale' | 'ok';
    predictedWeakDate?: string;
    updatedAt: string;
}

export interface Review {
    id: number;
    nodeId?: number;
    artifactId?: number;
    when: string;
    rating: number;
    prevStability?: number;
    nextStability?: number;
    nextDue?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    totalNodes: number;
}

export interface CreateNodeData {
    title: string;
    type?: 'concept' | 'skill' | 'topic' | 'resource';
    description?: string;
    position?: { x: number; y: number };
    metadata?: Record<string, any>;
}

export interface UpdateNodeData {
    title?: string;
    type?: 'concept' | 'skill' | 'topic' | 'resource';
    description?: string;
    position?: { x: number; y: number };
    metadata?: Record<string, any>;
}

export interface CreateEdgeData {
    sourceNodeId: number;
    targetNodeId: number;
    relationshipType?: 'prerequisite' | 'related' | 'depends_on' | 'leads_to';
    weight?: number;
    metadata?: Record<string, any>;
}

export interface PostReviewData {
    nodeId: number;
    rating: number;
    artifactId?: number;
}

export interface RevisionQueueOptions {
    horizonDays?: number;
    limit?: number;
}

export interface GraphSettings {
    horizonDays: number;
    threshold: number;
    autoLayout: boolean;
    showGrid: boolean;
    snapToGrid: boolean;
}
