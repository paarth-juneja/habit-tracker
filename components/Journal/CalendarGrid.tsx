'use client';

import styles from './CalendarGrid.module.css';

interface CalendarGridProps {
    currentMonth: Date;
    selectedDate: Date | null;
    entryDates: string[]; // List of YYYY-MM-DD strings that have entries
    onDateSelect: (date: Date) => void;
}

export default function CalendarGrid({ currentMonth, selectedDate, entryDates, onDateSelect }: CalendarGridProps) {
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return days;
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);

    // Create array of days to render
    const days = [];

    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const today = new Date();

    return (
        <div className={styles.container}>
            <div className={styles.weekdays}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className={styles.weekday}>{day}</div>
                ))}
            </div>
            <div className={styles.grid}>
                {days.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className={styles.dayEmpty} />;
                    }

                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const dateStr = formatDate(date);
                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                    const isToday = isSameDay(date, today);
                    const hasEntry = entryDates.includes(dateStr);

                    return (
                        <button
                            key={day}
                            onClick={() => onDateSelect(date)}
                            className={`
                                ${styles.day} 
                                ${isSelected ? styles.selected : ''} 
                                ${isToday ? styles.today : ''}
                                ${hasEntry ? styles.hasEntry : ''}
                            `}
                        >
                            {day}
                            {hasEntry && <div className={styles.entryDot} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
