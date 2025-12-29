import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';

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
    const docRef = doc(db, `users/${userId}/journal_entries/${dateStr}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data().content || '';
    }
    return '';
};

export const saveJournalEntry = async (userId: string, date: Date, content: string): Promise<void> => {
    const dateStr = formatDate(date);
    const docRef = doc(db, `users/${userId}/journal_entries/${dateStr}`);

    if (!content.trim()) {
        await deleteDoc(docRef);
    } else {
        await setDoc(docRef, {
            date: dateStr,
            content,
            updatedAt: Date.now()
        }, { merge: true });
    }
};

/**
 * Fetches all dates in the given month that have a journal entry.
 */
export const getJournalDatesForMonth = async (userId: string, monthDate: Date): Promise<string[]> => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;

    // We can't easily query by partial ID or date string without a precise range or extra fields.
    // Instead of complex range queries on doc IDs, we'll store a "month" field or just scan the collection if it's small?
    // "users/{userId}/journal_entries" could get large.
    // Best practice: Store 'year-month' field (e.g., "2025-12") to query.
    // Since we didn't plan for that, we can query by range on the 'date' field if we store it as a field (which we do).

    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    // End date is tricky, but we can query date >= startDateStr and date <= endDateStr.
    // Or just start with '2025-12', since lexicographical strings work.

    const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
    // next month
    const nextMonthDate = new Date(year, month, 1); // JS Date month 0-11, so passing month (1-12) gives next month.
    // Actually new Date(year, monthIndex) -> month is 0-indexed.
    // monthDate.getMonth() is 0-indexed. 
    // If monthDate is Dec 2025 (month=11), we want dates starting with "2025-12".
    // Query: date >= "2025-12-01" AND date < "2026-01-01"

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
};
