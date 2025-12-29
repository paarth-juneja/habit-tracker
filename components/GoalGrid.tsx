'use client';

import GoalCard from './GoalCard';
import styles from './GoalGrid.module.css';

interface Goals {
    tenYear: string;
    fiveYear: string;
    oneYear: string;
    sixMonth: string;
    oneMonth: string;
    weekly: string;
}

interface GoalGridProps {
    goals: Goals;
    onGoalChange: (key: keyof Goals, value: string) => void;
}

// Main grid only shows This Month Goal and This Week
// Long-term goals are in the LongTermGoalsDropdown
const goalConfig = [
    { key: 'oneMonth' as const, title: 'This Month Goal', subtitle: 'This Month', color: '#3b82f6' },
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
