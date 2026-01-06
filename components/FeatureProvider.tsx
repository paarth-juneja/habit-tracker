'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthProvider';

export interface Feature {
    id: string;
    label: string;
    path: string;
}

export const ALL_FEATURES: Feature[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'todo', label: 'To-Do', path: '/todo' },
    { id: 'journal', label: 'Journal', path: '/journal' },
    { id: 'skills', label: 'Skills', path: '/skills' },
];

interface FeatureContextType {
    enabledFeatures: string[];
    headerFeatures: string[];
    toggleFeatureEnabled: (featureId: string) => void;
    toggleFeatureInHeader: (featureId: string) => void;
    isFeatureEnabled: (featureId: string) => boolean;
    isFeatureInHeader: (featureId: string) => boolean;
}

const FeatureContext = createContext<FeatureContextType>({
    enabledFeatures: [],
    headerFeatures: [],
    toggleFeatureEnabled: () => { },
    toggleFeatureInHeader: () => { },
    isFeatureEnabled: () => false,
    isFeatureInHeader: () => false,
});

export const useFeatures = () => useContext(FeatureContext);

export default function FeatureProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    // Default all enabled and in header
    const [enabledFeatures, setEnabledFeatures] = useState<string[]>(ALL_FEATURES.map(f => f.id));
    const [headerFeatures, setHeaderFeatures] = useState<string[]>(ALL_FEATURES.map(f => f.id));
    const [initialized, setInitialized] = useState(false);

    // Load settings from local storage on mount/user change
    useEffect(() => {
        if (user) {
            const storedSettings = localStorage.getItem(`everform_features_${user.uid}`);
            if (storedSettings) {
                try {
                    const parsed = JSON.parse(storedSettings);
                    setEnabledFeatures(parsed.enabledFeatures || ALL_FEATURES.map(f => f.id));
                    setHeaderFeatures(parsed.headerFeatures || ALL_FEATURES.map(f => f.id));
                } catch (e) {
                    console.error("Failed to parse feature settings", e);
                }
            } else {
                // Initialize default if nothing stored
                setEnabledFeatures(ALL_FEATURES.map(f => f.id));
                setHeaderFeatures(ALL_FEATURES.map(f => f.id));
            }
            setInitialized(true);
        } else {
            // Reset to default or clear if no user
            if (initialized) return; // Don't reset if just unmounting
        }
    }, [user]);

    // Save settings when changed
    useEffect(() => {
        if (user && initialized) {
            localStorage.setItem(`everform_features_${user.uid}`, JSON.stringify({
                enabledFeatures,
                headerFeatures
            }));
        }
    }, [enabledFeatures, headerFeatures, user, initialized]);

    const toggleFeatureEnabled = (featureId: string) => {
        setEnabledFeatures(prev => {
            if (prev.includes(featureId)) {
                return prev.filter(id => id !== featureId);
            } else {
                return [...prev, featureId];
            }
        });

        // If enabling a feature, maybe ensure it's in header? Or leave it to user?
        // User didn't specify, but "enable" usually means "turn on". 
        // We will just toggle the enabled state. It implies availability.
    };

    const toggleFeatureInHeader = (featureId: string) => {
        setHeaderFeatures(prev => {
            if (prev.includes(featureId)) {
                return prev.filter(id => id !== featureId);
            } else {
                return [...prev, featureId];
            }
        });
    };

    const isFeatureEnabled = (featureId: string) => enabledFeatures.includes(featureId);
    const isFeatureInHeader = (featureId: string) => headerFeatures.includes(featureId);

    return (
        <FeatureContext.Provider value={{
            enabledFeatures,
            headerFeatures,
            toggleFeatureEnabled,
            toggleFeatureInHeader,
            isFeatureEnabled,
            isFeatureInHeader
        }}>
            {children}
        </FeatureContext.Provider>
    );
}
