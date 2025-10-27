/**
 * GRAPH TOOLBAR COMPONENT
 * 
 * Clean icon-only toolbar for graph tools.
 */

import React, { useState } from 'react';
import {
    Target,
    Circle,
    Zap,
    BookOpen,
    Square,
    ArrowRight,
    Type,
    StickyNote
} from 'lucide-react';

interface GraphToolbarProps {
    onToolSelect: (tool: string) => void;
    selectedTool: string;
    onCreateNode: (type: string) => void;
}

const GraphToolbar: React.FC<GraphToolbarProps> = ({
    onToolSelect,
    selectedTool,
    onCreateNode
}) => {
    const tools = [
        {
            id: 'select',
            name: 'Select',
            icon: <Target className="h-5 w-5" />,
            description: 'Select and move elements'
        },
        {
            id: 'concept',
            name: 'Concept',
            icon: <Circle className="h-5 w-5" />,
            description: 'Add a concept node'
        },
        {
            id: 'skill',
            name: 'Skill',
            icon: <Zap className="h-5 w-5" />,
            description: 'Add a skill node'
        },
        {
            id: 'topic',
            name: 'Topic',
            icon: <BookOpen className="h-5 w-5" />,
            description: 'Add a topic node'
        },
        {
            id: 'resource',
            name: 'Resource',
            icon: <Square className="h-5 w-5" />,
            description: 'Add a resource node'
        },
        {
            id: 'connection',
            name: 'Connect',
            icon: <ArrowRight className="h-5 w-5" />,
            description: 'Connect nodes'
        },
        {
            id: 'text',
            name: 'Text',
            icon: <Type className="h-5 w-5" />,
            description: 'Add text annotation'
        },
        {
            id: 'note',
            name: 'Note',
            icon: <StickyNote className="h-5 w-5" />,
            description: 'Add a sticky note'
        }
    ];

    const handleToolClick = (toolId: string) => {
        onToolSelect(toolId);

        // If it's a node type, create the node immediately
        if (['concept', 'skill', 'topic', 'resource'].includes(toolId)) {
            onCreateNode(toolId);
        }
    };

    return (
        <div className="w-16 bg-white border-r border-gray-200 flex flex-col">
            {/* Tools */}
            <div className="flex-1 p-2 space-y-2">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => handleToolClick(tool.id)}
                        className={`
                            w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200
                            ${selectedTool === tool.id
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }
                        `}
                        title={tool.description}
                    >
                        {tool.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GraphToolbar;