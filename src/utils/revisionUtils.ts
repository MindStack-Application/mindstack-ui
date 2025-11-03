import type { Problem, LearningItem, RevisionItem, RevisionAgenda, RevisionStats } from '../types';

/**
 * Spaced repetition intervals in days
 * 1st revision: 1 day (next day)
 * 2nd revision: 3 days later (4 days from original)
 * 3rd revision: 7 days later (11 days from original)
 * 4th revision: 15 days later (26 days from original)
 * 5th revision: 30 days later (56 days from original)
 */
export const REVISION_INTERVALS = [1, 3, 7, 15, 30];

/**
 * Calculate the next revision date based on the current cycle
 */
export const calculateNextRevisionDate = (lastRevisionDate: string, cycle: number): string => {
    const date = new Date(lastRevisionDate);
    const daysToAdd = REVISION_INTERVALS[cycle - 1] || 30; // Default to 30 days for cycle 5+
    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
};

/**
 * Create a revision item from a problem
 */
export const createRevisionItemFromProblem = (problem: Problem): RevisionItem => {
    const today = new Date().toISOString().split('T')[0];
    const nextRevisionDate = calculateNextRevisionDate(problem.date, 1);

    return {
        id: `revision_${problem.id}_${Date.now()}`,
        itemId: problem.id,
        itemType: 'problem',
        problem,
        originalDate: problem.date,
        nextRevisionDate,
        revisionCycle: 1,
        isCompleted: false,
    };
};

/**
 * Create a revision item from a learning item
 */
export const createRevisionItemFromLearning = (learningItem: LearningItem): RevisionItem => {
    const today = new Date().toISOString().split('T')[0];
    const nextRevisionDate = calculateNextRevisionDate(learningItem.date, 1);

    return {
        id: `revision_${learningItem.id}_${Date.now()}`,
        itemId: learningItem.id,
        itemType: 'learning',
        learningItem,
        originalDate: learningItem.date,
        nextRevisionDate,
        revisionCycle: 1,
        isCompleted: false,
    };
};

/**
 * Get revision items for a specific date
 */
// Get revision items for a specific date (exact match for upcoming view)
export const getRevisionItemsForDate = (revisionItems: RevisionItem[], targetDate: string): RevisionItem[] => {
    return revisionItems.filter(item =>
        item.nextRevisionDate === targetDate && !item.isCompleted
    );
};

/**
 * Get revision agenda for a date range
 */
export const getRevisionAgenda = (revisionItems: RevisionItem[], startDate: string, endDate: string): RevisionAgenda[] => {
    const agenda: RevisionAgenda[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const items = getRevisionItemsForDate(revisionItems, dateStr);

        if (items.length > 0) {
            agenda.push({
                date: dateStr,
                items,
                totalItems: items.length,
                completedItems: items.filter(item => item.isCompleted).length,
            });
        }
    }

    return agenda;
};

/**
 * Mark a revision item as completed and calculate next revision
 */
export const completeRevisionItem = (item: RevisionItem): RevisionItem => {
    const today = new Date().toISOString().split('T')[0];
    const nextCycle = item.revisionCycle + 1;
    const nextRevisionDate = calculateNextRevisionDate(today, nextCycle);

    return {
        ...item,
        isCompleted: true,
        completedDate: today,
        revisionCycle: nextCycle,
        nextRevisionDate,
    };
};

/**
 * Get revision statistics
 */
export const getRevisionStats = (revisionItems: RevisionItem[]): RevisionStats => {
    const today = new Date().toISOString().split('T')[0];

    const totalRevisions = revisionItems.length;
    const completedRevisions = revisionItems.filter(item => item.isCompleted).length;
    const upcomingRevisions = revisionItems.filter(item =>
        item.nextRevisionDate >= today && !item.isCompleted
    ).length;
    const overdueRevisions = revisionItems.filter(item =>
        item.nextRevisionDate < today && !item.isCompleted
    ).length;

    // Calculate current streak (consecutive days with completed revisions)
    let currentStreak = 0;
    const sortedItems = revisionItems
        .filter(item => item.isCompleted && item.completedDate)
        .sort((a, b) => new Date(a.completedDate!).getTime() - new Date(b.completedDate!).getTime());

    if (sortedItems.length > 0) {
        let lastCompletedDate = new Date(sortedItems[sortedItems.length - 1].completedDate!);
        const today = new Date();
        const diffTime = today.getTime() - lastCompletedDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            currentStreak = 1;
            for (let i = sortedItems.length - 2; i >= 0; i--) {
                const prevDate = new Date(sortedItems[i].completedDate!);
                const dayDiff = Math.ceil((lastCompletedDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) {
                    currentStreak++;
                    lastCompletedDate = prevDate;
                } else {
                    break;
                }
            }
        }
    }

    return {
        totalRevisions,
        completedRevisions,
        upcomingRevisions,
        overdueRevisions,
        currentStreak,
    };
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Get relative date description
 */
export const getRelativeDateDescription = (dateStr: string): string => {
    const today = new Date();
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

    return formatDateForDisplay(dateStr);
};
