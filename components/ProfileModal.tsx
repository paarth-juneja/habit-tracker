'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Modal from './Modal';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './ProfileModal.module.css';

interface UserProfile {
    firstName: string;
    lastName: string;
    age: string;
    occupation: string;
    gender: 'male' | 'female' | 'other' | '';
}

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user } = useAuth();
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

    // Fetch user profile whenever modal opens
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setIsLoadingData(true);
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

        if (isOpen && user) {
            fetchProfile();
            setMessage(null);
        }
    }, [isOpen, user]);

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
                // Optional: onClose(); // Do we want to close on save? Usually better to let user close.
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
            {isLoadingData ? (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading profile...</p>
                </div>
            ) : (
                <>
                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="modal-firstName" className={styles.label}>First Name</label>
                            <input
                                type="text"
                                id="modal-firstName"
                                name="firstName"
                                value={profile.firstName}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter your first name"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="modal-lastName" className={styles.label}>Last Name</label>
                            <input
                                type="text"
                                id="modal-lastName"
                                name="lastName"
                                value={profile.lastName}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="Enter your last name"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="modal-age" className={styles.label}>Age</label>
                            <input
                                type="number"
                                id="modal-age"
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
                            <label htmlFor="modal-occupation" className={styles.label}>Occupation</label>
                            <input
                                type="text"
                                id="modal-occupation"
                                name="occupation"
                                value={profile.occupation}
                                onChange={handleChange}
                                className={styles.input}
                                placeholder="What do you do?"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="modal-gender" className={styles.label}>Gender</label>
                            <select
                                id="modal-gender"
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
                </>
            )}
        </Modal>
    );
}
