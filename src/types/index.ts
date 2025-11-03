export interface Problem {
  id: string;
  title: string;
  platform: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  subtopic?: string;
  timeSpent: number; // in minutes
  outcome: 'solved' | 'hints' | 'failed';
  date: string;
  link?: string;
  tags: string;
  approachNotes?: string;
  codeLink?: string;
  isRevision: boolean;
}

export interface LearningItem {
  id: string;
  title: string;
  type: 'course' | 'book' | 'tutorial' | 'article' | 'video' | 'podcast' | 'workshop' | 'other';
  category: string; // e.g., 'Web Development', 'Data Science', 'Design', etc.
  subtopic?: string;
  timeSpent: number; // in minutes
  progress: number; // 0-100 percentage
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
  date: string;
  link?: string;
  tags: string;
  notes?: string;
  resourceLink?: string;
  isRevision: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  platform?: string; // e.g., 'Coursera', 'YouTube', 'Medium', etc.
}

export interface AnalyticsData {
  totalProblems: number;
  weeklySolved: number;
  currentStreak: number;
  successRate: number;
  monthlyChange: number;
  weeklyChange: number;
  streakChange: number;
  rateChange: number;
}

export interface AdvancedAnalytics {
  overview: {
    totalProblems: number;
    totalLearningHours: number;
    currentStreak: number;
    successRate: number;
    averageTimePerProblem: number;
    totalTopics: number;
    completedRoadmaps: number;
  };
  performanceMetrics: {
    dailyActivity: Array<{ date: string; problemsSolved: number; learningHours: number }>;
    weeklyProgress: Array<{ week: string; problemsSolved: number; successRate: number }>;
    monthlyTrends: Array<{ month: string; totalProblems: number; averageTime: number }>;
  };
  topicAnalysis: {
    strongestTopics: Array<{ topic: string; successRate: number; problemsSolved: number }>;
    weakestTopics: Array<{ topic: string; successRate: number; problemsSolved: number }>;
    topicDistribution: Array<{ topic: string; count: number; percentage: number }>;
  };
  difficultyAnalysis: {
    easyProblems: { solved: number; total: number; successRate: number };
    mediumProblems: { solved: number; total: number; successRate: number };
    hardProblems: { solved: number; total: number; successRate: number };
  };
  timeAnalysis: {
    bestPerformingHours: Array<{ hour: number; successRate: number; problemsSolved: number }>;
    averageTimeByDifficulty: {
      easy: number;
      medium: number;
      hard: number;
    };
    productivityPatterns: Array<{ day: string; productivity: number }>;
  };
  aiInsights: {
    recommendations: Array<{ type: 'topic' | 'difficulty' | 'time' | 'pattern'; title: string; description: string; priority: 'high' | 'medium' | 'low' }>;
    predictions: Array<{ metric: string; current: number; predicted: number; timeframe: string }>;
    strengths: Array<{ area: string; description: string; confidence: number }>;
    improvements: Array<{ area: string; description: string; action: string }>;
  };
  learningProgress: {
    coursesCompleted: number;
    coursesInProgress: number;
    totalLearningHours: number;
    learningStreak: number;
    favoriteTopics: Array<{ topic: string; hours: number }>;
  };
  roadmapProgress: {
    totalRoadmaps: number;
    completedRoadmaps: number;
    inProgressRoadmaps: number;
    nextMilestones: Array<{ roadmap: string; milestone: string; progress: number }>;
  };
}

export interface NewProblemForm {
  title: string;
  platform: string;
  difficulty: 'easy' | 'medium' | 'hard' | '';
  topic: string;
  subtopic: string;
  outcome: 'solved' | 'hints' | 'failed' | '';
  timeSpent: number;
  link: string;
  tags: [];
  approachNotes: string;
  isRevision: boolean;
  codeLink: string;
}

export interface RevisionItem {
  id: string;
  itemId: string;
  itemType: 'problem' | 'learning';
  problem?: Problem;
  learningItem?: LearningItem;
  originalDate: string;
  nextRevisionDate: string;
  revisionCycle: number; // 1, 2, 3, 4 (3, 7, 15, 30 days)
  isCompleted: boolean;
  completedDate?: string;
  linkedNodes?: Array<{ id: number; title: string; type: string }>;
}

export interface RevisionAgenda {
  date: string;
  items: RevisionItem[];
  totalItems: number;
  completedItems: number;
}

export interface RevisionStats {
  totalRevisions: number;
  completedRevisions: number;
  upcomingRevisions: number;
  overdueRevisions: number;
  currentStreak: number;
}

// Roadmap types
export interface Roadmap {
  id: string;
  title: string;
  description?: string;
  color: string;
  isPublic: boolean;
  userId: string;
  lastVisited?: string;
  topics: Topic[];
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  order: number;
  isCompleted: boolean;
  completedDate?: string;
  roadmapId: string;
  subtopics: Subtopic[];
  // Progress tracking
  totalSubtopics: number;
  completedSubtopics: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subtopic {
  id: string;
  title: string;
  description?: string;
  order: number;
  isCompleted: boolean;
  completedDate?: string;
  topicId: string;
  // Simplified: No nested subtopics
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapProgress {
  totalTopics: number;
  completedTopics: number;
  totalSubtopics: number;
  completedSubtopics: number;
  overallProgress: number;
}

// Export graph types
export {
  GraphNode,
  GraphEdge,
  NodeMetric,
  Review,
  GraphData,
  CreateNodeData,
  UpdateNodeData,
  CreateEdgeData,
  PostReviewData,
  RevisionQueueOptions,
  GraphSettings
} from './graph';