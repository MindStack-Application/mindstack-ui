/**
 * LINK TO GRAPH SIDE PANEL COMPONENT
 * 
 * A side panel for linking existing Problems and Learning Items to Graph Nodes.
 * Handles AC5 requirement for quick-linking existing items.
 */

import React, { useState, useEffect } from 'react';
import { X, Link, Check, AlertCircle } from 'lucide-react';
import { apiClient } from '../utils/apis';
import GraphSelector from './GraphSelector';
import type { GraphNode } from '../types/graph';

interface LinkToGraphSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: number;
    itemType: 'problem' | 'learning';
    itemTitle: string;
    onLinkSuccess?: () => void;
}

interface ItemLink {
    id: number;
    nodeId: number;
    linkStrength: number;
    node: GraphNode;
}

const LinkToGraphSidePanel: React.FC<LinkToGraphSidePanelProps> = ({
    isOpen,
    onClose,
    itemId,
    itemType,
    itemTitle,
    onLinkSuccess
}) => {
    const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);
    const [existingLinks, setExistingLinks] = useState<ItemLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Load existing links when panel opens
    useEffect(() => {
        if (isOpen) {
            loadExistingLinks();
        }
    }, [isOpen, itemId, itemType]);

    const loadExistingLinks = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.getItemLinks(itemType, itemId);
            if (response.success) {
                setExistingLinks(response.data || []);
                setSelectedNodeIds(response.data?.map((link: ItemLink) => link.nodeId) || []);
            }
        } catch (error) {
            console.error('Error loading existing links:', error);
            setError('Failed to load existing links');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (selectedNodeIds.length === 0) {
            setError('Select at least one node to link');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Remove existing links that are no longer selected
            const linksToRemove = existingLinks.filter(link =>
                !selectedNodeIds.includes(link.nodeId)
            );

            for (const link of linksToRemove) {
                await apiClient.deleteItemLink(itemType, itemId, link.nodeId);
            }

            // Add new links
            const newNodeIds = selectedNodeIds.filter(nodeId =>
                !existingLinks.some(link => link.nodeId === nodeId)
            );

            if (newNodeIds.length > 0) {
                await apiClient.createItemLinks(itemId, itemType, newNodeIds);
            }

            // Reload links to get updated data
            await loadExistingLinks();

            if (onLinkSuccess) {
                onLinkSuccess();
            }

            onClose();
        } catch (error: any) {
            console.error('Error saving links:', error);
            setError(error.message || 'Failed to save links');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (!saving) {
            setSelectedNodeIds([]);
            setExistingLinks([]);
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
            <div className="bg-white h-full w-full max-w-md shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Link className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Link to Graph
                            </h2>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                {itemTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={saving}
                        className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Current Links */}
                            {existingLinks.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                                        Currently Linked ({existingLinks.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {existingLinks.map((link) => (
                                            <div
                                                key={link.id}
                                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                            >
                                                <div>
                                                    <div className="font-medium text-green-900">
                                                        {link.node.title}
                                                    </div>
                                                    <div className="text-xs text-green-700">
                                                        Node #{link.node.id}
                                                    </div>
                                                </div>
                                                <Check size={16} className="text-green-600" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Link Selector */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">
                                    {existingLinks.length > 0 ? 'Add More Links' : 'Select Nodes to Link'}
                                </h3>
                                <GraphSelector
                                    selectedNodeIds={selectedNodeIds}
                                    onNodeIdsChange={setSelectedNodeIds}
                                    placeholder="Search for nodes to link..."
                                    disabled={saving}
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle size={16} className="text-red-600" />
                                    <span className="text-sm text-red-700">{error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={saving}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || selectedNodeIds.length === 0}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Link size={16} />
                                    Save Links
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkToGraphSidePanel;
