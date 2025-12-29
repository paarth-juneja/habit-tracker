'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './HabitTracker.module.css';
import YearMonthPicker from './Journal/YearMonthPicker';

interface Habit {
    id: string;
    name: string;
    completedDays: number[];
}

interface HabitTrackerProps {
    habits: Habit[];
    year: number;
    month: number;
    onHabitsChange: (habits: Habit[]) => void;
    onMonthChange: (year: number, month: number) => void;
}

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

export default function HabitTracker({
    habits,
    year,
    month,
    onHabitsChange,
    onMonthChange
}: HabitTrackerProps) {
    const [newHabitName, setNewHabitName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const daysInMonth = getDaysInMonth(year, month);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
    const currentDay = today.getDate();

    const handlePrevMonth = () => {
        if (month === 1) {
            onMonthChange(year - 1, 12);
        } else {
            onMonthChange(year, month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            onMonthChange(year + 1, 1);
        } else {
            onMonthChange(year, month + 1);
        }
    };

    const handleAddHabit = () => {
        if (newHabitName.trim()) {
            const newHabit: Habit = {
                id: generateId(),
                name: newHabitName.trim(),
                completedDays: [],
            };
            onHabitsChange([...habits, newHabit]);
            setNewHabitName('');
        }
    };

    const handleDeleteHabit = (id: string) => {
        onHabitsChange(habits.filter(h => h.id !== id));
    };

    const handleToggleDay = (habitId: string, day: number) => {
        onHabitsChange(
            habits.map(habit => {
                if (habit.id !== habitId) return habit;
                const completedDays = habit.completedDays.includes(day)
                    ? habit.completedDays.filter(d => d !== day)
                    : [...habit.completedDays, day].sort((a, b) => a - b);
                return { ...habit, completedDays };
            })
        );
    };

    const handleStartEdit = (habit: Habit) => {
        setEditingId(habit.id);
        setEditingName(habit.name);
    };

    const handleSaveEdit = () => {
        if (editingName.trim() && editingId) {
            onHabitsChange(
                habits.map(h =>
                    h.id === editingId ? { ...h, name: editingName.trim() } : h
                )
            );
        }
        setEditingId(null);
        setEditingName('');
    };

    const getCompletionRate = (habit: Habit): number => {
        const daysToCount = isCurrentMonth ? currentDay : daysInMonth;
        return Math.round((habit.completedDays.length / daysToCount) * 100);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.sectionTitle}>Monthly Habit Tracker</h2>
                <p className={styles.sectionSubtitle}>
                    Track your daily habits and build consistency
                </p>
            </div>


            <div className={styles.monthNavigation}>
                <button onClick={handlePrevMonth} className={styles.navButton}>
                    <span>←</span>
                </button>
                <h3
                    className={styles.monthTitle}
                    onClick={() => setIsPickerOpen(true)}
                    style={{ cursor: 'pointer' }}
                    title="Click to change date"
                >
                    {monthNames[month - 1]} {year}
                </h3>
                <button onClick={handleNextMonth} className={styles.navButton}>
                    <span>→</span>
                </button>

                {isPickerOpen && (
                    <YearMonthPicker
                        currentDate={new Date(year, month - 1)}
                        onSelect={(date) => {
                            onMonthChange(date.getFullYear(), date.getMonth() + 1);
                        }}
                        onClose={() => setIsPickerOpen(false)}
                    />
                )}
            </div>

            <div className={styles.trackerWrapper}>
                <div className={styles.tracker}>
                    {/* Header Row */}
                    <div className={styles.headerRow}>
                        <div className={styles.habitNameHeader}>Habit</div>
                        {days.map(day => (
                            <div
                                key={day}
                                className={`${styles.dayHeader} ${isCurrentMonth && day === currentDay ? styles.today : ''}`}
                            >
                                {day}
                            </div>
                        ))}
                        <div className={styles.progressHeader}>%</div>
                    </div>

                    {/* Habit Rows */}
                    {habits.map(habit => (
                        <div key={habit.id} className={styles.habitRow}>
                            <div className={styles.habitName}>
                                {editingId === habit.id ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={handleSaveEdit}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                        className={styles.editInput}
                                        autoFocus
                                    />
                                ) : (
                                    <>
                                        <span
                                            className={styles.habitText}
                                            onClick={() => handleStartEdit(habit)}
                                            title="Click to edit"
                                        >
                                            {habit.name}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteHabit(habit.id)}
                                            className={styles.deleteBtn}
                                            title="Delete habit"
                                        >
                                            ×
                                        </button>
                                    </>
                                )}
                            </div>
                            {days.map(day => {
                                const isCompleted = habit.completedDays.includes(day);
                                const isFuture = isCurrentMonth && day > currentDay;
                                return (
                                    <div
                                        key={day}
                                        className={`${styles.dayCell} ${isCurrentMonth && day === currentDay ? styles.todayCell : ''}`}
                                    >
                                        <button
                                            className={`${styles.checkbox} ${isCompleted ? styles.checked : ''} ${isFuture ? styles.future : ''}`}
                                            onClick={() => !isFuture && handleToggleDay(habit.id, day)}
                                            disabled={isFuture}
                                        >
                                            {isCompleted && <span className={styles.checkmark}>✓</span>}
                                        </button>
                                    </div>
                                );
                            })}
                            <div className={styles.progressCell}>
                                <span className={styles.progressValue}>{getCompletionRate(habit)}%</span>
                            </div>
                        </div>
                    ))}

                    {/* Add New Habit Row */}
                    <div className={styles.addRow}>
                        <div className={styles.addHabitInput}>
                            <input
                                type="text"
                                value={newHabitName}
                                onChange={(e) => setNewHabitName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                                placeholder="+ Add new habit..."
                                className={styles.newHabitInput}
                            />
                            {newHabitName && (
                                <button onClick={handleAddHabit} className={styles.addButton}>
                                    Add
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {habits.length === 0 && (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📝</span>
                    <p>No habits yet! Add your first habit above to start tracking.</p>
                </div>
            )}
        </div>
    );
}
