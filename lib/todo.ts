
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, documentId } from 'firebase/firestore';

export type TodoPeriod = 'daily' | 'weekly' | 'monthly';

export interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
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

export const getTodoList = async (userId: string, period: TodoPeriod, periodId: string): Promise<TodoItem[]> => {
    const docRef = doc(db, `users/${userId}/todos_${period}/${periodId}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().items as TodoItem[];
    }
    return [];
};

export const saveTodoList = async (userId: string, period: TodoPeriod, periodId: string, items: TodoItem[]) => {
    const docRef = doc(db, `users/${userId}/todos_${period}/${periodId}`);
    await setDoc(docRef, { items }, { merge: true });
};

// Subscription for real-time updates
export const subscribeTodoList = (userId: string, period: TodoPeriod, periodId: string, callback: (items: TodoItem[]) => void) => {
    const docRef = doc(db, `users/${userId}/todos_${period}/${periodId}`);
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data().items as TodoItem[]);
        } else {
            callback([]);
        }
    });
};

export const getTodoDatesForMonth = async (userId: string, date: Date): Promise<string[]> => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

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
};
