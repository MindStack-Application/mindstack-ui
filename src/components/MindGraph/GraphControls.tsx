/**
 * GRAPH CONTROLS COMPONENT
 * 
 * Controls for zoom, fit, and layout operations.
 */

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

const GraphControls: React.FC = () => {
    const handleZoomIn = () => {
        // TODO: Implement zoom in
        console.log('Zoom in');
    };

    const handleZoomOut = () => {
        // TODO: Implement zoom out
        console.log('Zoom out');
    };

    const handleFitView = () => {
        // TODO: Implement fit view
        console.log('Fit view');
    };

    const handleAutoLayout = () => {
        // TODO: Implement auto layout
        console.log('Auto layout');
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom In"
            >
                <ZoomIn size={16} />
            </button>

            <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Zoom Out"
            >
                <ZoomOut size={16} />
            </button>

            <button
                onClick={handleFitView}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fit View"
            >
                <Maximize2 size={16} />
            </button>

            <button
                onClick={handleAutoLayout}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Auto Layout"
            >
                <RotateCcw size={16} />
            </button>
        </div>
    );
};

export default GraphControls;
