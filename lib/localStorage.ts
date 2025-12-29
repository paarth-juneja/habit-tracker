/**
 * Local Storage utilities with UID-scoped cache keys
 * 
 * All user data is scoped by Firebase UID for proper isolation.
 */

import { getCacheKey } from './cacheManager';

export interface Goals {
    tenYear: string;
    fiveYear: string;
    oneYear: string;
    sixMonth: string;
    oneMonth: string;
    weekly: string;
}

export interface Habit {
    id: string;
    name: string;
    completedDays: number[];
}

export interface MonthlyHabits {
    year: number;
    month: number;
    habits: Habit[];
}

// Data type keys
const DATA_TYPES = {
    GOALS: 'goals',
    HABITS: 'habits',
    LAST_SYNC: 'lastSync',
    PROFILE: 'profile',
};

/**
 * Save goals to localStorage (UID-scoped)
 */
export function saveGoalsToLocal(uid: string, goals: Goals): void {
    if (typeof window === 'undefined' || !uid) return;
    const key = getCacheKey(uid, DATA_TYPES.GOALS, 'current');
    localStorage.setItem(key, JSON.stringify(goals));
}

/**
 * Get goals from localStorage (UID-scoped)
 */
export function getGoalsFromLocal(uid: string): Goals | null {
    if (typeof window === 'undefined' || !uid) return null;
    const key = getCacheKey(uid, DATA_TYPES.GOALS, 'current');
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Save habits to localStorage (UID-scoped, by month)
 */
export function saveHabitsToLocal(uid: string, year: number, month: number, habits: Habit[]): void {
    if (typeof window === 'undefined' || !uid) return;
    const key = getCacheKey(uid, DATA_TYPES.HABITS, `${year}-${month}`);
    localStorage.setItem(key, JSON.stringify(habits));
}

/**
 * Get habits from localStorage (UID-scoped, by month)
 */
export function getHabitsFromLocal(uid: string, year: number, month: number): Habit[] | null {
    if (typeof window === 'undefined' || !uid) return null;
    const key = getCacheKey(uid, DATA_TYPES.HABITS, `${year}-${month}`);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

/**
 * Set last sync timestamp (UID-scoped)
 */
export function setLastSync(uid: string): void {
    if (typeof window === 'undefined' || !uid) return;
    const key = getCacheKey(uid, DATA_TYPES.LAST_SYNC);
    localStorage.setItem(key, new Date().toISOString());
}

/**
 * Get last sync timestamp (UID-scoped)
 */
export function getLastSync(uid: string): Date | null {
    if (typeof window === 'undefined' || !uid) return null;
    const key = getCacheKey(uid, DATA_TYPES.LAST_SYNC);
    const data = localStorage.getItem(key);
    return data ? new Date(data) : null;
}

/**
 * Save user profile to localStorage (UID-scoped)
 */
export function saveProfileToLocal(uid: string, profile: Record<string, unknown>): void {
    if (typeof window === 'undefined' || !uid) return;
    const key = getCacheKey(uid, DATA_TYPES.PROFILE);
    localStorage.setItem(key, JSON.stringify(profile));
}

/**
 * Get user profile from localStorage (UID-scoped)
 */
export function getProfileFromLocal(uid: string): Record<string, unknown> | null {
    if (typeof window === 'undefined' || !uid) return null;
    const key = getCacheKey(uid, DATA_TYPES.PROFILE);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Legacy support - clear old email-based cache entries
export function clearLegacyEmailCache(): void {
    if (typeof window === 'undefined') return;

    const legacyPrefixes = [
        'habit-tracker-goals-',
        'habit-tracker-habits-',
        'habit-tracker-last-sync-',
    ];

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && legacyPrefixes.some(prefix => key.startsWith(prefix))) {
            keysToRemove.push(key);
        }
    }

    if (keysToRemove.length > 0) {
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[localStorage] Cleared ${keysToRemove.length} legacy email-based entries`);
    }
}
