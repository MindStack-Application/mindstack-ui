/**
 * GRAPH TOOLBAR COMPONENT
 * 
 * Clean icon-only toolbar for graph tools.
 */

import React from 'react';
import {
    Target,
    Plus
} from 'lucide-react';

interface GraphToolbarProps {
    onToolSelect: (tool: string) => void;
    selectedTool: string;
    onCreateNode: (type?: string) => void;
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
            description: 'Select and move nodes around the canvas'
        },
        {
            id: 'node',
            name: 'Node',
            icon: <Plus className="h-5 w-5" />,
            description: 'Add a new node to the graph'
        }
    ];

    const handleToolClick = (toolId: string) => {
        onToolSelect(toolId);

        // If it's the node tool, create a new node
        if (toolId === 'node') {
            onCreateNode();
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
                            w-12 h-12 flex items-center justify-center rounded-lg toolbar-button
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