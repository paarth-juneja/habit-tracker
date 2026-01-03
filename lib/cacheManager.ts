/**
 * Cache Manager for Firebase Authentication
 * 
 * Provides centralized cache management to ensure cached data
 * never interferes with authentication flows.
 * 
 * Also integrates with CacheService for application-level caching.
 */

import { cache, buildGoalsCacheKey, buildHabitsCacheKey, CacheTTL } from './cacheService';
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Cache key prefixes
const CACHE_PREFIX = 'habit-tracker';
const AUTH_CACHE_KEYS = ['firebase:authUser', 'firebase:host'];

/**
 * Clear all user-specific cache entries from localStorage
 */
export function clearUserLocalStorage(uid?: string): void {
    if (typeof window === 'undefined') return;

    // Also clear in-memory cache
    if (uid) {
        cache.invalidateByUser(uid);
    } else {
        cache.clearAll();
    }

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Remove all habit-tracker prefixed entries
        if (key.startsWith(CACHE_PREFIX)) {
            // If uid is provided, only remove entries for that user
            if (uid) {
                if (key.includes(uid)) {
                    keysToRemove.push(key);
                }
            } else {
                // No uid = clear all habit-tracker entries
                keysToRemove.push(key);
            }
        }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[CacheManager] Cleared ${keysToRemove.length} localStorage entries`);
}

/**
 * Clear Firebase auth-related cache from IndexedDB
 * Firebase stores auth state in IndexedDB under 'firebaseLocalStorageDb'
 */
export async function clearFirebaseIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    const dbNames = [
        'firebaseLocalStorageDb',
        'firebase-heartbeat-database',
        'firebase-installations-database',
    ];

    for (const dbName of dbNames) {
        try {
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            await new Promise<void>((resolve, reject) => {
                deleteRequest.onsuccess = () => {
                    console.log(`[CacheManager] Deleted IndexedDB: ${dbName}`);
                    resolve();
                };
                deleteRequest.onerror = () => {
                    console.warn(`[CacheManager] Failed to delete IndexedDB: ${dbName}`);
                    resolve(); // Don't reject, continue cleanup
                };
                deleteRequest.onblocked = () => {
                    console.warn(`[CacheManager] IndexedDB delete blocked: ${dbName}`);
                    resolve();
                };
            });
        } catch (error) {
            console.warn(`[CacheManager] Error deleting ${dbName}:`, error);
        }
    }
}

/**
 * Clear all caches in Service Worker
 */
export async function clearServiceWorkerCaches(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;

    try {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames.map(cacheName => {
                console.log(`[CacheManager] Deleting SW cache: ${cacheName}`);
                return caches.delete(cacheName);
            })
        );
    } catch (error) {
        console.warn('[CacheManager] Error clearing SW caches:', error);
    }
}

/**
 * Send message to Service Worker to clear caches
 */
export function notifyServiceWorkerToClearCache(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then(registration => {
        registration.active?.postMessage({ type: 'CLEAR_CACHE' });
        console.log('[CacheManager] Notified SW to clear cache');
    }).catch(error => {
        console.warn('[CacheManager] Could not notify SW:', error);
    });
}

/**
 * Clear session storage
 */
export function clearSessionStorage(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.clear();
    console.log('[CacheManager] Cleared sessionStorage');
}

/**
 * Clear all auth-related cache before login attempt
 * Ensures no stale auth data interferes with new sign-in
 */
export async function clearAuthCache(): Promise<void> {
    console.log('[CacheManager] Clearing auth cache before login...');

    // Clear any Firebase auth entries from localStorage
    if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && AUTH_CACHE_KEYS.some(pattern => key.includes(pattern))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // Clear session storage
    clearSessionStorage();

    // Note: We don't clear IndexedDB here as it would log out the current user
    // Firebase manages its own auth IndexedDB, we just clear stale entries
}

/**
 * Complete cache purge on logout
 * Call this BEFORE firebase signOut()
 */
export async function clearAllUserCache(uid?: string): Promise<void> {
    console.log('[CacheManager] Full cache purge for logout...');

    // 1. Clear user-specific localStorage
    clearUserLocalStorage(uid);

    // 2. Clear sessionStorage
    clearSessionStorage();

    // 3. Notify Service Worker
    notifyServiceWorkerToClearCache();

    // 4. Clear SW caches directly (backup)
    await clearServiceWorkerCaches();

    console.log('[CacheManager] Cache purge complete');
}

/**
 * Nuclear option - clear absolutely everything
 * Use for fail-safe recovery from cache corruption
 */
export async function clearAllCache(): Promise<void> {
    console.log('[CacheManager] NUCLEAR: Clearing ALL cache...');

    // Clear all localStorage (not just prefixed)
    if (typeof window !== 'undefined') {
        localStorage.clear();
    }

    // Clear sessionStorage
    clearSessionStorage();

    // Clear IndexedDB
    await clearFirebaseIndexedDB();

    // Clear SW caches
    await clearServiceWorkerCaches();
    notifyServiceWorkerToClearCache();

    console.log('[CacheManager] NUCLEAR cache clear complete');
}

/**
 * Check if there's a cache/auth state mismatch
 * Returns true if corruption is detected
 */
export function detectCacheCorruption(currentUid: string | null): boolean {
    if (typeof window === 'undefined') return false;

    // Check if there's cached data for a different user
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(CACHE_PREFIX)) continue;

        // If no user is logged in but we have user data cached
        if (!currentUid && key.includes(':')) {
            console.warn('[CacheManager] Corruption detected: cache exists but no user');
            return true;
        }

        // If logged in but cache is for a different user
        if (currentUid && !key.includes(currentUid)) {
            // Check if it's user-specific data (contains a UID pattern)
            const uidPattern = /habit-tracker:[a-zA-Z0-9]+:/;
            if (uidPattern.test(key)) {
                console.warn('[CacheManager] Corruption detected: cache for different user');
                return true;
            }
        }
    }

    return false;
}

/**
 * Get cache key with proper UID scoping
 */
export function getCacheKey(uid: string, dataType: string, subKey?: string): string {
    if (subKey) {
        return `${CACHE_PREFIX}:${uid}:${dataType}:${subKey}`;
    }
    return `${CACHE_PREFIX}:${uid}:${dataType}`;
}

/**
 * Track the last known UID for detecting user switches
 */
const LAST_UID_KEY = `${CACHE_PREFIX}:lastUid`;

export function getLastKnownUid(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(LAST_UID_KEY);
}

export function setLastKnownUid(uid: string | null): void {
    if (typeof window === 'undefined') return;
    if (uid) {
        localStorage.setItem(LAST_UID_KEY, uid);
    } else {
        localStorage.removeItem(LAST_UID_KEY);
    }
}

/**
 * Detect if user has switched (different UID than last known)
 */
export function hasUserSwitched(currentUid: string): boolean {
    const lastUid = getLastKnownUid();
    return lastUid !== null && lastUid !== currentUid;
}

/**
 * Warm cache with commonly accessed data for a user
 * Call this after successful authentication
 */
export async function warmCache(uid: string): Promise<void> {
    console.log('[CacheManager] Warming cache for user:', uid);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    try {
        // Prefetch goals
        const goalsKey = buildGoalsCacheKey(uid);
        cache.prefetch(goalsKey, async () => {
            const goalsRef = doc(db, 'users', uid, 'goals', 'current');
            const snap = await getDoc(goalsRef);
            return snap.exists() ? snap.data() : null;
        }, { ttl: CacheTTL.GOALS, useStorage: true, tags: [`user:${uid}`] });

        // Prefetch current month habits
        const habitsKey = buildHabitsCacheKey(uid, currentYear, currentMonth);
        cache.prefetch(habitsKey, async () => {
            const habitsRef = doc(db, 'users', uid, 'habits', `${currentYear}-${currentMonth}`);
            const snap = await getDoc(habitsRef);
            return snap.exists() ? snap.data()?.list || [] : [];
        }, { ttl: CacheTTL.HABITS, useStorage: true, tags: [`user:${uid}`] });

        console.log('[CacheManager] Cache warming initiated');
    } catch (error) {
        console.warn('[CacheManager] Cache warming failed:', error);
    }
}

/**
 * Export the cache instance for direct access if needed
 */
export { cache } from './cacheService';
