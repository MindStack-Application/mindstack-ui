/**
 * NODE TYPES COMPONENT
 * 
 * Custom node renderer for React Flow with strength indicators and status.
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from '@reactflow/core';
import { useGraphMetrics } from '../../hooks/useGraphData';

const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
    const { getStatusColor, getStatusIcon, formatStrength } = useGraphMetrics();

    const strength = data.strength || 0.5;
    const status = data.status || 'ok';
    const nodeType = data.type || 'concept';

    // Calculate ring fill based on strength (0-1 to 0-360 degrees)
    const ringFill = strength * 360;

    // Get node type color
    const getTypeColor = (type: string): string => {
        switch (type) {
            case 'concept': return '#3b82f6';
            case 'skill': return '#10b981';
            case 'topic': return '#f59e0b';
            case 'resource': return '#8b5cf6';
            default: return '#6b7280';
        }
    };

    const typeColor = getTypeColor(nodeType);
    const statusColor = getStatusColor(status);
    const statusIcon = getStatusIcon(status);

    return (
        <div className={`relative ${selected ? 'ring-2 ring-blue-500' : ''}`}>
            {/* Status indicator */}
            {status === 'due' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse z-10" />
            )}

            {/* Predicted weak indicator */}
            {status === 'stale' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full z-10" />
            )}

            {/* Node container */}
            <div className="relative bg-white border-2 border-gray-200 rounded-lg shadow-sm min-w-[120px] max-w-[200px]">
                {/* Strength ring */}
                <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="4"
                        />
                        <circle
                            cx="50%"
                            cy="50%"
                            r="45%"
                            fill="none"
                            stroke={typeColor}
                            strokeWidth="4"
                            strokeDasharray={`${ringFill} 360`}
                            className="transition-all duration-300"
                        />
                    </svg>
                </div>

                {/* Node content */}
                <div className="relative p-3">
                    {/* Type indicator */}
                    <div className="flex items-center justify-between mb-2">
                        <div
                            className="px-2 py-1 text-xs font-medium rounded-full text-white"
                            style={{ backgroundColor: typeColor }}
                        >
                            {nodeType}
                        </div>
                        <span className="text-lg">{statusIcon}</span>
                    </div>

                    {/* Title */}
                    <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                        {data.label}
                    </div>

                    {/* Description */}
                    {data.description && (
                        <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {data.description}
                        </div>
                    )}

                    {/* Strength indicator */}
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Strength:</span>
                        <span className="font-medium" style={{ color: typeColor }}>
                            {formatStrength(strength)}
                        </span>
                    </div>
                </div>

                {/* Connection handles */}
                <Handle
                    type="target"
                    position={Position.Top}
                    className="w-3 h-3 bg-gray-400 border-2 border-white"
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="w-3 h-3 bg-gray-400 border-2 border-white"
                />
                <Handle
                    type="target"
                    position={Position.Left}
                    className="w-3 h-3 bg-gray-400 border-2 border-white"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    className="w-3 h-3 bg-gray-400 border-2 border-white"
                />
            </div>
        </div>
    );
};

export default CustomNode;
