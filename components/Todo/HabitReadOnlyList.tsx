'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from './HabitReadOnlyList.module.css';

interface Habit {
    id: string;
    name: string;
}

interface HabitReadOnlyListProps {
    date: Date;
}

export default function HabitReadOnlyList({ date }: HabitReadOnlyListProps) {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchHabits = async () => {
            setLoading(true);
            try {
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                const docRef = doc(db, `users/${user.uid}/habits/${year}-${month}`);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.list) {
                        setHabits(data.list);
                    } else {
                        setHabits([]);
                    }
                } else {
                    setHabits([]);
                }
            } catch (error) {
                console.error("Error fetching habits:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHabits();
    }, [user, date]);

    return (
        <div className={styles.container}>
            <h3 className={styles.header}>Habits</h3>
            <div className={styles.list}>
                {loading ? (
                    <div className={styles.empty}>Loading...</div>
                ) : habits.length > 0 ? (
                    habits.map(habit => (
                        <div key={habit.id} className={styles.item}>
                            <span className={styles.bullet}>•</span>
                            <span className={styles.name}>{habit.name}</span>
                        </div>
                    ))
                ) : (
                    <div className={styles.empty}>No habits for this month</div>
                )}
            </div>
        </div>
    );
}
