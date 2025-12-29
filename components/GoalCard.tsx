'use client';

import { useState, useEffect } from 'react';
import styles from './GoalCard.module.css';

interface GoalCardProps {
    title: string;
    subtitle: string;
    value: string;
    onChange: (value: string) => void;
    accentColor: string;
}

export default function GoalCard({ title, subtitle, value, onChange, accentColor }: GoalCardProps) {
    const [localValue, setLocalValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onChange(localValue);
        }
    };

    return (
        <div
            className={styles.card}
            style={{ '--accent-color': accentColor } as React.CSSProperties}
        >
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                <span className={styles.subtitle}>{subtitle}</span>
            </div>
            <div className={styles.content}>
                <textarea
                    className={styles.textarea}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onFocus={() => setIsEditing(true)}
                    onBlur={handleBlur}
                    placeholder={`What do you want to achieve in ${subtitle.toLowerCase()}?`}
                    rows={4}
                />
                {isEditing && (
                    <div className={styles.editingIndicator}>
                        <span className={styles.dot}></span>
                        Editing...
                    </div>
                )}
            </div>
        </div>
    );
}
