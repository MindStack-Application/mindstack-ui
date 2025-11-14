import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, FileText, Settings, Target, Clock, Link2, Eye, CheckCircle, AlertCircle, XCircle, Zap } from 'lucide-react';
import { useNotification } from './NotificationContext';
import { apiClient } from '../utils/apis';
import { AuthContext } from './AuthContext';
import GraphAndNodeSelector from './GraphAndNodeSelector';
import CreateFirstGraphModal from './CreateFirstGraphModal';
import type { NewProblemForm } from '../types';

interface AddProblemFormStepperProps {
    onSubmit: (data: NewProblemForm) => void;
    onCancel: () => void;
    initialData?: NewProblemForm;
}

const AddProblemFormStepper: React.FC<AddProblemFormStepperProps> = ({ onSubmit, onCancel, initialData }) => {
    const { user } = React.useContext(AuthContext);
    const { showSuccess, showError } = useNotification();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedNodeIds, setSelectedNodeIds] = useState<number[]>([]);
    const [showCreateGraphModal, setShowCreateGraphModal] = useState(false);
    const [hasGraphs, setHasGraphs] = useState(true);
    const [isValidTitle, setIsValidTitle] = useState(true);

    const [formData, setFormData] = useState<NewProblemForm>(initialData || {
        title: '',
        platform: '',
        difficulty: '',
        topic: '',
        subtopic: '',
        outcome: '',
        timeSpent: 0,
        link: '',
        tags: [],
        approachNotes: '',
        isRevision: true,
        codeLink: '',
    });

    // If initialData changes (when opening modal), update formData
    useEffect(() => {
        if (initialData) setFormData(initialData);
    }, [initialData]);

    // Smart selection data
    const platforms = ['LeetCode', 'HackerRank', 'CodeChef', 'Codeforces', 'AtCoder', 'InterviewBit'];
    const difficulties = [
        { value: 'easy', label: 'Easy', color: 'text-green-600', icon: CheckCircle },
        { value: 'medium', label: 'Medium', color: 'text-yellow-600', icon: AlertCircle },
        { value: 'hard', label: 'Hard', color: 'text-red-600', icon: XCircle }
    ];
    const topics = [
        'Arrays', 'Strings', 'Hash Table', 'Dynamic Programming', 'Tree', 'Graph',
        'Binary Search', 'Two Pointers', 'Sliding Window', 'Stack', 'Queue', 'Heap'
    ];
    const outcomes = [
        { value: 'solved', label: 'Solved', color: 'text-green-600', icon: CheckCircle },
        { value: 'hints', label: 'With Hints', color: 'text-yellow-600', icon: AlertCircle },
        { value: 'failed', label: 'Failed', color: 'text-red-600', icon: XCircle }
    ];
    const quickTimes = [5, 10, 15, 30, 45, 60, 90, 120];

    const steps = [
        {
            id: 1,
            title: 'Basic Info',
            icon: FileText,
            description: 'Problem title, platform, and difficulty'
        },
        {
            id: 2,
            title: 'Topic & Category',
            icon: Settings,
            description: 'Subject area and specific topics covered'
        },
        {
            id: 3,
            title: 'Solution Details',
            icon: Clock,
            description: 'Outcome and time spent solving'
        },
        {
            id: 4,
            title: 'Additional Details',
            icon: Link2,
            description: 'Links, tags, and approach notes'
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
            description: 'Review and finalize your problem entry'
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

    const validTitleRegex = /^[a-zA-Z0-9\s\-_,\.;:()]+$/;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name === 'title') {
            if (value && !validTitleRegex.test(value)) {
                setIsValidTitle(false);
            } else {
                setIsValidTitle(true);
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                type === 'number' ? Number(value) : value
        }));
    };


    // Smart selection handlers
    const handlePlatformSelect = (platform: string) => {
        setFormData(prev => ({ ...prev, platform }));
    };

    const handleDifficultySelect = (difficulty: 'easy' | 'medium' | 'hard') => {
        setFormData(prev => ({ ...prev, difficulty }));
    };

    const handleTopicSelect = (topic: string) => {
        setFormData(prev => ({ ...prev, topic }));
    };

    const handleOutcomeSelect = (outcome: 'solved' | 'hints' | 'failed') => {
        setFormData(prev => ({ ...prev, outcome }));
    };

    const handleQuickTimeSelect = (time: number) => {
        setFormData(prev => ({ ...prev, timeSpent: time }));
    };

    // Quick fill for common scenarios
    const quickFill = (scenario: string) => {
        switch (scenario) {
            case 'leetcode-easy':
                setFormData(prev => ({ ...prev, platform: 'LeetCode', difficulty: 'easy', outcome: 'solved', timeSpent: 15 }));
                break;
            case 'leetcode-medium':
                setFormData(prev => ({ ...prev, platform: 'LeetCode', difficulty: 'medium', outcome: 'solved', timeSpent: 30 }));
                break;
            case 'leetcode-hard':
                setFormData(prev => ({ ...prev, platform: 'LeetCode', difficulty: 'hard', outcome: 'hints', timeSpent: 60 }));
                break;
        }
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return !!(formData.title && isValidTitle && formData.platform && formData.difficulty);
            case 2:
                return !!(formData.topic);
            case 3:
                return !!(formData.outcome && formData.timeSpent > 0);
            case 4:
                return true; // All fields in step 4 are optional
            case 5:
                return hasGraphs && selectedNodeIds.length > 0;
            case 6:
                return validateStep(1) && validateStep(2) && validateStep(3) && validateStep(5);
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
                showError('Validation Error', 'Please fill in all required fields: Title, Platform, and Difficulty');
            } else if (currentStep === 2) {
                showError('Validation Error', 'Please select a topic');
            } else if (currentStep === 3) {
                showError('Validation Error', 'Please select an outcome and enter time spent');
            } else if (currentStep === 5) {
                showError('Validation Error', 'Please select at least one node to link this problem');
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
                // Create problem using API client with graph linking
                await apiClient.createProblem({
                    ...formData,
                    nodeIds: selectedNodeIds
                }, { id: user.id });

                // Show success notification
                showSuccess(
                    'Problem Added Successfully',
                    `"${formData.title}" has been logged to your problem tracker and linked to your knowledge graph.`
                );

                onSubmit(formData);
            } catch (error: any) {
                console.error('Error creating problem:', error);
                const errorMessage = error.message?.includes('Select a Graph')
                    ? 'Select a Graph and at least one Node'
                    : 'There was an error saving your problem. Please try again.';
                showError('Failed to Add Problem', errorMessage);
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
                        {/* Quick Fill Actions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={16} className="text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Quick Fill Options</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => quickFill('leetcode-easy')}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                                >
                                    <CheckCircle size={16} className="text-green-600" />
                                    LeetCode Easy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => quickFill('leetcode-medium')}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
                                >
                                    <AlertCircle size={16} className="text-yellow-600" />
                                    LeetCode Medium
                                </button>
                                <button
                                    type="button"
                                    onClick={() => quickFill('leetcode-hard')}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                                >
                                    <XCircle size={16} className="text-red-600" />
                                    LeetCode Hard
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${!isValidTitle ? 'text-red-600' : 'text-gray-700'}`}>
                                Problem Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g., Two Sum"
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!isValidTitle ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                            />
                            {!isValidTitle && (
                                <p className="text-sm text-red-600 mt-1">Please use only letters, numbers, spaces, and basic punctuation</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Platform *</label>
                            <div className="flex flex-wrap gap-2">
                                {platforms.map((platform) => (
                                    <button
                                        key={platform}
                                        type="button"
                                        onClick={() => handlePlatformSelect(platform)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${formData.platform === platform
                                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {platform}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty *</label>
                            <div className="flex gap-3">
                                {difficulties.map((diff) => {
                                    const IconComponent = diff.icon;
                                    return (
                                        <button
                                            key={diff.value}
                                            type="button"
                                            onClick={() => handleDifficultySelect(diff.value as 'easy' | 'medium' | 'hard')}
                                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${formData.difficulty === diff.value
                                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <IconComponent size={20} className={formData.difficulty === diff.value ? diff.color : 'text-gray-500'} />
                                            {diff.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Topic *</label>
                            <div className="flex flex-wrap gap-2">
                                {topics.map((topic) => (
                                    <button
                                        key={topic}
                                        type="button"
                                        onClick={() => handleTopicSelect(topic)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${formData.topic === topic
                                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sub-topic (Optional)
                            </label>
                            <input
                                type="text"
                                name="subtopic"
                                value={formData.subtopic}
                                onChange={handleChange}
                                placeholder="e.g., Sliding Window, Two Pointers"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Specify a more detailed area within the topic</p>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Outcome *</label>
                            <div className="flex gap-3">
                                {outcomes.map((outcome) => {
                                    const IconComponent = outcome.icon;
                                    return (
                                        <button
                                            key={outcome.value}
                                            type="button"
                                            onClick={() => handleOutcomeSelect(outcome.value as 'solved' | 'hints' | 'failed')}
                                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${formData.outcome === outcome.value
                                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            <IconComponent size={20} className={formData.outcome === outcome.value ? outcome.color : 'text-gray-500'} />
                                            {outcome.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time Taken (minutes) *</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {quickTimes.map((time) => (
                                    <button
                                        key={time}
                                        type="button"
                                        onClick={() => handleQuickTimeSelect(time)}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${formData.timeSpent === time
                                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {time}m
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                name="timeSpent"
                                value={formData.timeSpent || ''}
                                onChange={handleChange}
                                placeholder="Enter custom time"
                                min="1"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Problem Link
                            </label>
                            <input
                                type="url"
                                name="link"
                                value={formData.link}
                                onChange={handleChange}
                                placeholder="https://leetcode.com/problems/..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tags/Keywords
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="two pointers, binary search, recursion"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Approach Notes
                            </label>
                            <textarea
                                name="approachNotes"
                                value={formData.approachNotes}
                                onChange={handleChange}
                                placeholder="Describe your approach, edge cases, time/space complexity..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Solution Link
                            </label>
                            <input
                                type="url"
                                name="codeLink"
                                value={formData.codeLink}
                                onChange={handleChange}
                                placeholder="GitHub Gist URL"
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
                                Link this problem to relevant nodes in your knowledge graph to track learning relationships and enhance your understanding.
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Graph Nodes *
                            </label>
                            <GraphAndNodeSelector
                                selectedNodeIds={selectedNodeIds}
                                onNodeIdsChange={setSelectedNodeIds}
                                placeholder="Search for nodes to link this problem..."
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
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Problem Entry</h3>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Title:</span>
                                        <p className="text-sm text-gray-900">{formData.title}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Platform:</span>
                                        <p className="text-sm text-gray-900">{formData.platform}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Difficulty:</span>
                                        <p className="text-sm text-gray-900 capitalize">{formData.difficulty}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Topic:</span>
                                        <p className="text-sm text-gray-900">{formData.topic}</p>
                                    </div>
                                </div>

                                {formData.subtopic && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Subtopic:</span>
                                        <p className="text-sm text-gray-900">{formData.subtopic}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Outcome:</span>
                                        <p className="text-sm text-gray-900 capitalize">{formData.outcome}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Time Spent:</span>
                                        <p className="text-sm text-gray-900">{formData.timeSpent} minutes</p>
                                    </div>
                                </div>

                                {formData.tags && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Tags:</span>
                                        <p className="text-sm text-gray-900">{formData.tags}</p>
                                    </div>
                                )}

                                {formData.approachNotes && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Approach Notes:</span>
                                        <p className="text-sm text-gray-900 font-mono bg-white p-2 rounded border">{formData.approachNotes}</p>
                                    </div>
                                )}

                                {formData.link && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Problem Link:</span>
                                        <p className="text-sm text-blue-600 hover:text-blue-800">
                                            <a href={formData.link} target="_blank" rel="noopener noreferrer">{formData.link}</a>
                                        </p>
                                    </div>
                                )}

                                {formData.codeLink && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-600">Solution Link:</span>
                                        <p className="text-sm text-blue-600 hover:text-blue-800">
                                            <a href={formData.codeLink} target="_blank" rel="noopener noreferrer">{formData.codeLink}</a>
                                        </p>
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
                <h2 className="text-xl font-semibold text-gray-900">Add Problem</h2>
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
                            {isSubmitting ? 'Adding...' : 'Add Problem'}
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

export default AddProblemFormStepper;
