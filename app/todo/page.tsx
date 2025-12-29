'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MonthSelector from '@/components/Journal/MonthSelector';
import CalendarGrid from '@/components/Journal/CalendarGrid';
import TodoList from '@/components/Todo/TodoList';
import HabitReadOnlyList from '@/components/Todo/HabitReadOnlyList';
import { useAuth } from '@/components/AuthProvider';
import {
    getDailyId, getWeeklyId, getMonthlyId,
    subscribeTodoList, saveTodoList,
    getTodoDatesForMonth,
    TodoItem, TodoPeriod
} from '@/lib/todo';
import styles from './page.module.css';

export default function TodoPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Lists State
    const [dailyTodos, setDailyTodos] = useState<TodoItem[]>([]);
    const [weeklyTodos, setWeeklyTodos] = useState<TodoItem[]>([]);
    const [monthlyTodos, setMonthlyTodos] = useState<TodoItem[]>([]); // Renamed from monthTodos to monthlyTodos to match pattern

    // Entry dates for calendar (show daily todos that have items)
    const [entryDates, setEntryDates] = useState<string[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Load Todo Entry Dates (for Calendar dots)
    useEffect(() => {
        if (!user) return;
        const loadEntryDates = async () => {
            try {
                const dates = await getTodoDatesForMonth(user.uid, currentMonth);
                setEntryDates(dates);
            } catch (error) {
                console.error("Failed to load entry dates:", error);
            }
        };
        loadEntryDates();
    }, [user, currentMonth, dailyTodos]); // Refresh when dailyTodos changes to update dots instantly? 
    // Wait, dailyTodos is just for *selected* date. 
    // To have dots update instantly when I add an item to today, I need to know if I added/removed the *last* item.
    // getTodoDatesForMonth queries Firestore.
    // If I add an item, I save to Firestore.
    // So if I re-run this effect when `dailyTodos` changes, it *might* pick up the change if Firestore is consistent locally.
    // Let's add dailyTodos to deps. Assuming write happens fast.


    // Subscriptions for Todos
    useEffect(() => {
        if (!user) return;

        const dailyId = getDailyId(selectedDate);
        const weeklyId = getWeeklyId(selectedDate);
        const monthlyId = getMonthlyId(selectedDate);

        const unsubDaily = subscribeTodoList(user.uid, 'daily', dailyId, setDailyTodos);
        const unsubWeekly = subscribeTodoList(user.uid, 'weekly', weeklyId, setWeeklyTodos);
        const unsubMonthly = subscribeTodoList(user.uid, 'monthly', monthlyId, setMonthlyTodos);

        return () => {
            unsubDaily();
            unsubWeekly();
            unsubMonthly();
        };
    }, [user, selectedDate]);

    // Handlers
    const handleAdd = useCallback(async (text: string, period: TodoPeriod, list: TodoItem[]) => {
        if (!user) return;
        const newItem: TodoItem = {
            id: Date.now().toString(), // Simple ID
            text,
            completed: false,
            createdAt: Date.now()
        };

        let id = '';
        if (period === 'daily') id = getDailyId(selectedDate);
        else if (period === 'weekly') id = getWeeklyId(selectedDate);
        else if (period === 'monthly') id = getMonthlyId(selectedDate);

        // Optimistic Update? The subscription is fast, but let's do safe wait or optimistic
        // Firestore local cache handles optimistic updates for listeners automatically.
        // So simply writing to DB is enough to update UI via listener for *user caused* actions?
        // Actually yes, creating a document offline/online fires the listener with 'hasPendingWrites'.
        // So we just save.
        const newList = [...list, newItem];
        await saveTodoList(user.uid, period, id, newList);
    }, [user, selectedDate]);

    const handleToggle = useCallback(async (itemId: string, completed: boolean, period: TodoPeriod, list: TodoItem[]) => {
        if (!user) return;
        let id = '';
        if (period === 'daily') id = getDailyId(selectedDate);
        else if (period === 'weekly') id = getWeeklyId(selectedDate);
        else if (period === 'monthly') id = getMonthlyId(selectedDate);

        const newList = list.map(item => item.id === itemId ? { ...item, completed } : item);
        await saveTodoList(user.uid, period, id, newList);
    }, [user, selectedDate]);

    const handleDelete = useCallback(async (itemId: string, period: TodoPeriod, list: TodoItem[]) => {
        if (!user) return;
        let id = '';
        if (period === 'daily') id = getDailyId(selectedDate);
        else if (period === 'weekly') id = getWeeklyId(selectedDate);
        else if (period === 'monthly') id = getMonthlyId(selectedDate);

        const newList = list.filter(item => item.id !== itemId);
        await saveTodoList(user.uid, period, id, newList);
    }, [user, selectedDate]);


    if (!user) return null;

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.container}>
                <div className={styles.layout}>
                    <div className={styles.sidebar}>
                        <MonthSelector
                            currentDate={currentMonth}
                            onMonthChange={setCurrentMonth}
                        />

                        {/* Wrapper to scale down calendar slightly */}
                        <div style={{ transform: 'scale(0.9)', transformOrigin: 'top left', width: '111%' }}>
                            <CalendarGrid
                                currentMonth={currentMonth}
                                selectedDate={selectedDate}
                                entryDates={entryDates}
                                onDateSelect={setSelectedDate}
                            />
                        </div>

                        <HabitReadOnlyList date={currentMonth} />
                    </div>

                    <div className={styles.mainContent}>
                        <div className={styles.leftColumn}>
                            <div className={styles.sectionMonth}>
                                <TodoList
                                    title="This Month"
                                    items={monthlyTodos}
                                    onAdd={(text) => handleAdd(text, 'monthly', monthlyTodos)}
                                    onToggle={(id, val) => handleToggle(id, val, 'monthly', monthlyTodos)}
                                    onDelete={(id) => handleDelete(id, 'monthly', monthlyTodos)}
                                />
                            </div>
                            <div className={styles.sectionWeek}>
                                <TodoList
                                    title="This Week"
                                    items={weeklyTodos}
                                    onAdd={(text) => handleAdd(text, 'weekly', weeklyTodos)}
                                    onToggle={(id, val) => handleToggle(id, val, 'weekly', weeklyTodos)}
                                    onDelete={(id) => handleDelete(id, 'weekly', weeklyTodos)}
                                />
                            </div>
                        </div>
                        <div className={styles.rightColumn}>
                            <TodoList
                                title="Today"
                                items={dailyTodos}
                                onAdd={(text) => handleAdd(text, 'daily', dailyTodos)}
                                onToggle={(id, val) => handleToggle(id, val, 'daily', dailyTodos)}
                                onDelete={(id) => handleDelete(id, 'daily', dailyTodos)}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
