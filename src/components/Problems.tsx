import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, Calendar, Flame, Target, Link, AlertCircle } from 'lucide-react';
import ProblemsTable from './ProblemsTable';
import AddProblemFormStepper from './AddProblemFormStepper';
import LinkToGraphSidePanel from './LinkToGraphSidePanel';
import type { Problem, NewProblemForm } from '../types';
import { apiClient } from '../utils/apis';
import { AuthContext } from './AuthContext';

interface ProblemsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Problems: React.FC<ProblemsProps> = ({ activeTab, onTabChange }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    totalProblems: 0,
    weeklySolved: 0,
    currentStreak: 0,
    successRate: 0,
    weeklyChange: 0,
    streakChange: 0,
    rateChange: 0,
  });
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [linkSidePanel, setLinkSidePanel] = useState<{
    isOpen: boolean;
    itemId: number;
    itemTitle: string;
  }>({
    isOpen: false,
    itemId: 0,
    itemTitle: ''
  });
  const { user } = React.useContext(AuthContext);

  const handleAddProblem = (formData: NewProblemForm) => {
    const newProblem: Problem = {
      id: Date.now().toString(),
      title: formData.title,
      platform: formData.platform,
      difficulty: formData.difficulty as 'easy' | 'medium' | 'hard',
      topic: formData.topic,
      subtopic: formData.subtopic,
      timeSpent: formData.timeSpent,
      outcome: formData.outcome as 'solved' | 'hints' | 'failed',
      date: 'Today',
      link: formData.link,
      tags: Array.isArray(formData.tags)
        ? (formData.tags as string[]).map((tag: string) => tag.trim()).join(', ')
        : typeof formData.tags === 'string'
          ? (formData.tags as string)
          : '',
      approachNotes: formData.approachNotes,
      codeLink: formData.codeLink,
      isRevision: formData.isRevision,
    };

    loadProblems(); // Refresh the problems list from backend
    loadAnalytics(); // Refresh analytics data
    setShowAddForm(false);
  };

  const handleOpenLinkPanel = (problemId: number, problemTitle: string) => {
    setLinkSidePanel({
      isOpen: true,
      itemId: problemId,
      itemTitle: problemTitle
    });
  };

  const handleCloseLinkPanel = () => {
    setLinkSidePanel({
      isOpen: false,
      itemId: 0,
      itemTitle: ''
    });
  };

  const handleLinkSuccess = () => {
    // Refresh the problems list to show updated link status
    loadProblems();
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  const loadProblems = async () => {
    if (!user?.id) {
      console.warn('User ID is undefined, cannot fetch problems.');
      return;
    }
    try {
      const fetchedProblems = await apiClient.getProblems(user.id) as { data: Problem[] };
      if (fetchedProblems && fetchedProblems.data) {
        setProblems(fetchedProblems.data);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    }
  }

  const loadAnalytics = async () => {
    if (!user?.id) {
      setIsLoadingAnalytics(false);
      return;
    }
    try {
      setIsLoadingAnalytics(true);
      const response = await apiClient.getAnalytics(user.id) as { success: boolean; data: any };
      if (response.success && response.data?.problemStats) {
        const s = response.data.problemStats;
        setAnalyticsData({
          totalProblems: s.totalProblems || 0,
          weeklySolved: s.weeklySolved || 0,
          currentStreak: s.currentStreak || 0,
          successRate: s.successRate || 0,
          weeklyChange: s.weeklyChange || 0,
          streakChange: s.streakChange || 0,
          rateChange: s.rateChange || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }

  useEffect(() => {
    loadProblems();
    loadAnalytics();
  }, [user?.id]);

  if (activeTab !== 'problems') {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Problems</p>
              {isLoadingAnalytics ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{analyticsData.totalProblems}</p>
              )}
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Solved</p>
              {isLoadingAnalytics ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-green-600">{analyticsData.weeklySolved}</p>
              )}
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Streak</p>
              {isLoadingAnalytics ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-blue-600">{analyticsData.currentStreak}</p>
              )}
            </div>
            <Flame className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              {isLoadingAnalytics ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-purple-600">{analyticsData.successRate}%</p>
              )}
            </div>
            <Target className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <ProblemsTable
        problems={problems}
        onAddProblem={handleShowAddForm}
        onOpenLinkPanel={handleOpenLinkPanel}
      />

      {/* Link to Graph Side Panel */}
      <LinkToGraphSidePanel
        isOpen={linkSidePanel.isOpen}
        onClose={handleCloseLinkPanel}
        itemId={linkSidePanel.itemId}
        itemType="problem"
        itemTitle={linkSidePanel.itemTitle}
        onLinkSuccess={handleLinkSuccess}
      />

      <div>
        {showAddForm ? (
          <AddProblemFormStepper
            onSubmit={handleAddProblem}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-8 text-center">
            <div className="text-gray-400 mb-4">
              <FileText size={48} className="mx-auto" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Log a New Problem</h3>
            <p className="text-xs text-gray-600 mb-4">Track your coding progress by adding problems you've solved</p>
            <button
              onClick={handleShowAddForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              Add Problem
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Problems;
