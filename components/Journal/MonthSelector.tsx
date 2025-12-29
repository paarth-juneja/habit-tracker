'use client';

import { useState } from 'react';
import styles from './MonthSelector.module.css';
import YearMonthPicker from './YearMonthPicker';

interface MonthSelectorProps {
    currentDate: Date;
    onMonthChange: (date: Date) => void;
}

export default function MonthSelector({ currentDate, onMonthChange }: MonthSelectorProps) {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        onMonthChange(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        onMonthChange(newDate);
    };

    const formattedMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className={styles.container}>
            <button onClick={handlePrevMonth} className={styles.arrowBtn} aria-label="Previous month">
                ←
            </button>
            <h2
                className={styles.monthTitle}
                onClick={() => setIsPickerOpen(true)}
                title="Click to jump to date"
            >
                {formattedMonth}
            </h2>
            <button onClick={handleNextMonth} className={styles.arrowBtn} aria-label="Next month">
                →
            </button>

            {isPickerOpen && (
                <YearMonthPicker
                    currentDate={currentDate}
                    onSelect={onMonthChange}
                    onClose={() => setIsPickerOpen(false)}
                />
            )}
        </div>
    );
}
