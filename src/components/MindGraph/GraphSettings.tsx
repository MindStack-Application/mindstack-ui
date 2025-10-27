/**
 * GRAPH SETTINGS COMPONENT
 * 
 * Settings panel for graph configuration.
 */

import React from 'react';
import { X, Settings as SettingsIcon } from 'lucide-react';
import type { GraphSettings } from '../../types';

interface GraphSettingsProps {
    settings: GraphSettings;
    onSettingsChange: (settings: Partial<GraphSettings>) => void;
    onClose: () => void;
}

const GraphSettingsComponent: React.FC<GraphSettingsProps> = ({
    settings,
    onSettingsChange,
    onClose
}) => {
    const handleHorizonDaysChange = (value: number) => {
        onSettingsChange({ horizonDays: value });
    };

    const handleThresholdChange = (value: number) => {
        onSettingsChange({ threshold: value });
    };

    const handleAutoLayoutChange = (value: boolean) => {
        onSettingsChange({ autoLayout: value });
    };

    const handleShowGridChange = (value: boolean) => {
        onSettingsChange({ showGrid: value });
    };

    const handleSnapToGridChange = (value: boolean) => {
        onSettingsChange({ snapToGrid: value });
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <SettingsIcon size={16} className="text-gray-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Graph Settings</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Settings */}
            <div className="space-y-4">
                {/* Horizon Days */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Revision Horizon (days)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="30"
                        value={settings.horizonDays}
                        onChange={(e) => handleHorizonDaysChange(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        How many days ahead to predict weak nodes
                    </p>
                </div>

                {/* Threshold */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weakness Threshold
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.1"
                        value={settings.threshold}
                        onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0.1</span>
                        <span className="font-medium">{settings.threshold}</span>
                        <span>0.9</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Strength below which nodes are considered weak
                    </p>
                </div>

                {/* Auto Layout */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Auto Layout</label>
                        <p className="text-xs text-gray-500">Automatically arrange nodes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.autoLayout}
                            onChange={(e) => handleAutoLayoutChange(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Show Grid */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Show Grid</label>
                        <p className="text-xs text-gray-500">Display background grid</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.showGrid}
                            onChange={(e) => handleShowGridChange(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Snap to Grid */}
                <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Snap to Grid</label>
                        <p className="text-xs text-gray-500">Snap nodes to grid positions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.snapToGrid}
                            onChange={(e) => handleSnapToGridChange(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>

            {/* Reset Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                    onClick={() => {
                        onSettingsChange({
                            horizonDays: 14,
                            threshold: 0.4,
                            autoLayout: false,
                            showGrid: true,
                            snapToGrid: true
                        });
                    }}
                    className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    Reset to Defaults
                </button>
            </div>
        </div>
    );
};

export default GraphSettingsComponent;
