/**
 * CREATE FIRST GRAPH MODAL COMPONENT
 * 
 * Modal shown to first-time users who don't have any graphs yet.
 * Handles AC2 requirement for creating the first graph.
 */

import React, { useState } from 'react';
import { X, Plus, Brain } from 'lucide-react';
import { apiClient } from '../utils/apis';

interface CreateFirstGraphModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGraphCreated: (graphId: number) => void;
}

const CreateFirstGraphModal: React.FC<CreateFirstGraphModalProps> = ({
    isOpen,
    onClose,
    onGraphCreated
}) => {
    const [graphName, setGraphName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!graphName.trim()) {
            setError('Please enter a graph name');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            // Create the graph
            const graphResponse = await apiClient.createGraph({
                name: graphName.trim(),
                description: 'Your first knowledge graph - organize your learning here!',
                color: '#3B82F6'
            });

            if (graphResponse.success) {
                onGraphCreated(graphResponse.data.id);
                setGraphName('');
                onClose();
            } else {
                setError('Failed to create graph. Please try again.');
            }
        } catch (error) {
            console.error('Error creating first graph:', error);
            setError('Failed to create graph. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            setGraphName('');
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Brain className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Create your first Graph
                            </h2>
                            <p className="text-sm text-gray-500">
                                Organize your knowledge
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isCreating}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="p-1 bg-blue-100 rounded-full">
                                    <Plus className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-blue-900 mb-1">
                                        Create your first Graph to organize your knowledge.
                                    </h3>
                                    <p className="text-sm text-blue-700">
                                        This will be the foundation of your learning journey. You can always add more graphs later.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="graphName" className="block text-sm font-medium text-gray-700 mb-2">
                                Graph Name *
                            </label>
                            <input
                                type="text"
                                id="graphName"
                                value={graphName}
                                onChange={(e) => setGraphName(e.target.value)}
                                placeholder="e.g., Computer Science, Mathematics, Programming"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={isCreating}
                                autoFocus
                            />
                            {error && (
                                <p className="mt-1 text-sm text-red-600">{error}</p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isCreating}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isCreating || !graphName.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        Create Graph
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateFirstGraphModal;
