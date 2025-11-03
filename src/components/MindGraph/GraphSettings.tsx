/**
 * GRAPH SETTINGS COMPONENT
 * 
 * Settings panel for MindGraph revision configuration including presets,
 * jitter settings, and propagation depth controls.
 */

import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../utils/apis';
import type { GraphSettings } from '../../types';

interface GraphSettingsProps {
    onClose: () => void;
}

const GraphSettingsComponent: React.FC<GraphSettingsProps> = ({ onClose }) => {
    const [settings, setSettings] = useState<GraphSettings>({
        preset: 'balanced',
        sMax: 180,
        gFactor: 1.0,
        propagationDepth: 2,
        horizonDays: 14,
        weakThreshold: 0.4,
        jitterEnabled: true,
        showGrid: true,
        snapToGrid: true
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getGraphSettings();
            if (response.success) {
                setSettings(prev => ({
                    ...prev,
                    ...response.data
                }));
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSaving(true);
            setError(null);

            const response = await apiClient.updateGraphSettings({
                preset: settings.preset,
                sMax: settings.sMax,
                gFactor: settings.gFactor,
                propagationDepth: settings.propagationDepth,
                horizonDays: settings.horizonDays,
                weakThreshold: settings.weakThreshold,
                jitterEnabled: settings.jitterEnabled
            });

            if (response.success) {
                // Settings saved successfully
            } else {
                setError(response.message || 'Failed to save settings');
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handlePresetChange = (preset: 'gentle' | 'balanced' | 'intensive') => {
        const presetConfigs = {
            gentle: { sMax: 240, gFactor: 1.1 },
            balanced: { sMax: 180, gFactor: 1.0 },
            intensive: { sMax: 120, gFactor: 0.9 }
        };

        setSettings(prev => ({
            ...prev,
            preset,
            ...presetConfigs[preset]
        }));
    };

    const handleSettingChange = (key: keyof GraphSettings, value: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const resetToDefaults = () => {
        setSettings({
            preset: 'balanced',
            sMax: 180,
            gFactor: 1.0,
            propagationDepth: 2,
            horizonDays: 14,
            weakThreshold: 0.4,
            jitterEnabled: true,
            showGrid: true,
            snapToGrid: true
        });
    };

    if (loading) {
        return (
            <div className="p-4">
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md">
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

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Settings */}
            <div className="space-y-4">
                {/* Preset Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Revision Preset
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['gentle', 'balanced', 'intensive'] as const).map((preset) => (
                            <button
                                key={preset}
                                onClick={() => handlePresetChange(preset)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${settings.preset === preset
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                {preset.charAt(0).toUpperCase() + preset.slice(1)}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {settings.preset === 'gentle' && 'Slower learning, longer intervals (S_max=240, g=1.1)'}
                        {settings.preset === 'balanced' && 'Standard learning pace (S_max=180, g=1.0)'}
                        {settings.preset === 'intensive' && 'Faster learning, shorter intervals (S_max=120, g=0.9)'}
                    </p>
                </div>

                {/* Advanced Settings Toggle */}
                <div className="border-t border-gray-200 pt-4">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                        <span>Advanced Settings</span>
                        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </div>

                {showAdvanced && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-100">
                        {/* S_max */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Maximum Interval (S_max)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={settings.sMax}
                                onChange={(e) => handleSettingChange('sMax', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum days between reviews
                            </p>
                        </div>

                        {/* gFactor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Global Factor (g)
                            </label>
                            <input
                                type="number"
                                min="0.1"
                                max="3.0"
                                step="0.1"
                                value={settings.gFactor}
                                onChange={(e) => handleSettingChange('gFactor', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Global multiplier for interval calculation
                            </p>
                        </div>

                        {/* Propagation Depth */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Propagation Depth
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                value={settings.propagationDepth}
                                onChange={(e) => handleSettingChange('propagationDepth', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                How many levels deep child influence propagates
                            </p>
                        </div>

                        {/* Horizon Days */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Horizon Days
                            </label>
                            <select
                                value={settings.horizonDays}
                                onChange={(e) => handleSettingChange('horizonDays', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={7}>7 days</option>
                                <option value={14}>14 days</option>
                                <option value={30}>30 days</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Days ahead to look for revision queue
                            </p>
                        </div>

                        {/* Weak Threshold */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Weak Threshold
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.1"
                                value={settings.weakThreshold}
                                onChange={(e) => handleSettingChange('weakThreshold', parseFloat(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0.1</span>
                                <span className="font-medium">{settings.weakThreshold}</span>
                                <span>0.9</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Strength below which nodes are considered weak
                            </p>
                        </div>

                        {/* Jitter Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Jitter</label>
                                <p className="text-xs text-gray-500">Add ±10% randomness to intervals</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.jitterEnabled}
                                    onChange={(e) => handleSettingChange('jitterEnabled', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>

                <button
                    onClick={resetToDefaults}
                    className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    Reset to Defaults
                </button>
            </div>
        </div>
    );
};

export default GraphSettingsComponent;