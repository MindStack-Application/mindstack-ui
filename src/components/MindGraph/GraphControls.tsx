/**
 * GRAPH CONTROLS COMPONENT
 * 
 * Controls for zoom, fit, and layout operations.
 */

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const GraphControls: React.FC = () => {
    const handleZoomIn = () => {
        // TODO: Implement zoom in
    };

    const handleZoomOut = () => {
        // TODO: Implement zoom out
    };

    const handleFitView = () => {
        // TODO: Implement fit view
    };


    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handleZoomIn}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg toolbar-button"
                title="Zoom in to see details more clearly"
            >
                <ZoomIn size={16} />
            </button>

            <button
                onClick={handleZoomOut}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg toolbar-button"
                title="Zoom out to see more of the graph"
            >
                <ZoomOut size={16} />
            </button>

            <button
                onClick={handleFitView}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg toolbar-button"
                title="Fit the entire graph in the current view"
            >
                <Maximize2 size={16} />
            </button>

        </div>
    );
};

export default GraphControls;
