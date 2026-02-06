'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import HabitCompletionGraph from '@/components/HabitCompletionGraph';
import styles from './MonthlyTracker.module.css';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface Habit {
    id: string;
    completedDays: number[];
    createdAt?: number;
}

export default function MonthlyTrackerPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // State
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [loadedMonths, setLoadedMonths] = useState<Record<string, Habit[]>>({});
    const [loadingMonths, setLoadingMonths] = useState<string[]>([]);

    const today = new Date();
    const realCurrentYear = today.getFullYear();
    const realCurrentMonth = today.getMonth() + 1;

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Calculate available months for the selected year
    const availableMonths = useMemo(() => {
        if (currentYear > realCurrentYear) return [];

        const months = [];
        const limitMonth = currentYear === realCurrentYear ? realCurrentMonth : 12;

        for (let m = limitMonth; m >= 1; m--) {
            months.push(m);
        }
        return months;
    }, [currentYear, realCurrentYear, realCurrentMonth]);

    // Auto-load data when year changes or months become available
    useEffect(() => {
        if (!user) return;

        // Avoid fetching if already loading or loaded (can refine this logic)
        availableMonths.forEach(month => {
            const monthKey = `${currentYear}-${month}`;
            if (!loadedMonths[monthKey] && !loadingMonths.includes(monthKey)) {
                fetchMonthData(month);
            }
        });
    }, [currentYear, availableMonths, user]); // loadedMonths dependency skipped to avoid loops, explicit checks inside

    const handleYearChange = (change: number) => {
        setCurrentYear(prev => prev + change);
    };

    const fetchMonthData = async (month: number) => {
        if (!user) return;

        const monthKey = `${currentYear}-${month}`;
        // Prevent duplicate fetch
        if (loadingMonths.includes(monthKey)) return;

        setLoadingMonths(prev => [...prev, monthKey]);

        try {
            const habitsRef = doc(db, 'users', user.uid, 'habits', monthKey);
            const docSnap = await getDoc(habitsRef);

            if (docSnap.exists()) {
                setLoadedMonths(prev => ({
                    ...prev,
                    [monthKey]: docSnap.data().list || []
                }));
            } else {
                setLoadedMonths(prev => ({
                    ...prev,
                    [monthKey]: []
                }));
            }
        } catch (error) {
            console.error('Error fetching habits:', error);
        } finally {
            setLoadingMonths(prev => prev.filter(k => k !== monthKey));
        }
    };

    const getMonthName = (month: number) => {
        return new Date(currentYear, month - 1).toLocaleString('default', { month: 'long' });
    };

    if (loading) return null; // Or reuse loading spinner
    if (!user) return null;

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.headerSection}>
                        <h1 className={styles.title}>Monthly Habit Tracker</h1>

                        <div className={styles.yearSelector}>
                            <button
                                className={styles.yearButton}
                                onClick={() => handleYearChange(-1)}
                                aria-label="Previous Year"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 18l-6-6 6-6" />
                                </svg>
                            </button>
                            <span className={styles.currentYear}>{currentYear}</span>
                            <button
                                className={styles.yearButton}
                                onClick={() => handleYearChange(1)}
                                disabled={currentYear >= realCurrentYear}
                                style={{ opacity: currentYear >= realCurrentYear ? 0.5 : 1 }}
                                aria-label="Next Year"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className={styles.monthsGrid}>
                        {availableMonths.map(month => {
                            const monthKey = `${currentYear}-${month}`;
                            const isLoaded = loadedMonths.hasOwnProperty(monthKey);
                            const isLoading = loadingMonths.includes(monthKey);
                            const habits = loadedMonths[monthKey] || [];

                            return (
                                <div key={month} className={styles.monthCard}>
                                    <div className={styles.monthHeader}>
                                        <h2 className={styles.monthTitle}>{getMonthName(month)}</h2>
                                        <button
                                            className={styles.refreshButton}
                                            onClick={() => fetchMonthData(month)}
                                            disabled={isLoading}
                                            title="Refresh Graph"
                                        >
                                            {isLoading ? (
                                                <div className={styles.spinner} style={{ width: 14, height: 14, borderWidth: 2 }} />
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M23 4v6h-6"></path>
                                                    <path d="M1 20v-6h6"></path>
                                                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                                </svg>
                                            )}
                                            {/* Text removed for cleaner look, icon is sufficient with title, or just keep 'Refresh' if user prefers clarity */}
                                            <span style={{ marginLeft: 6 }}>Refresh</span>
                                        </button>
                                    </div>

                                    <div className={styles.graphContainer}>
                                        {isLoading ? (
                                            <div className={styles.loadingState}>
                                                <div className={styles.spinner}></div>
                                                <span>Loading data...</span>
                                            </div>
                                        ) : isLoaded ? (
                                            habits.length > 0 ? (
                                                <div className={styles.graphWrapper}>
                                                    <HabitCompletionGraph
                                                        habits={habits}
                                                        year={currentYear}
                                                        month={month}
                                                        leftOffset={50}
                                                    />
                                                </div>
                                            ) : (
                                                <div className={styles.emptyState}>
                                                    No habits recorded for this month
                                                </div>
                                            )
                                        ) : (
                                            <div className={styles.loadingState}>
                                                {/* Should generally not happen with auto-load, but fallback to loading or initial state */}
                                                <div className={styles.spinner}></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
