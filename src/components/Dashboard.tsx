import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import RecentActivity from './RecentActivity';
import Problems from './Problems';
import Learning from './Learning';
import Revision from './Revision';
import Roadmaps from './Roadmaps';
import AdvancedAnalytics from './AdvancedAnalytics';
import MindGraph from './MindGraph';
import TodaysAssignments from './TodaysAssignments';
import UploadProblems from './UploadProblems';
import type { Problem, LearningItem, RevisionItem, Roadmap } from '../types';
import { apiClient } from '../utils/apis';
import { AuthContext } from './AuthContext';
import { useFeatureFlag } from './FeatureFlagsContext';
import { Rocket } from 'lucide-react';
import ImportedProblemsPage from '../pages/ImportedProblemsPage';

export const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [problems, setProblems] = useState<Problem[]>([]);
    const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
    const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([]);
    const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
    const [stats, setStats] = useState({ totalProblems: 0, weeklySolved: 0, currentStreak: 0, successRate: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const { user } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const isRoadmapsEnabled = useFeatureFlag('roadmaps');

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;
            try {
                setLoadingStats(true);
                const probs = await apiClient.getProblems(user.id) as { success: boolean; data: Problem[] };
                if (probs.success) setProblems(probs.data);
                const learningResp = await apiClient.getLearningItems(user.id) as { success: boolean; data: LearningItem[] };
                if (learningResp.success) setLearningItems(learningResp.data);
                const revisionResp = await apiClient.getRevisionItems(user.id) as { success: boolean; data: RevisionItem[] };
                if (revisionResp.success) setRevisionItems(revisionResp.data);
                const roadmapsResp = await apiClient.getRoadmaps(user.id) as { success: boolean; data: Roadmap[] };
                if (roadmapsResp.success) setRoadmaps(roadmapsResp.data);
                const analytics = await apiClient.getAnalytics(user.id) as { success: boolean; data: any };
                if (analytics.success && analytics.data?.problemStats) {
                    const ps = analytics.data.problemStats;
                    setStats({
                        totalProblems: ps.totalProblems || 0,
                        weeklySolved: ps.weeklySolved || 0,
                        currentStreak: ps.currentStreak || 0,
                        successRate: ps.successRate || 0
                    });
                }
            } catch (e) {
                console.error('Dashboard load error:', e);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchData();
    }, [user?.id]);

    const handleSettingsClick = () => {
        navigate('/settings');
    };

    const handleTabChange = (tab: string) => {
        // If trying to access roadmaps when disabled, redirect to dashboard
        if (tab === 'roadmaps' && !isRoadmapsEnabled) {
            setActiveTab('dashboard');
            return;
        }
        setActiveTab(tab);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                <Header activeTab={activeTab} onTabChange={handleTabChange} onSettingsClick={handleSettingsClick} />

                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Welcome Section */}
                        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl shadow-2xl border border-blue-500 p-8 relative overflow-hidden min-h-[200px]">
                            {/* Decorative background overlay */}
                            <div className="absolute inset-0 opacity-10">
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4), transparent 60%), radial-gradient(circle at 75% 70%, rgba(255,255,255,0.3), transparent 65%)'
                                    }}
                                />
                            </div>
                            {/* Foreground content */}
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                                <div className="space-y-3 max-w-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
                                            <Rocket className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-white">
                                            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
                                        </h2>
                                    </div>
                                    <p className="text-blue-100 text-sm md:text-base leading-relaxed">
                                        Track your progress, strengthen your streak, and keep pushing forward. Every solved problem builds momentum.
                                    </p>
                                </div>
                                {/* Inline stats summary */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                                    {[
                                        { label: 'Total', value: stats.totalProblems, color: 'bg-blue-500' },
                                        { label: 'Weekly', value: stats.weeklySolved, color: 'bg-green-500' },
                                        { label: 'Streak', value: stats.currentStreak, color: 'bg-amber-500' },
                                        { label: 'Success', value: stats.successRate + '%', color: 'bg-violet-500' }
                                    ].map((s, i) => (
                                        <div key={i} className="rounded-lg bg-white/10 backdrop-blur px-3 py-3 flex flex-col items-center justify-center">
                                            <div className={`text-xs font-medium uppercase tracking-wide text-blue-100`}>{s.label}</div>
                                            <div className="text-lg font-semibold text-white mt-1">
                                                {loadingStats ? '…' : s.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Dashboard Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Recent Activity - Takes 2 columns */}
                            <div className="lg:col-span-2">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <RecentActivity
                                        problems={problems}
                                        learningItems={learningItems}
                                        revisionItems={revisionItems}
                                        roadmaps={roadmaps}
                                        onAddProblem={() => setActiveTab('problems')}
                                    />
                                </div>
                            </div>

                            {/* Side Panel - Takes 1 column */}
                            <div className="space-y-6">
                                {/* Quick Stats */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                                        <h3 className="text-base font-semibold text-gray-900">Quick Stats</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 gap-6">
                                            {[
                                                { label: 'Total Problems', value: stats.totalProblems, subtitle: 'All time', color: '#3B82F6' },
                                                { label: 'Weekly Solved', value: stats.weeklySolved, subtitle: 'Last 7 days', color: '#10B981' },
                                                { label: 'Current Streak', value: stats.currentStreak, subtitle: 'Days in a row', color: '#F59E0B' },
                                                { label: 'Success Rate', value: stats.successRate + '%', subtitle: 'Solved vs total', color: '#8B5CF6' }
                                            ].map((c, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative w-16 h-16">
                                                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                                                <circle cx="18" cy="18" r="16" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                                                                <circle cx="18" cy="18" r="16" stroke={c.color} strokeWidth="4" fill="none" strokeDasharray="100 100" />
                                                            </svg>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-sm font-bold" style={{ color: c.color }}>{loadingStats ? '…' : c.value}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{c.label}</p>
                                                            <p className="text-xs text-gray-600">{c.subtitle}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                                        <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            <TodaysAssignments />
                                            <UploadProblems />
                                            <button
                                                onClick={() => setActiveTab('problems')}
                                                className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                            >
                                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                    <span className="text-white text-sm">📝</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">Add Problem</div>
                                                    <div className="text-sm text-gray-600">Log a new coding problem</div>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => setActiveTab('learning')}
                                                className="w-full flex items-center gap-3 p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                            >
                                                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                                    <span className="text-white text-sm">📚</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">Start Learning</div>
                                                    <div className="text-sm text-gray-600">Continue your studies</div>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => setActiveTab('revision')}
                                                className="w-full flex items-center gap-3 p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                            >
                                                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                                    <span className="text-white text-sm">🔄</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">Review Notes</div>
                                                    <div className="text-sm text-gray-600">Revise previous topics</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Achievements */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                                        <h3 className="text-base font-semibold text-gray-900">Recent Achievements</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg">
                                                <span className="text-2xl">🎯</span>
                                                <div>
                                                    <div className="font-medium text-gray-900 text-sm">Accuracy Master</div>
                                                    <div className="text-xs text-gray-600">85% success rate achieved</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                                                <span className="text-2xl">⚡</span>
                                                <div>
                                                    <div className="font-medium text-gray-900 text-sm">Speed Demon</div>
                                                    <div className="text-xs text-gray-600">Solved problems in record time</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                                                <span className="text-2xl">🧠</span>
                                                <div>
                                                    <div className="font-medium text-gray-900 text-sm">Knowledge Seeker</div>
                                                    <div className="text-xs text-gray-600">Completed 3 learning modules</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'imported' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
                        <ImportedProblemsPage />
                    </div>
                )}

                {activeTab === 'problems' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
                        <Problems activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                )}

                {activeTab === 'learning' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
                        <Learning activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                )}

                {activeTab === 'revision' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
                        <Revision activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                )}

                {activeTab === 'roadmaps' && isRoadmapsEnabled && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
                        <Roadmaps activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                )}

                {activeTab === 'mindgraph' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <MindGraph />
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden p-6">
                        <AdvancedAnalytics />
                    </div>
                )}
            </div>
        </div>
    );
};