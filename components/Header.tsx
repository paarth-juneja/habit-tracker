'use client';

import Image from 'next/image';
import styles from './Header.module.css';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function Header() {
    const { user } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🎯</span>
                    <span className={styles.logoText}>Habit Tracker</span>
                </div>

                {user && (
                    <div className={styles.userSection}>
                        <div className={styles.userInfo}>
                            {user.photoURL && (
                                <Image
                                    src={user.photoURL}
                                    alt="Profile"
                                    width={36}
                                    height={36}
                                    className={styles.avatar}
                                />
                            )}
                            <span className={styles.userName}>{user.displayName}</span>
                        </div>
                        <nav className={styles.navLinks}>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className={styles.navBtn}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => router.push('/journal')}
                                className={styles.navBtn}
                            >
                                Journal
                            </button>
                            <button
                                onClick={() => router.push('/todo')}
                                className={styles.navBtn}
                            >
                                To-Do
                            </button>
                        </nav>
                        <button
                            onClick={() => router.push('/profile')}
                            className={styles.profileBtn}
                        >
                            Profile
                        </button>
                        <button
                            onClick={handleSignOut}
                            className={styles.signOutBtn}
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
