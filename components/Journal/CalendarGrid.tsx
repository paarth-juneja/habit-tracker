'use client';

import styles from './CalendarGrid.module.css';
import { useDroppable } from '@dnd-kit/core';

interface CalendarGridProps {
    currentMonth: Date;
    selectedDate: Date | null;
    entryDates: string[]; // List of YYYY-MM-DD strings that have entries
    onDateSelect: (date: Date) => void;
}

function CalendarDay({ day, currentMonth, selectedDate, entryDates, onDateSelect }: {
    day: number | null,
    currentMonth: Date,
    selectedDate: Date | null,
    entryDates: string[],
    onDateSelect: (date: Date) => void
}) {
    // Helper for date string
    const formatDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const today = new Date();

    // Prepare Date Object
    let dateObj = new Date();
    let dateStr = '';

    if (day !== null) {
        dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        dateStr = formatDate(dateObj);
    }

    const { setNodeRef, isOver } = useDroppable({
        id: day !== null ? `calendar:${dateStr}` : `calendar:empty-${Math.random()}`,
        disabled: day === null,
        data: { date: dateObj, type: 'calendar' }
    });

    if (day === null) {
        return <div className={styles.dayEmpty} />;
    }

    const isSelected = selectedDate ? isSameDay(dateObj, selectedDate) : false;
    const isToday = isSameDay(dateObj, today);
    const hasEntry = entryDates.includes(dateStr);

    return (
        <button
            ref={setNodeRef}
            onClick={() => onDateSelect(dateObj)}
            className={`
                ${styles.day} 
                ${isSelected ? styles.selected : ''} 
                ${isToday ? styles.today : ''}
                ${hasEntry ? styles.hasEntry : ''}
                ${isOver ? styles.droppableOver : ''}
            `}
            style={isOver ? { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#fff' } : {}}
        >
            {day}
            {hasEntry && <div className={styles.entryDot} />}
        </button>
    );
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

    return (
        <div className={styles.container}>
            <div className={styles.weekdays}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className={styles.weekday}>{day}</div>
                ))}
            </div>
            <div className={styles.grid}>
                {days.map((day, index) => (
                    <CalendarDay
                        key={day ? `day-${day}` : `empty-${index}`}
                        day={day}
                        currentMonth={currentMonth}
                        selectedDate={selectedDate}
                        entryDates={entryDates}
                        onDateSelect={onDateSelect}
                    />
                ))}
            </div>
        </div>
    );
}
