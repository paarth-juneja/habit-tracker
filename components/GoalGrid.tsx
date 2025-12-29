'use client';

import GoalCard from './GoalCard';
import styles from './GoalGrid.module.css';

interface Goals {
    tenYear: string;
    fiveYear: string;
    oneYear: string;
    sixMonth: string;
    fourMonth: string;
    oneMonth: string;
    weekly: string;
}

interface GoalGridProps {
    goals: Goals;
    onGoalChange: (key: keyof Goals, value: string) => void;
}

const goalConfig = [
    { key: 'tenYear' as const, title: '10 Year Vision', subtitle: '10 Years', color: '#ef4444' },
    { key: 'fiveYear' as const, title: '5 Year Goal', subtitle: '5 Years', color: '#f97316' },
    { key: 'oneYear' as const, title: '1 Year Goal', subtitle: '1 Year', color: '#eab308' },
    { key: 'sixMonth' as const, title: '6 Month Goal', subtitle: '6 Months', color: '#22c55e' },
    { key: 'fourMonth' as const, title: '4 Month Goal', subtitle: '4 Months', color: '#14b8a6' },
    { key: 'oneMonth' as const, title: '1 Month Goal', subtitle: '1 Month', color: '#3b82f6' },
    { key: 'weekly' as const, title: 'This Week', subtitle: 'Weekly', color: '#a855f7' },
];

export default function GoalGrid({ goals, onGoalChange }: GoalGridProps) {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.sectionTitle}>Your Goals</h2>
                <p className={styles.sectionSubtitle}>
                    Break down your vision into actionable timeframes
                </p>
            </div>
            <div className={styles.grid}>
                {goalConfig.map((config) => (
                    <GoalCard
                        key={config.key}
                        title={config.title}
                        subtitle={config.subtitle}
                        value={goals[config.key]}
                        onChange={(value) => onGoalChange(config.key, value)}
                        accentColor={config.color}
                    />
                ))}
            </div>
        </div>
    );
}
