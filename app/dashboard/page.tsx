'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import GoalGrid from '@/components/GoalGrid';
import HabitTracker from '@/components/HabitTracker';
import styles from './page.module.css';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface Goals {
    tenYear: string;
    fiveYear: string;
    oneYear: string;
    sixMonth: string;
    fourMonth: string;
    oneMonth: string;
    weekly: string;
}

interface Habit {
    id: string;
    name: string;
    completedDays: number[];
}

const defaultGoals: Goals = {
    tenYear: '',
    fiveYear: '',
    oneYear: '',
    sixMonth: '',
    fourMonth: '',
    oneMonth: '',
    weekly: '',
};

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [goals, setGoals] = useState<Goals>(defaultGoals);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Real-time listener for goals
    useEffect(() => {
        if (!user) return;

        const goalsRef = doc(db, 'users', user.uid, 'goals', 'current');
        const unsubscribe = onSnapshot(goalsRef, (docSnap) => {
            if (docSnap.exists()) {
                setGoals(docSnap.data() as Goals);
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Real-time listener for habits (specific month)
    useEffect(() => {
        if (!user) return;

        const habitsRef = doc(db, 'users', user.uid, 'habits', `${currentYear}-${currentMonth}`);
        const unsubscribe = onSnapshot(habitsRef, (docSnap) => {
            if (docSnap.exists()) {
                setHabits(docSnap.data().list || []);
            } else {
                setHabits([]);
            }
        });

        return () => unsubscribe();
    }, [user, currentYear, currentMonth]);

    // Save goals handler
    const handleGoalChange = useCallback(
        async (key: keyof Goals, value: string) => {
            if (!user) return;

            const newGoals = { ...goals, [key]: value };
            // Optimistic update
            setGoals(newGoals);
            setIsSaving(true);

            try {
                const goalsRef = doc(db, 'users', user.uid, 'goals', 'current');
                await setDoc(goalsRef, newGoals, { merge: true });
                setLastSaved(new Date());
            } catch (error) {
                console.error('Failed to save goals:', error);
                // Revert or show error could be added here
            } finally {
                setIsSaving(false);
            }
        },
        [goals, user]
    );

    // Save habits handler
    const handleHabitsChange = useCallback(
        async (newHabits: Habit[]) => {
            if (!user) return;

            // Optimistic update
            setHabits(newHabits);
            setIsSaving(true);

            try {
                const habitsRef = doc(db, 'users', user.uid, 'habits', `${currentYear}-${currentMonth}`);
                await setDoc(habitsRef, {
                    list: newHabits,
                    year: currentYear,
                    month: currentMonth
                }, { merge: true });
                setLastSaved(new Date());
            } catch (error) {
                console.error('Failed to save habits:', error);
            } finally {
                setIsSaving(false);
            }
        },
        [currentYear, currentMonth, user]
    );

    // Month change handler
    const handleMonthChange = (year: number, month: number) => {
        setCurrentYear(year);
        setCurrentMonth(month);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Status Bar */}
                    <div className={styles.statusBar}>
                        {isSaving && (
                            <span className={styles.savingIndicator}>
                                <span className={styles.savingDot}></span>
                                Saving...
                            </span>
                        )}
                        {!isSaving && lastSaved && (
                            <span className={styles.savedIndicator}>
                                ✓ Saved
                            </span>
                        )}
                    </div>

                    {/* Goals Section */}
                    <GoalGrid goals={goals} onGoalChange={handleGoalChange} />

                    {/* Habit Tracker Section */}
                    <HabitTracker
                        habits={habits}
                        year={currentYear}
                        month={currentMonth}
                        onHabitsChange={handleHabitsChange}
                        onMonthChange={handleMonthChange}
                    />
                </div>
            </main>
        </div>
    );
}
