'use client';

import Image from 'next/image';
import styles from './Header.module.css';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Header() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await logout();
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <Image
                        src="/everform-logo.png"
                        alt="Everform Logo"
                        width={32}
                        height={32}
                        className={styles.logoImage}
                    />
                    <span className={styles.logoText}>Everform</span>
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
                                onClick={() => router.push('/todo')}
                                className={styles.navBtn}
                            >
                                To-Do
                            </button>
                            <button
                                onClick={() => router.push('/journal')}
                                className={styles.navBtn}
                            >
                                Journal
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
