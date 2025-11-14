import React from 'react';
import { LayoutDashboard, List, BarChart3, RotateCcw, BookOpen, Map, Brain, TrendingUp, Activity, Network } from 'lucide-react';
import ProfileIcon from './ProfileIcon';
import { useFeatureFlag } from './FeatureFlagsContext';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onSettingsClick }) => {
  const isRoadmapsEnabled = useFeatureFlag('roadmaps');

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'imported', label: 'Imported', icon: List },
    { id: 'problems', label: 'Problem Solving', icon: Activity },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'revision', label: 'Revision', icon: RotateCcw },
    { id: 'roadmaps', label: 'Roadmaps', icon: Map },
    { id: 'mindgraph', label: 'MindGraph', icon: Network },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  // Filter out roadmaps if feature flag is disabled
  const navItems = allNavItems.filter(item =>
    item.id !== 'roadmaps' || isRoadmapsEnabled
  );

  return (
    <header className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Brain size={28} className="text-gray-700" strokeWidth={2.5} />
        <h1 className="text-2xl font-semibold text-gray-900">MindStack</h1>
      </div>
      <nav className="flex gap-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[40px] ${activeTab === item.id
                ? 'bg-gray-800 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <IconComponent size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
        <ProfileIcon onSettingsClick={onSettingsClick} />
      </nav>
    </header>
  );
};

export default Header;