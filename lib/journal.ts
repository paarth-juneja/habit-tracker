import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { cache, buildJournalCacheKey, CacheTTL } from './cacheService';

export interface JournalEntry {
    date: string; // YYYY-MM-DD
    content: string;
    updatedAt: number;
}

const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

export const getJournalEntry = async (userId: string, date: Date): Promise<string> => {
    const dateStr = formatDate(date);
    const cacheKey = buildJournalCacheKey(userId, dateStr);

    return cache.getOrFetch(
        cacheKey,
        async () => {
            const docRef = doc(db, `users/${userId}/journal_entries/${dateStr}`);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data().content || '';
            }
            return '';
        },
        {
            ttl: CacheTTL.JOURNAL,
            useStorage: true,
            tags: [`journal:${userId}`]
        }
    );
};

export const saveJournalEntry = async (userId: string, date: Date, content: string): Promise<void> => {
    const dateStr = formatDate(date);
    const docRef = doc(db, `users/${userId}/journal_entries/${dateStr}`);
    const cacheKey = buildJournalCacheKey(userId, dateStr);

    if (!content.trim()) {
        await deleteDoc(docRef);
        // Set empty string in cache
        cache.set(cacheKey, '', {
            ttl: CacheTTL.JOURNAL,
            useStorage: true,
            tags: [`journal:${userId}`]
        });
    } else {
        await setDoc(docRef, {
            date: dateStr,
            content,
            updatedAt: Date.now()
        }, { merge: true });
        // Update cache with new content
        cache.set(cacheKey, content, {
            ttl: CacheTTL.JOURNAL,
            useStorage: true,
            tags: [`journal:${userId}`]
        });
    }

    // Invalidate journal dates cache for this month
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    cache.invalidate(`journalDates:${userId}:${year}-${month}`);
};

/**
 * Fetches all dates in the given month that have a journal entry.
 */
export const getJournalDatesForMonth = async (userId: string, monthDate: Date): Promise<string[]> => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;
    const cacheKey = `journalDates:${userId}:${year}-${month}`;

    return cache.getOrFetch(
        cacheKey,
        async () => {
            const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
            // next month
            const currentMonthIndex = monthDate.getMonth();
            const currentYear = monthDate.getFullYear();

            const nextMonthIndex = currentMonthIndex + 1;
            const nextMonthYear = nextMonthIndex > 11 ? currentYear + 1 : currentYear;
            const normalizedNextMonthIndex = nextMonthIndex > 11 ? 0 : nextMonthIndex;

            const endStr = `${nextMonthYear}-${String(normalizedNextMonthIndex + 1).padStart(2, '0')}-01`;

            const q = query(
                collection(db, `users/${userId}/journal_entries`),
                where('date', '>=', startStr),
                where('date', '<', endStr)
            );

            const querySnapshot = await getDocs(q);

            return querySnapshot.docs.map(doc => doc.data().date);
        },
        {
            ttl: CacheTTL.ENTRY_DATES,
            useStorage: true,
            staleWhileRevalidate: true,
            tags: [`journalDates:${userId}`]
        }
    );
};
