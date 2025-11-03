import React, { useState, useMemo, useEffect } from 'react';
import type { Problem } from '../types';
import { getDifficultyColor, getOutcomeColor, getStatusDotColor } from '../utils/helpers';
import { useNotification } from './NotificationContext';
import { ExternalLink, Search, Download, Plus, FileText, Monitor, X, Filter, Link, AlertCircle } from 'lucide-react';
import { apiClient } from '../utils/apis';

interface ProblemsTableProps {
  problems: Problem[];
  onAddProblem: () => void;
  onOpenLinkPanel: (problemId: number, problemTitle: string) => void;
}

interface FilterState {
  search: string;
  platform: string;
  difficulty: string;
  topic: string;
  outcome: string;
}

const ProblemsTable: React.FC<ProblemsTableProps> = ({ problems, onAddProblem, onOpenLinkPanel }) => {
  const { showSuccess, showError } = useNotification();
  const [showFilters, setShowFilters] = useState(false);
  const [linkStatuses, setLinkStatuses] = useState<Record<number, boolean>>({});
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    platform: '',
    difficulty: '',
    topic: '',
    outcome: ''
  });

  // Get unique values for filter dropdowns
  const uniquePlatforms = useMemo(() => {
    return Array.from(new Set(problems.map(p => p.platform))).sort();
  }, [problems]);

  const uniqueTopics = useMemo(() => {
    return Array.from(new Set(problems.map(p => p.topic))).sort();
  }, [problems]);

  const difficulties = ['easy', 'medium', 'hard'];
  const outcomes = ['solved', 'hints', 'failed'];

  // Load link statuses for all problems
  useEffect(() => {
    const loadLinkStatuses = async () => {
      if (problems.length === 0) return;

      setLoadingLinks(true);
      const statuses: Record<number, boolean> = {};

      try {
        for (const problem of problems) {
          const response = await apiClient.getItemLinks('problem', problem.id);
          statuses[problem.id] = response.success && response.data && response.data.length > 0;
        }
        setLinkStatuses(statuses);
      } catch (error) {
        console.error('Error loading link statuses:', error);
      } finally {
        setLoadingLinks(false);
      }
    };

    loadLinkStatuses();
  }, [problems]);

  // Filter problems based on current filters
  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      const matchesSearch = !filters.search ||
        problem.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        problem.tags.toLowerCase().includes(filters.search.toLowerCase());

      const matchesPlatform = !filters.platform || problem.platform === filters.platform;
      const matchesDifficulty = !filters.difficulty || problem.difficulty === filters.difficulty;
      const matchesTopic = !filters.topic || problem.topic === filters.topic;
      const matchesOutcome = !filters.outcome || problem.outcome === filters.outcome;

      return matchesSearch && matchesPlatform && matchesDifficulty && matchesTopic && matchesOutcome;
    });
  }, [problems, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      platform: '',
      difficulty: '',
      topic: '',
      outcome: ''
    });
  };

  const exportToCSV = () => {
    try {
      const headers = ['Title', 'Platform', 'Difficulty', 'Topic', 'Subtopic', 'Time Spent (min)', 'Outcome', 'Date', 'Tags', 'Link', 'Code Link'];

      const csvContent = [
        headers.join(','),
        ...filteredProblems.map(problem => [
          `"${problem.title.replace(/"/g, '""')}"`,
          `"${problem.platform}"`,
          `"${problem.difficulty}"`,
          `"${problem.topic}"`,
          `"${problem.subtopic || ''}"`,
          problem.timeSpent,
          `"${problem.outcome}"`,
          `"${problem.date}"`,
          `"${problem.tags}"`,
          `"${problem.link || ''}"`,
          `"${problem.codeLink || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `problems_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess(
        'Export Successful',
        `Successfully exported ${filteredProblems.length} problems to CSV.`
      );
    } catch (error) {
      console.error('Export error:', error);
      showError(
        'Export Failed',
        'There was an error exporting your problems. Please try again.'
      );
    }
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  function formatDateToCustomString(isoDate: string): string {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    };

    const raw = new Date(isoDate).toLocaleString("en-GB", options).replace(",", "");

    // Split into parts: "07 Jul 2025 02:11 PM"
    const [day, month, year, time, period] = raw.split(" ");

    return `${day} ${month}, ${year} ${time} ${period}`;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Monitor size={20} className="text-gray-600" />
          Recent Problems
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md transition-colors ${showFilters || hasActiveFilters
              ? 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'
              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              }`}
          >
            <Filter size={16} />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {Object.values(filters).filter(v => v !== '').length}
              </span>
            )}
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or tags..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Platform</label>
              <select
                value={filters.platform}
                onChange={(e) => handleFilterChange('platform', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Platforms</option>
                {uniquePlatforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Difficulties</option>
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Topic</label>
              <select
                value={filters.topic}
                onChange={(e) => handleFilterChange('topic', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Topics</option>
                {uniqueTopics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            {/* Outcome */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Outcome</label>
              <select
                value={filters.outcome}
                onChange={(e) => handleFilterChange('outcome', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Outcomes</option>
                {outcomes.map(outcome => (
                  <option key={outcome} value={outcome}>
                    {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Problem</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Platform</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Difficulty</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Topic</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Time</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Outcome</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Graph</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wide text-xs">Solution</th>
            </tr>
          </thead>
          <tbody>
            {filteredProblems.length === 0 && problems.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <Monitor size={48} className="text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">No problems logged yet</p>
                      <p className="text-xs text-gray-500">Click "Add Problem" to get started</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {filteredProblems.length === 0 && problems.length > 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-3">
                    <Search size={48} className="text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">No problems match your filters</p>
                      <p className="text-xs text-gray-500">Try adjusting your search criteria</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {filteredProblems.map((problem, index) => (
              <tr
                key={problem.id}
                className={`hover:bg-gray-50 transition-colors ${index !== filteredProblems.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <td className="px-4 py-4">
                  <div className="max-w-xs">
                    <div className="font-medium text-gray-900 mb-2">
                      {problem.link ? (
                        <a
                          href={problem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1.5 transition-colors"
                        >
                          {problem.title}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        problem.title
                      )}
                    </div>
                    {problem.tags && (
                      <div className="flex flex-wrap gap-1">
                        {typeof problem?.tags === "string" &&
                          problem.tags.split(',').map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium text-gray-700">{problem.platform}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide ${getDifficultyColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-700 font-medium">{problem.topic}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono font-medium text-gray-700">{problem.timeSpent}m</span>
                </td>
                <td className="px-4 py-4">
                  <div className={`flex items-center gap-2 text-sm font-medium ${getOutcomeColor(problem.outcome)}`}>
                    <span className={`w-2 h-2 rounded-full ${getStatusDotColor(problem.outcome)}`}></span>
                    {problem.outcome.charAt(0).toUpperCase() + problem.outcome.slice(1)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-gray-500 text-xs">{formatDateToCustomString(problem.date)}</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {loadingLinks ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    ) : linkStatuses[problem.id] ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <Link size={14} />
                        <span className="text-xs font-medium">Linked</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenLinkPanel(problem.id, problem.title)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 hover:border-orange-300 transition-colors"
                      >
                        <AlertCircle size={12} />
                        Link Required
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {problem.codeLink ? (
                    <a
                      href={problem.codeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      View Solution
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md">No solution</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {hasActiveFilters ? (
            <span>
              {filteredProblems.length} of {problems.length} {problems.length === 1 ? 'problem' : 'problems'}
              {filteredProblems.length !== problems.length && ' (filtered)'}
            </span>
          ) : (
            <span>
              {problems.length} {problems.length === 1 ? 'problem' : 'problems'} logged
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onAddProblem}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-600 rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all duration-200"
          >
            <Plus size={16} />
            Add Problem
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200">
            <FileText size={16} />
            View All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemsTable;