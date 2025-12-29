// Local storage keys
const STORAGE_KEYS = {
    GOALS: 'habit-tracker-goals',
    HABITS: 'habit-tracker-habits',
    LAST_SYNC: 'habit-tracker-last-sync',
};

export interface Goals {
    tenYear: string;
    fiveYear: string;
    oneYear: string;
    sixMonth: string;
    fourMonth: string;
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

// Goals storage
export function saveGoalsToLocal(email: string, goals: Goals): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.GOALS}-${email}`;
    localStorage.setItem(key, JSON.stringify(goals));
}

export function getGoalsFromLocal(email: string): Goals | null {
    if (typeof window === 'undefined') return null;
    const key = `${STORAGE_KEYS.GOALS}-${email}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Habits storage
export function saveHabitsToLocal(email: string, year: number, month: number, habits: Habit[]): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.HABITS}-${email}-${year}-${month}`;
    localStorage.setItem(key, JSON.stringify(habits));
}

export function getHabitsFromLocal(email: string, year: number, month: number): Habit[] | null {
    if (typeof window === 'undefined') return null;
    const key = `${STORAGE_KEYS.HABITS}-${email}-${year}-${month}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Last sync timestamp
export function setLastSync(email: string): void {
    if (typeof window === 'undefined') return;
    const key = `${STORAGE_KEYS.LAST_SYNC}-${email}`;
    localStorage.setItem(key, new Date().toISOString());
}

export function getLastSync(email: string): Date | null {
    if (typeof window === 'undefined') return null;
    const key = `${STORAGE_KEYS.LAST_SYNC}-${email}`;
    const data = localStorage.getItem(key);
    return data ? new Date(data) : null;
}

// Clear all cached data for a user
export function clearUserCache(email: string): void {
    if (typeof window === 'undefined') return;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(email)) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
}
