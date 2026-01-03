
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { cache, buildTodoCacheKey, buildEntryDatesCacheKey, CacheTTL } from './cacheService';

export type TodoPeriod = 'daily' | 'weekly' | 'monthly';

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
    dueDate?: number;
    notes?: string;
    steps?: { id: string; text: string; completed: boolean; }[];
}

export interface TodoList {
    id: string; // The period-specific ID (e.g., "2023-10-27")
    items: TodoItem[];
}

// Helpers to generate IDs based on date
export const getDailyId = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const getWeeklyId = (date: Date): string => {
    // ISO Week calculation logic could be complex, but let's stick to a simple standard:
    // This helper should return "YYYY-Www"
    // Using a library like date-fns would be better, but we can do a simple version or just rely on 'current' week logic if we are careful.
    // Let's implement a simple getWeekNumber
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const getMonthlyId = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
};

// Get TTL based on period type
const getPeriodTTL = (period: TodoPeriod): number => {
    switch (period) {
        case 'daily': return CacheTTL.TODOS_DAILY;
        case 'weekly': return CacheTTL.TODOS_WEEKLY;
        case 'monthly': return CacheTTL.TODOS_MONTHLY;
        default: return CacheTTL.TODOS_DAILY;
    }
};

export const getTodoList = async (userId: string, period: TodoPeriod, periodId: string): Promise<TodoItem[]> => {
    const cacheKey = buildTodoCacheKey(userId, period, periodId);

    return cache.getOrFetch(
        cacheKey,
        async () => {
            const docRef = doc(db, `users/${userId}/todos_${period}/${periodId}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().items as TodoItem[];
            }
            return [];
        },
        {
            ttl: getPeriodTTL(period),
            useStorage: true,
            staleWhileRevalidate: true,
            tags: [`todo:${userId}`, `period:${period}`]
        }
    );
};

// Helper to remove undefined values from TodoItem (Firebase doesn't support undefined)
const cleanTodoItem = (item: TodoItem): Partial<TodoItem> & Pick<TodoItem, 'id' | 'text' | 'completed' | 'createdAt'> => {
    const cleaned: Partial<TodoItem> & Pick<TodoItem, 'id' | 'text' | 'completed' | 'createdAt'> = {
        id: item.id,
        text: item.text,
        completed: item.completed,
        createdAt: item.createdAt,
    };
    if (item.dueDate !== undefined) cleaned.dueDate = item.dueDate;
    if (item.notes !== undefined) cleaned.notes = item.notes;
    if (item.steps !== undefined) cleaned.steps = item.steps;
    return cleaned;
};

export const saveTodoList = async (userId: string, period: TodoPeriod, periodId: string, items: TodoItem[]) => {
    const docRef = doc(db, `users/${userId}/todos_${period}/${periodId}`);
    // Clean items to remove undefined values before saving
    const cleanedItems = items.map(cleanTodoItem);
    await setDoc(docRef, { items: cleanedItems }, { merge: true });

    // Update cache with the new data (optimistic update)
    const cacheKey = buildTodoCacheKey(userId, period, periodId);
    cache.set(cacheKey, items, {
        ttl: getPeriodTTL(period),
        useStorage: true,
        tags: [`todo:${userId}`, `period:${period}`]
    });

    // Invalidate entry dates cache if daily todo was modified
    if (period === 'daily') {
        // Extract year-month from periodId (format: YYYY-MM-DD)
        const [year, month] = periodId.split('-').map(Number);
        const entryDatesKey = buildEntryDatesCacheKey(userId, year, month);
        cache.invalidate(entryDatesKey);
    }
};

// Subscription for real-time updates - also updates cache
export const subscribeTodoList = (userId: string, period: TodoPeriod, periodId: string, callback: (items: TodoItem[]) => void) => {
    const docRef = doc(db, `users/${userId}/todos_${period}/${periodId}`);
    const cacheKey = buildTodoCacheKey(userId, period, periodId);

    return onSnapshot(docRef, (docSnap) => {
        let items: TodoItem[] = [];
        if (docSnap.exists()) {
            items = docSnap.data().items as TodoItem[];
        }

        // Update cache with real-time data
        cache.set(cacheKey, items, {
            ttl: getPeriodTTL(period),
            useStorage: true,
            tags: [`todo:${userId}`, `period:${period}`]
        });

        callback(items);
    });
};

export const getTodoDatesForMonth = async (userId: string, date: Date): Promise<string[]> => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const cacheKey = buildEntryDatesCacheKey(userId, year, month);

    return cache.getOrFetch(
        cacheKey,
        async () => {
            const startId = `${year}-${String(month).padStart(2, '0')}-01`;
            // End ID is start of next month
            // Handle Dec -> Jan
            const nextMonthDate = new Date(year, month, 1); // month is 0-indexed in Date constructor (0-11), so 'month' (1-12) works as next month
            const nextYear = nextMonthDate.getFullYear();
            const nextMonth = nextMonthDate.getMonth() + 1;
            const endId = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

            const q = query(
                collection(db, `users/${userId}/todos_daily`),
                where(documentId(), '>=', startId),
                where(documentId(), '<', endId)
            );

            const snapshot = await getDocs(q);
            const dates: string[] = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                    dates.push(doc.id);
                }
            });

            return dates;
        },
        {
            ttl: CacheTTL.ENTRY_DATES,
            useStorage: true,
            staleWhileRevalidate: true,
            tags: [`entryDates:${userId}`]
        }
    );
};
