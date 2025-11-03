/**
 * NODE TYPES COMPONENT
 * 
 * Custom node renderer for React Flow with concept-only design.
 * Shows strength ring, due indicator, and artifact count only.
 * No type-based styling as per refactor to nodes as concepts only.
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from '@reactflow/core';
import { BookOpen, Circle } from 'lucide-react';

const CustomNode: React.FC<NodeProps> = ({ data, selected }) => {
    const strength = data.strength || 1.0; // 🔧 Changed: default to 1.0 (beginner level)
    const isDue = data.status === 'due';
    const artifactCount = data.artifactCount || 0;

    // Calculate strength ring properties for 1-5 scale
    const circumference = 2 * Math.PI * 42; // radius = 42 for better proportions
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - ((strength - 1) / 4 * circumference);

    // Get strength color based on 1-5 mastery scale
    const getStrengthColor = (strength: number) => {
        if (strength >= 4.5) return '#10b981'; // green - mastery (4.5-5)
        if (strength >= 3.5) return '#3b82f6'; // blue - advanced (3.5-4.5)
        if (strength >= 2.5) return '#f59e0b'; // yellow - proficient (2.5-3.5)  
        if (strength >= 1.5) return '#ef4444'; // red - developing (1.5-2.5)
        return '#6b7280'; // gray - beginner (1-1.5)
    };

    // Get mastery level text
    const getMasteryLevel = (strength: number) => {
        if (strength >= 4.5) return 'Mastery';
        if (strength >= 3.5) return 'Advanced';
        if (strength >= 2.5) return 'Proficient';
        if (strength >= 1.5) return 'Developing';
        return 'Beginner';
    };

    return (
        <div className={`relative group ${selected ? 'ring-4 ring-blue-400 ring-opacity-60 shadow-lg' : ''}`}>
            {/* Due indicator badge */}
            {isDue && (
                <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full animate-pulse z-30 flex items-center justify-center shadow-lg border-2 border-white">
                    <Circle className="w-2.5 h-2.5 fill-white text-white" />
                </div>
            )}

            {/* Node container with strength ring */}
            <div className="relative w-[180px] h-[180px]">
                {/* Strength ring (SVG background) */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 z-0 transform transition-transform duration-300 group-hover:scale-105" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}>
                    {/* Background circle */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r="42"
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="3"
                    />
                    {/* Strength progress circle */}
                    <circle
                        cx="50%"
                        cy="50%"
                        r="42"
                        fill="none"
                        stroke={getStrengthColor(strength)}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={circumference - ((strength - 1) / 4 * circumference)}
                        className="transition-all duration-500 ease-out"
                        opacity="0.95"
                    />
                </svg>

                {/* Node content */}
                <div className="relative bg-white/95 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 w-[180px] h-[180px] flex items-center justify-center z-15 group-hover:scale-102">
                    <div className="relative p-5 w-full h-full flex flex-col justify-center">
                        {/* Title */}
                        <div className="text-sm font-bold text-gray-900 mb-1 leading-tight text-center truncate">
                            {data.label}
                        </div>

                        {/* Description (if provided) */}
                        {data.description && (
                            <div className="text-xs text-gray-500 mb-2 leading-snug line-clamp-1 text-center px-1">
                                {data.description}
                            </div>
                        )}

                        {/* Mastery Level Display */}
                        <div className="flex flex-col items-center justify-center mb-2 pt-0.5">
                            {/* Strength value badge */}
                            <div className={`relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/90 shadow-sm mb-1.5 border-2 ring-2 ${getStrengthColor(strength) === '#10b981' ? 'ring-emerald-200' : getStrengthColor(strength) === '#3b82f6' ? 'ring-blue-200' : getStrengthColor(strength) === '#f59e0b' ? 'ring-amber-200' : getStrengthColor(strength) === '#ef4444' ? 'ring-red-200' : 'ring-gray-200'}`}>
                                <span className={`text-base font-bold ${getStrengthColor(strength) === '#10b981' ? 'text-emerald-700' : getStrengthColor(strength) === '#3b82f6' ? 'text-blue-700' : getStrengthColor(strength) === '#f59e0b' ? 'text-amber-700' : getStrengthColor(strength) === '#ef4444' ? 'text-red-700' : 'text-gray-700'}`}>
                                    {Math.max(1, Math.min(5, Math.round(strength * 10) / 10)).toFixed(1)}
                                </span>
                                {/* Indicator dot */}
                                <div
                                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: getStrengthColor(strength) }}
                                />
                            </div>

                            {/* Mastery badge */}
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStrengthColor(strength) === '#10b981' ? 'text-emerald-700 bg-emerald-50' : getStrengthColor(strength) === '#3b82f6' ? 'text-blue-700 bg-blue-50' : getStrengthColor(strength) === '#f59e0b' ? 'text-amber-700 bg-amber-50' : getStrengthColor(strength) === '#ef4444' ? 'text-red-700 bg-red-50' : 'text-gray-700 bg-gray-50'} border border-current/20`}>
                                {getMasteryLevel(strength)}
                            </div>
                        </div>

                        {/* Artifact count indicator */}
                        {artifactCount > 0 && (
                            <div className={`flex items-center justify-center space-x-1.5 text-xs ${getStrengthColor(strength) === '#10b981' ? 'text-emerald-600' : getStrengthColor(strength) === '#3b82f6' ? 'text-blue-600' : getStrengthColor(strength) === '#f59e0b' ? 'text-amber-600' : getStrengthColor(strength) === '#ef4444' ? 'text-red-600' : 'text-gray-600'} font-medium pt-1 border-t border-gray-200/50`}>
                                <BookOpen className="w-3 h-3" />
                                <span>{artifactCount} {artifactCount === 1 ? 'item' : 'items'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Connection handles - Miro-style with intuitive cursor (Top and Bottom only) */}
            <Handle
                type="target"
                position={Position.Top}
                className="handle-connection !w-4 !h-4 !bg-white !border-2 !border-gray-400 hover:!border-blue-500 hover:!bg-blue-50 hover:!scale-125 hover:!shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing"
                style={{ top: -7, cursor: 'grab' }}
            />
            <Handle
                type="source"
                position={Position.Bottom}
                className="handle-connection !w-4 !h-4 !bg-white !border-2 !border-gray-400 hover:!border-blue-500 hover:!bg-blue-50 hover:!scale-125 hover:!shadow-lg transition-all duration-200 cursor-grab active:cursor-grabbing"
                style={{ bottom: -7, cursor: 'grab' }}
            />

            {/* Custom styles for handles */}
            <style>{`
                .handle-connection:hover {
                    transform: scale(1.25);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    border-color: rgb(59, 130, 246) !important;
                    background-color: rgb(239, 246, 255) !important;
                }
                .handle-connection:active {
                    cursor: grabbing !important;
                }
                /* Hide default crosshair cursor */
                .react-flow__handle {
                    cursor: grab !important;
                }
                .react-flow__handle:active {
                    cursor: grabbing !important;
                }
                /* Enhance connection line preview */
                .react-flow__connection-line {
                    stroke: rgb(59, 130, 246);
                    stroke-width: 2;
                    stroke-dasharray: 5,5;
                    animation: dashdraw 0.5s linear infinite;
                }
                @keyframes dashdraw {
                    to {
                        stroke-dashoffset: -10;
                    }
                }
            `}</style>
        </div>
    );
};

export default CustomNode;