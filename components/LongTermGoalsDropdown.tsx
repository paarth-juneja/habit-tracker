'use client';

import { useState } from 'react';
import styles from './LongTermGoalsDropdown.module.css';

interface Goals {
    tenYear: string;
    fiveYear: string;
    oneYear: string;
    sixMonth: string;
    oneMonth: string;
    weekly: string;
}

interface LongTermGoalsDropdownProps {
    goals: Goals;
    onGoalChange: (key: keyof Goals, value: string) => void;
}

// Ascending order: This Month → 6 Month → 1 Year → 5 Year → 10 Year
const longTermGoalConfig = [
    { key: 'oneMonth' as const, title: 'This Month Goal', subtitle: 'This Month', color: '#3b82f6' },
    { key: 'sixMonth' as const, title: '6 Month Goal', subtitle: '6 Months', color: '#22c55e' },
    { key: 'oneYear' as const, title: '1 Year Goal', subtitle: '1 Year', color: '#eab308' },
    { key: 'fiveYear' as const, title: '5 Year Goal', subtitle: '5 Years', color: '#f97316' },
    { key: 'tenYear' as const, title: '10 Year Vision', subtitle: '10 Years', color: '#ef4444' },
];

export default function LongTermGoalsDropdown({ goals, onGoalChange }: LongTermGoalsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<keyof Goals | null>(null);
    const [localValue, setLocalValue] = useState('');

    const handleStartEdit = (key: keyof Goals) => {
        setEditingKey(key);
        setLocalValue(goals[key]);
    };

    const handleSave = () => {
        if (editingKey && localValue !== goals[editingKey]) {
            onGoalChange(editingKey, localValue);
        }
        setEditingKey(null);
        setLocalValue('');
    };

    return (
        <div className={styles.container}>
            <button
                className={styles.toggleButton}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.toggleIcon}>{isOpen ? '▼' : '▶'}</span>
                <span className={styles.toggleText}>Long Term Goals</span>
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    {longTermGoalConfig.map((config) => (
                        <div
                            key={config.key}
                            className={styles.goalItem}
                            style={{ '--accent-color': config.color } as React.CSSProperties}
                        >
                            <div className={styles.goalHeader}>
                                <span className={styles.goalTitle}>{config.title}</span>
                                <span className={styles.goalSubtitle}>{config.subtitle}</span>
                            </div>
                            <div className={styles.goalContent}>
                                {editingKey === config.key ? (
                                    <textarea
                                        className={styles.textarea}
                                        value={localValue}
                                        onChange={(e) => setLocalValue(e.target.value)}
                                        onBlur={handleSave}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setEditingKey(null);
                                            }
                                        }}
                                        placeholder={`What do you want to achieve in ${config.subtitle.toLowerCase()}?`}
                                        rows={3}
                                        autoFocus
                                    />
                                ) : (
                                    <div
                                        className={styles.goalText}
                                        onClick={() => handleStartEdit(config.key)}
                                    >
                                        {goals[config.key] || (
                                            <span className={styles.placeholder}>
                                                Click to add your {config.subtitle.toLowerCase()} goal...
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
