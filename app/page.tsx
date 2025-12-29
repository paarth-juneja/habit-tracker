'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useAuth } from '@/components/AuthProvider';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Home() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    const handleGoogleSignIn = async () => {
        setIsSigningIn(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // Router redirect handled by useEffect
        } catch (error) {
            console.error("Error signing in", error);
            setIsSigningIn(false);
        }
    };

    if (loading || isSigningIn) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <main className={styles.main}>
            <div className={styles.hero}>
                <div className={styles.heroContent}>
                    <span className={styles.badge}>🎯 Goal Tracking Made Simple</span>
                    <h1 className={styles.title}>
                        Transform Your <span className={styles.gradient}>Dreams</span> Into
                        <span className={styles.gradient}> Daily Actions</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Set goals from your 10-year vision to this week's tasks.
                        Track daily habits with our intuitive monthly grid.
                        Watch yourself grow, one checkmark at a time.
                    </p>

                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>📅</span>
                            <span>Multi-timeframe Goals</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>✅</span>
                            <span>Daily Habit Tracking</span>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>☁️</span>
                            <span>Cloud Sync + Offline</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        className={styles.googleButton}
                        disabled={isSigningIn}
                    >
                        <svg className={styles.googleIcon} viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <p className={styles.privacy}>
                        Your data is securely stored and only accessible by you.
                    </p>
                </div>

                <div className={styles.heroVisual}>
                    <div className={styles.mockup}>
                        <div className={styles.mockupHeader}>
                            <div className={styles.mockupDots}>
                                <span></span><span></span><span></span>
                            </div>
                            <span className={styles.mockupTitle}>Your Dashboard</span>
                        </div>
                        <div className={styles.mockupContent}>
                            <div className={styles.mockupGoal}>
                                <span className={styles.mockupGoalTitle}>10 Year Vision</span>
                                <span className={styles.mockupGoalText}>Build a successful tech company...</span>
                            </div>
                            <div className={styles.mockupHabits}>
                                <div className={styles.mockupHabitRow}>
                                    <span>Exercise</span>
                                    <div className={styles.mockupChecks}>
                                        <span className={styles.checked}>✓</span>
                                        <span className={styles.checked}>✓</span>
                                        <span></span>
                                        <span className={styles.checked}>✓</span>
                                        <span className={styles.checked}>✓</span>
                                    </div>
                                </div>
                                <div className={styles.mockupHabitRow}>
                                    <span>Read</span>
                                    <div className={styles.mockupChecks}>
                                        <span className={styles.checked}>✓</span>
                                        <span className={styles.checked}>✓</span>
                                        <span className={styles.checked}>✓</span>
                                        <span className={styles.checked}>✓</span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
