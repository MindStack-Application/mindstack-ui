/**
 * STRENGTH FORMATTING UTILITIES
 * 
 * Utilities for normalizing and displaying strength values.
 * Handles legacy values and ensures consistent percentage display.
 */

/**
 * Normalize strength value to 0-1 range
 * @param {number} raw - Raw strength value (could be 0-1 or 0-100)
 * @returns {number} Normalized strength value (0-1)
 */
export const normalizeStrength = (raw: number): number => {
    if (raw > 1) {
        // Legacy value - treat as percentage and convert to 0-1
        return Math.max(0, Math.min(1, raw / 100));
    }
    // Already in 0-1 range
    return Math.max(0, Math.min(1, raw));
};

/**
 * Format strength for display as percentage
 * @param {number} raw - Raw strength value (could be 0-1 or 0-100)
 * @returns {string} Formatted percentage string (e.g., "65%")
 */
export const formatStrength = (raw: number): string => {
    const normalized = normalizeStrength(raw);
    return `${Math.round(normalized * 100)}%`;
};

/**
 * Enhanced strength formatting that considers study status
 * @param {number} strength - Raw strength value
 * @param {any} node - Node object (optional, for checking study status)
 * @returns {string} Formatted strength display
 */
export const formatStrengthSmart = (strength: number, node?: any): string => {
    if (node) {
        const hasStudied = hasNodeBeenStudied(node);
        const contextual = formatStrengthContextual(strength, hasStudied);
        return contextual.showPercentage ?
            `${contextual.display} (${Math.round(normalizeStrength(strength) * 100)}%)` :
            contextual.display;
    }

    // Fallback to regular percentage formatting
    return formatStrength(strength);
};

/**
 * Format strength for display with both percentage and 0-1 value
 * @param {number} raw - Raw strength value (could be 0-1 or 0-100)
 * @returns {object} Object with percent string and normalized value
 */
export const formatStrengthDetailed = (raw: number): { percent: string; value01: number } => {
    const normalized = normalizeStrength(raw);
    return {
        percent: `${Math.round(normalized * 100)}%`,
        value01: normalized
    };
};

/**
 * Format strength contextually based on node's review/study status
 * @param {number} strength - Strength value (0-1)
 * @param {boolean} hasBeenStudied - Whether the node has reviews or linked artifacts
 * @param {number} reviewCount - Number of reviews (optional)
 * @returns {object} Object with display text, color class, and show percentage flag
 */
export const formatStrengthContextual = (
    strength: number,
    hasBeenStudied: boolean = false,
    reviewCount: number = 0
): {
    display: string;
    colorClass: string;
    showPercentage: boolean;
    description: string;
} => {
    const normalized = normalizeStrength(strength);

    // If node hasn't been studied (no reviews, no artifacts, default strength)
    if (!hasBeenStudied && normalized === 0.5) {
        return {
            display: 'Not Studied',
            colorClass: 'text-gray-500',
            showPercentage: false,
            description: 'This concept hasn\'t been reviewed yet'
        };
    }

    // If node has some activity but very low strength
    if (hasBeenStudied && normalized < 0.3) {
        return {
            display: 'Needs Work',
            colorClass: 'text-red-600',
            showPercentage: true,
            description: `${Math.round(normalized * 100)}% mastery - needs more practice`
        };
    }

    // If node has some activity but low-moderate strength
    if (hasBeenStudied && normalized < 0.6) {
        return {
            display: 'In Progress',
            colorClass: 'text-orange-600',
            showPercentage: true,
            description: `${Math.round(normalized * 100)}% mastery - making progress`
        };
    }

    // If node has good strength
    if (hasBeenStudied && normalized < 0.8) {
        return {
            display: 'Good',
            colorClass: 'text-blue-600',
            showPercentage: true,
            description: `${Math.round(normalized * 100)}% mastery - well understood`
        };
    }

    // If node has excellent strength
    if (hasBeenStudied && normalized >= 0.8) {
        return {
            display: 'Mastered',
            colorClass: 'text-green-600',
            showPercentage: true,
            description: `${Math.round(normalized * 100)}% mastery - excellent understanding`
        };
    }

    // Fallback to percentage (shouldn't normally hit this)
    return {
        display: `${Math.round(normalized * 100)}%`,
        colorClass: 'text-gray-700',
        showPercentage: true,
        description: `${Math.round(normalized * 100)}% mastery`
    };
};

/**
 * Clamp value to 0-1 range for progress bars
 * @param {number} value - Value to clamp
 * @returns {number} Clamped value (0-1)
 */
export const clampStrength = (value: number): number => {
    return Math.max(0, Math.min(1, value));
};

/**
 * Determine if a node has been studied (has reviews or artifacts)
 * @param {any} node - Graph node object
 * @returns {boolean} True if node has been studied
 */
export const hasNodeBeenStudied = (node: any): boolean => {
    // Check if node has artifacts linked
    if (node.artifactCount && node.artifactCount > 0) {
        return true;
    }

    // Check if node has any reviews
    if (node.reviewCount && node.reviewCount > 0) {
        return true;
    }


    // Check if strength has changed from default due to reviews
    if (node.strength && node.strength !== 0.5) {
        return true;
    }

    // Check if node has been visited/reviewed recently
    if (node.lastVisited && node.lastVisited !== null) {
        return true;
    }

    return false;
};
