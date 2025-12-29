'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './page.module.css';

interface UserProfile {
    firstName: string;
    lastName: string;
    age: string;
    occupation: string;
    gender: 'male' | 'female' | 'other' | '';
}

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile>({
        firstName: '',
        lastName: '',
        age: '',
        occupation: '',
        gender: ''
    });
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Fetch user profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;

            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().profile) {
                    setProfile(docSnap.data().profile as UserProfile);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setMessage({ type: 'error', text: 'Failed to load profile data' });
            } finally {
                setIsLoadingData(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                profile: profile
            }, { merge: true });

            setMessage({ type: 'success', text: 'Profile updated successfully!' });

            // Clear success message after 3 seconds
            setTimeout(() => {
                setMessage(null);
            }, 3000);
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading || isLoadingData) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    <h1 className={styles.title}>Your Profile</h1>

                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="firstName" className={styles.label}>First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={profile.firstName}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter your first name"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="lastName" className={styles.label}>Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={profile.lastName}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter your last name"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="age" className={styles.label}>Age</label>
                            <input
                                type="number"
                                id="age"
                                name="age"
                                value={profile.age}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter your age"
                                min="0"
                                max="120"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="occupation" className={styles.label}>Occupation</label>
                            <input
                                type="text"
                                id="occupation"
                                name="occupation"
                                value={profile.occupation}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="What do you do?"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="gender" className={styles.label}>Gender</label>
                            <select
                                id="gender"
                                name="gender"
                                value={profile.gender}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="" disabled>Select your gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className={styles.saveButton}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
