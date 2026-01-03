/**
 * Centralized Cache Service for Habit Tracker
 * 
 * Provides a two-tier caching system (memory + localStorage) with:
 * - TTL (Time-to-Live) support
 * - Stale-while-revalidate pattern
 * - Tag-based invalidation
 * - UID-scoped cache keys
 */

// ============= Types =============

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    tags: string[];
}

export interface CacheOptions {
    /** Time-to-live in milliseconds (default: 5 minutes) */
    ttl?: number;
    /** Store in memory cache (default: true) */
    useMemory?: boolean;
    /** Persist to localStorage (default: false) */
    useStorage?: boolean;
    /** Tags for grouped invalidation */
    tags?: string[];
    /** Return stale data while fetching fresh (default: false) */
    staleWhileRevalidate?: boolean;
}

export interface CacheStats {
    memoryHits: number;
    memoryMisses: number;
    storageHits: number;
    storageMisses: number;
    totalEntries: number;
}

// ============= Constants =============

const CACHE_PREFIX = 'ht-cache';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_MEMORY_ENTRIES = 100;

// Predefined TTL configurations for different data types
export const CacheTTL = {
    GOALS: 30 * 60 * 1000,           // 30 minutes
    HABITS: 10 * 60 * 1000,          // 10 minutes
    TODOS_DAILY: 5 * 60 * 1000,      // 5 minutes
    TODOS_WEEKLY: 10 * 60 * 1000,    // 10 minutes
    TODOS_MONTHLY: 15 * 60 * 1000,   // 15 minutes
    JOURNAL: 5 * 60 * 1000,          // 5 minutes
    PROFILE: 60 * 60 * 1000,         // 1 hour
    ENTRY_DATES: 10 * 60 * 1000,     // 10 minutes
} as const;

// Storage TTL multipliers (storage lasts longer than memory)
const STORAGE_TTL_MULTIPLIER = 2;

// ============= Cache Service Class =============

class CacheService {
    private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
    private stats: CacheStats = {
        memoryHits: 0,
        memoryMisses: 0,
        storageHits: 0,
        storageMisses: 0,
        totalEntries: 0,
    };
    private pendingFetches: Map<string, Promise<unknown>> = new Map();

    constructor() {
        // Clean up expired entries periodically
        if (typeof window !== 'undefined') {
            setInterval(() => this.cleanup(), 60 * 1000); // Every minute
        }
    }

    // ============= Core Methods =============

    /**
     * Get a cached value by key
     * Returns null if not found or expired
     */
    get<T>(key: string): T | null {
        // Try memory cache first
        const memoryEntry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
        if (memoryEntry) {
            if (this.isValid(memoryEntry)) {
                this.stats.memoryHits++;
                return memoryEntry.data;
            }
            // Entry expired, remove it
            this.memoryCache.delete(key);
        }
        this.stats.memoryMisses++;

        // Try localStorage
        if (typeof window !== 'undefined') {
            const storageKey = this.getStorageKey(key);
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                try {
                    const entry = JSON.parse(stored) as CacheEntry<T>;
                    if (this.isValid(entry)) {
                        // Restore to memory cache for faster subsequent access
                        this.memoryCache.set(key, entry);
                        this.stats.storageHits++;
                        return entry.data;
                    }
                    // Entry expired, remove it
                    localStorage.removeItem(storageKey);
                } catch (e) {
                    console.warn('[CacheService] Failed to parse stored cache:', e);
                    localStorage.removeItem(storageKey);
                }
            }
            this.stats.storageMisses++;
        }

        return null;
    }

    /**
     * Get cached value or fetch if not cached/expired
     * Supports stale-while-revalidate pattern
     */
    async getOrFetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const {
            ttl = DEFAULT_TTL,
            useMemory = true,
            useStorage = false,
            tags = [],
            staleWhileRevalidate = false,
        } = options;

        // Check for pending fetch to avoid duplicate requests
        const pending = this.pendingFetches.get(key);
        if (pending) {
            return pending as Promise<T>;
        }

        // Try to get from cache
        const cached = this.get<T>(key);

        if (cached !== null) {
            // Check if stale but still valid for SWR
            const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
            if (entry && staleWhileRevalidate && this.isStale(entry)) {
                // Return stale data immediately, but trigger background refresh
                this.backgroundRefresh(key, fetcher, options);
            }
            return cached;
        }

        // Fetch fresh data
        const fetchPromise = fetcher().then((data) => {
            this.set(key, data, { ttl, useMemory, useStorage, tags });
            this.pendingFetches.delete(key);
            return data;
        }).catch((error) => {
            this.pendingFetches.delete(key);
            throw error;
        });

        this.pendingFetches.set(key, fetchPromise);
        return fetchPromise;
    }

    /**
     * Set a value in cache
     */
    set<T>(key: string, data: T, options: CacheOptions = {}): void {
        const {
            ttl = DEFAULT_TTL,
            useMemory = true,
            useStorage = false,
            tags = [],
        } = options;

        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl,
            tags,
        };

        if (useMemory) {
            // Enforce max entries limit
            if (this.memoryCache.size >= MAX_MEMORY_ENTRIES) {
                this.evictOldest();
            }
            this.memoryCache.set(key, entry);
            this.stats.totalEntries = this.memoryCache.size;
        }

        if (useStorage && typeof window !== 'undefined') {
            const storageKey = this.getStorageKey(key);
            const storageEntry = {
                ...entry,
                ttl: ttl * STORAGE_TTL_MULTIPLIER, // Storage lasts longer
            };
            try {
                localStorage.setItem(storageKey, JSON.stringify(storageEntry));
            } catch (e) {
                console.warn('[CacheService] Failed to store in localStorage:', e);
            }
        }
    }

    /**
     * Invalidate cache entries by key or tag
     */
    invalidate(keyOrTag: string): void {
        // Check if it's a direct key match
        if (this.memoryCache.has(keyOrTag)) {
            this.memoryCache.delete(keyOrTag);
            if (typeof window !== 'undefined') {
                localStorage.removeItem(this.getStorageKey(keyOrTag));
            }
            return;
        }

        // Check for tag matches
        const keysToRemove: string[] = [];
        this.memoryCache.forEach((entry, key) => {
            if (entry.tags.includes(keyOrTag) || key.startsWith(keyOrTag)) {
                keysToRemove.push(key);
            }
        });

        keysToRemove.forEach(key => {
            this.memoryCache.delete(key);
            if (typeof window !== 'undefined') {
                localStorage.removeItem(this.getStorageKey(key));
            }
        });

        // Also clean localStorage for tag-based invalidation
        if (typeof window !== 'undefined') {
            const storageKeysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const storageKey = localStorage.key(i);
                if (storageKey?.startsWith(`${CACHE_PREFIX}:`) && storageKey.includes(keyOrTag)) {
                    storageKeysToRemove.push(storageKey);
                }
            }
            storageKeysToRemove.forEach(key => localStorage.removeItem(key));
        }

        console.log(`[CacheService] Invalidated ${keysToRemove.length} entries for: ${keyOrTag}`);
    }

    /**
     * Invalidate all cache entries for a specific user
     */
    invalidateByUser(uid: string): void {
        const keysToRemove: string[] = [];

        this.memoryCache.forEach((_, key) => {
            if (key.includes(uid)) {
                keysToRemove.push(key);
            }
        });

        keysToRemove.forEach(key => {
            this.memoryCache.delete(key);
        });

        // Clean localStorage
        if (typeof window !== 'undefined') {
            const storageKeysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const storageKey = localStorage.key(i);
                if (storageKey?.startsWith(`${CACHE_PREFIX}:`) && storageKey.includes(uid)) {
                    storageKeysToRemove.push(storageKey);
                }
            }
            storageKeysToRemove.forEach(key => localStorage.removeItem(key));
        }

        this.stats.totalEntries = this.memoryCache.size;
        console.log(`[CacheService] Cleared ${keysToRemove.length} entries for user: ${uid}`);
    }

    /**
     * Clear all cache entries
     */
    clearAll(): void {
        this.memoryCache.clear();
        this.pendingFetches.clear();

        if (typeof window !== 'undefined') {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(`${CACHE_PREFIX}:`)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        }

        this.stats.totalEntries = 0;
        console.log('[CacheService] Cleared all cache entries');
    }

    /**
     * Prefetch data into cache
     */
    async prefetch<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<void> {
        // Only prefetch if not already cached
        if (this.get(key) === null) {
            try {
                await this.getOrFetch(key, fetcher, options);
            } catch (e) {
                console.warn(`[CacheService] Prefetch failed for ${key}:`, e);
            }
        }
    }

    /**
     * Get cache statistics for debugging
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Get cache key for a specific data type and user
     */
    static buildKey(uid: string, type: string, ...parts: (string | number)[]): string {
        return [type, uid, ...parts].join(':');
    }

    // ============= Private Methods =============

    private getStorageKey(key: string): string {
        return `${CACHE_PREFIX}:${key}`;
    }

    private isValid<T>(entry: CacheEntry<T>): boolean {
        return Date.now() - entry.timestamp < entry.ttl;
    }

    private isStale<T>(entry: CacheEntry<T>): boolean {
        // Consider entry stale if it's past 80% of its TTL
        const age = Date.now() - entry.timestamp;
        return age > entry.ttl * 0.8;
    }

    private async backgroundRefresh<T>(
        key: string,
        fetcher: () => Promise<T>,
        options: CacheOptions
    ): Promise<void> {
        // Don't await - this runs in background
        fetcher().then((data) => {
            this.set(key, data, options);
            console.log(`[CacheService] Background refresh completed for: ${key}`);
        }).catch((e) => {
            console.warn(`[CacheService] Background refresh failed for ${key}:`, e);
        });
    }

    private evictOldest(): void {
        // Simple LRU-like eviction: remove oldest entry
        const oldestKey = this.memoryCache.keys().next().value;
        if (oldestKey) {
            this.memoryCache.delete(oldestKey);
        }
    }

    private cleanup(): void {
        let removed = 0;
        this.memoryCache.forEach((entry, key) => {
            if (!this.isValid(entry)) {
                this.memoryCache.delete(key);
                removed++;
            }
        });
        if (removed > 0) {
            this.stats.totalEntries = this.memoryCache.size;
            console.log(`[CacheService] Cleanup removed ${removed} expired entries`);
        }
    }
}

// ============= Singleton Export =============

export const cache = new CacheService();

// ============= Helper Functions =============

/**
 * Build a cache key for todos
 */
export function buildTodoCacheKey(uid: string, period: string, periodId: string): string {
    return CacheService.buildKey(uid, 'todo', period, periodId);
}

/**
 * Build a cache key for habits
 */
export function buildHabitsCacheKey(uid: string, year: number, month: number): string {
    return CacheService.buildKey(uid, 'habits', `${year}-${month}`);
}

/**
 * Build a cache key for goals
 */
export function buildGoalsCacheKey(uid: string): string {
    return CacheService.buildKey(uid, 'goals', 'current');
}

/**
 * Build a cache key for journal entries
 */
export function buildJournalCacheKey(uid: string, dateStr: string): string {
    return CacheService.buildKey(uid, 'journal', dateStr);
}

/**
 * Build a cache key for entry dates (calendar markers)
 */
export function buildEntryDatesCacheKey(uid: string, year: number, month: number): string {
    return CacheService.buildKey(uid, 'entryDates', `${year}-${month}`);
}

/**
 * Build a cache key for profile
 */
export function buildProfileCacheKey(uid: string): string {
    return CacheService.buildKey(uid, 'profile');
}
