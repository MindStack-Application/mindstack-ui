import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, BookOpen, Settings, Link2, BarChart3, Target, Eye } from 'lucide-react';
import { useNotification } from './NotificationContext';
import { apiClient } from '../utils/apis';
import { AuthContext } from './AuthContext';
import GraphAndNodeSelector from './GraphAndNodeSelector';
import CreateFirstGraphModal from './CreateFirstGraphModal';

interface AddLearningFormStepperProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

const AddLearningFormStepper: React.FC<AddLearningFormStepperProps> = ({ onSubmit, onCancel }) => {
    const { user } = React.useContext(AuthContext);
    const { showSuccess, showError } = useNotification();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);
    const [showCreateGraphModal, setShowCreateGraphModal] = useState(false);
    const [hasGraphs, setHasGraphs] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        type: 'course' as const,
        category: '',
        subtopic: '',
        timeSpent: 0,
        progress: 0,
        status: 'not-started' as const,
        link: '',
        tags: '',
        notes: '',
        resourceLink: '',
        difficulty: 'beginner' as const,
        platform: '',
        isRevision: true
    });

    const steps = [
        {
            id: 1,
            title: 'Basic Info',
            icon: BookOpen,
            description: 'Essential details about your learning resource'
        },
        {
            id: 2,
            title: 'Learning Details',
            icon: Settings,
            description: 'Additional learning preferences and notes'
        },
        {
            id: 3,
            title: 'Resources & Links',
            icon: Link2,
            description: 'External links and resource references'
        },
        {
            id: 4,
            title: 'Progress & Status',
            icon: BarChart3,
            description: 'Current progress and learning status'
        },
        {
            id: 5,
            title: 'Link to Graph',
            icon: Target,
            description: 'Connect to your knowledge graph'
        },
        {
            id: 6,
            title: 'Review & Submit',
            icon: Eye,
            description: 'Review and finalize your learning item'
        }
    ];

    // Check if user has any graphs
    useEffect(() => {
        const checkForGraphs = async () => {
            try {
                const response = await apiClient.getGraphs();
                setHasGraphs(response.success && response.data && response.data.length > 0);
            } catch (error) {
                console.error('Error checking for graphs:', error);
                setHasGraphs(false);
            }
        };

        checkForGraphs();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                type === 'number' ? Number(value) : value
        }));
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!(formData.title && formData.type && formData.category);
            case 2:
                return true; // All fields in step 2 are optional
            case 3:
                return true; // All fields in step 3 are optional
            case 4:
                return true; // All fields in step 4 are optional
            case 5:
                return hasGraphs && selectedNodeIds.length > 0;
            case 6:
                return validateStep(1) && validateStep(5);
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (currentStep === 5 && !hasGraphs) {
            setShowCreateGraphModal(true);
            return;
        }

        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        } else {
            if (currentStep === 1) {
                showError('Validation Error', 'Please fill in all required fields: Title, Type, and Category');
            } else if (currentStep === 5) {
                showError('Validation Error', 'Please select at least one node to link this learning item');
            }
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(6)) {
            showError('Validation Error', 'Please complete all required fields');
            return;
        }

        setIsSubmitting(true);

        if (user && user.id) {
            try {
                await apiClient.createLearningItem({
                    ...formData,
                    nodeIds: selectedNodeIds
                }, { id: user.id });

                showSuccess(
                    'Learning Item Added Successfully',
                    `"${formData.title}" has been added to your learning tracker and linked to your knowledge graph.`
                );

                onSubmit(formData);
            } catch (error: any) {
                console.error('Error creating learning item:', error);
                let errorMessage = 'There was an error saving your learning item. Please try again.';

                // Show specific error messages for common issues
                if (error.message?.includes('Select a Graph')) {
                    errorMessage = 'Select a Graph and at least one Node';
                } else if (error.message?.includes('HTTP error! status: 401')) {
                    errorMessage = 'Please log in again. Your session may have expired.';
                } else if (error.message?.includes('HTTP error! status: 400')) {
                    errorMessage = 'Please check all required fields and try again.';
                } else if (error.message?.includes('HTTP error! status: 500')) {
                    errorMessage = 'Server error. Please try again later.';
                }

                showError('Failed to Add Learning Item', errorMessage);
                setIsSubmitting(false);
                return;
            }
        }

        setIsSubmitting(false);
    };

    const handleGraphCreated = (graphId: number) => {
        setHasGraphs(true);
        setShowCreateGraphModal(false);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="Enter the learning resource title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type *
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="course">Course</option>
                                <option value="book">Book</option>
                                <option value="tutorial">Tutorial</option>
                                <option value="article">Article</option>
                                <option value="video">Video</option>
                                <option value="podcast">Podcast</option>
                                <option value="workshop">Workshop</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category *
                            </label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Web Development, Data Science"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subtopic
                            </label>
                            <input
                                type="text"
                                name="subtopic"
                                value={formData.subtopic}
                                onChange={handleChange}
                                placeholder="Specific area or subtopic"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Platform
                            </label>
                            <input
                                type="text"
                                name="platform"
                                value={formData.platform}
                                onChange={handleChange}
                                placeholder="e.g., Coursera, YouTube, Medium"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Difficulty Level
                            </label>
                            <select
                                name="difficulty"
                                value={formData.difficulty}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tags
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="e.g., react, javascript, frontend (comma-separated)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Add tags to help organize and search your learning items</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Add any notes, thoughts, or key takeaways..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Primary Link
                            </label>
                            <input
                                type="url"
                                name="link"
                                value={formData.link}
                                onChange={handleChange}
                                placeholder="https://example.com/course"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Main URL for the learning resource</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Additional Resource Link
                            </label>
                            <input
                                type="url"
                                name="resourceLink"
                                value={formData.resourceLink}
                                onChange={handleChange}
                                placeholder="https://example.com/supplementary-material"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Additional resources, materials, or references</p>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="not-started">Not Started</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="paused">Paused</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Progress ({formData.progress}%)
                            </label>
                            <input
                                type="range"
                                name="progress"
                                value={formData.progress}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time Spent (minutes)
                            </label>
                            <input
                                type="number"
                                name="timeSpent"
                                value={formData.timeSpent}
                                onChange={handleChange}
                                min="0"
                                placeholder="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Knowledge Graph</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Link this learning item to relevant nodes in your knowledge graph to track learning relationships and enhance your understanding.
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Graph Nodes *
                            </label>
                            <GraphAndNodeSelector
                                selectedNodeIds={selectedNodeIds}
                                onNodeIdsChange={setSelectedNodeIds}
                                placeholder="Search for nodes to link this learning item..."
                                disabled={isSubmitting}
                            />

                            {selectedNodeIds.length > 0 && (
                                <div className="mt-2 text-sm text-green-600">
                                    ✓ {selectedNodeIds.length} node{selectedNodeIds.length > 1 ? 's' : ''} selected
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Learning Item</h3>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Title:</span>
                                        <p className="text-sm text-gray-900">{formData.title}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Type:</span>
                                        <p className="text-sm text-gray-900 capitalize">{formData.type}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Category:</span>
                                        <p className="text-sm text-gray-900">{formData.category}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Difficulty:</span>
                                        <p className="text-sm text-gray-900 capitalize">{formData.difficulty}</p>
                                    </div>
                                </div>

                                {formData.subtopic && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Subtopic:</span>
                                        <p className="text-sm text-gray-900">{formData.subtopic}</p>
                                    </div>
                                )}

                                {formData.platform && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Platform:</span>
                                        <p className="text-sm text-gray-900">{formData.platform}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Status:</span>
                                        <p className="text-sm text-gray-900 capitalize">{formData.status.replace('-', ' ')}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Progress:</span>
                                        <p className="text-sm text-gray-900">{formData.progress}%</p>
                                    </div>
                                </div>

                                {formData.tags && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Tags:</span>
                                        <p className="text-sm text-gray-900">{formData.tags}</p>
                                    </div>
                                )}

                                {formData.notes && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Notes:</span>
                                        <p className="text-sm text-gray-900">{formData.notes}</p>
                                    </div>
                                )}

                                <div>
                                    <span className="text-sm font-medium text-gray-600">Linked to Graph:</span>
                                    <p className="text-sm text-green-600">✓ {selectedNodeIds.length} node{selectedNodeIds.length > 1 ? 's' : ''} selected</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Add Learning Item</h2>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Step Indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center z-10 bg-white">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${currentStep === step.id
                                    ? 'border-blue-600 bg-blue-600 text-white'
                                    : currentStep > step.id
                                        ? 'border-green-600 bg-green-600 text-white'
                                        : 'border-gray-300 bg-white text-gray-400'
                                    }`}>
                                    {currentStep > step.id ? (
                                        <Check size={16} />
                                    ) : (
                                        <step.icon size={16} />
                                    )}
                                </div>
                                <div className="mt-2 text-center">
                                    <p className={`text-xs font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                        {step.title}
                                    </p>
                                </div>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 transition-colors ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'
                                    }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
                <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{steps[currentStep - 1].title}</h3>
                    <p className="text-sm text-gray-600">{steps[currentStep - 1].description}</p>
                </div>

                <div className="min-h-[400px]">
                    {renderStepContent()}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />
                    Previous
                </button>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>

                    {currentStep < steps.length ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !validateStep(6)}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Learning Item'}
                            <Check size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Create First Graph Modal */}
            <CreateFirstGraphModal
                isOpen={showCreateGraphModal}
                onClose={() => setShowCreateGraphModal(false)}
                onGraphCreated={handleGraphCreated}
            />
        </div>
    );
};

export default AddLearningFormStepper;
