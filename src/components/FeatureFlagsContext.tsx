import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FeatureFlags {
    roadmaps: boolean;
    // Add more feature flags here as needed
}

interface FeatureFlagsContextType {
    flags: FeatureFlags;
    updateFlag: (flagName: keyof FeatureFlags, value: boolean) => void;
    isFeatureEnabled: (flagName: keyof FeatureFlags) => boolean;
}

const defaultFlags: FeatureFlags = {
    roadmaps: false, // Disabled by default
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

interface FeatureFlagsProviderProps {
    children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
    const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);

    // Load feature flags from localStorage on component mount
    useEffect(() => {
        const savedFlags = localStorage.getItem('mindstack-feature-flags');
        if (savedFlags) {
            try {
                const parsedFlags = JSON.parse(savedFlags);
                setFlags({ ...defaultFlags, ...parsedFlags });
            } catch (error) {
                console.warn('Failed to parse saved feature flags, using defaults');
                setFlags(defaultFlags);
            }
        }
    }, []);

    // Save feature flags to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('mindstack-feature-flags', JSON.stringify(flags));
    }, [flags]);

    const updateFlag = (flagName: keyof FeatureFlags, value: boolean) => {
        setFlags(prev => ({
            ...prev,
            [flagName]: value
        }));
    };

    const isFeatureEnabled = (flagName: keyof FeatureFlags): boolean => {
        return flags[flagName] ?? false;
    };

    const value: FeatureFlagsContextType = {
        flags,
        updateFlag,
        isFeatureEnabled
    };

    return (
        <FeatureFlagsContext.Provider value={value}>
            {children}
        </FeatureFlagsContext.Provider>
    );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
    const context = useContext(FeatureFlagsContext);
    if (context === undefined) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
    }
    return context;
};

// Convenience hook for checking a specific feature
export const useFeatureFlag = (flagName: keyof FeatureFlags): boolean => {
    const { isFeatureEnabled } = useFeatureFlags();
    return isFeatureEnabled(flagName);
};
