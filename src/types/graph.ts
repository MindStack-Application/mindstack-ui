/**
 * GRAPH TYPES
 * 
 * TypeScript type definitions for the MindGraph feature.
 */

export interface Graph {
    id: number;
    userId: number;
    name: string;
    description?: string;
    color: string;
    isDefault: boolean;
    metadata: Record<string, any>;
    createdAt: string;
    updatedAt: string;
    // Computed fields
    nodeCount?: number;
    edgeCount?: number;
    lastModified?: string;
}

export interface CreateGraphData {
    name: string;
    description?: string;
    color?: string;
}

export interface GraphNode {
    id: number;
    userId: number;
    graphId: number;
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
    reviews?: Review[];
}

export interface GraphEdge {
    id: number;
    userId: number;
    graphId: number;
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
    graphId?: number;
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
    // Revision settings
    preset: 'gentle' | 'balanced' | 'intensive';
    sMax: number;
    gFactor: number;
    propagationDepth: number;
    horizonDays: number;
    weakThreshold: number;
    jitterEnabled: boolean;

    // UI settings (existing)
    showGrid: boolean;
    snapToGrid: boolean;
}
