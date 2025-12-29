'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MonthSelector from '@/components/Journal/MonthSelector';
import CalendarGrid from '@/components/Journal/CalendarGrid';
import TodoList from '@/components/Todo/TodoList';
import HabitReadOnlyList from '@/components/Todo/HabitReadOnlyList';
import Modal from '@/components/Modal'; // Import the new Modal
import { useAuth } from '@/components/AuthProvider';
import {
    getDailyId, getWeeklyId, getMonthlyId,
    subscribeTodoList, saveTodoList,
    getTodoDatesForMonth,
    TodoItem, TodoPeriod
} from '@/lib/todo';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    DragOverEvent,
    pointerWithin
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import styles from './page.module.css';

type DropAction = 'MOVE' | 'COPY';
type DropTargetType = 'CALENDAR' | 'LIST';

export default function TodoPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Lists State
    const [dailyTodos, setDailyTodos] = useState<TodoItem[]>([]);
    const [weeklyTodos, setWeeklyTodos] = useState<TodoItem[]>([]);
    const [monthlyTodos, setMonthlyTodos] = useState<TodoItem[]>([]);

    // Entry dates for calendar
    const [entryDates, setEntryDates] = useState<string[]>([]);

    // DnD State
    const [activeItem, setActiveItem] = useState<TodoItem | null>(null);
    const [activeSourceList, setActiveSourceList] = useState<TodoPeriod | null>(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message?: string;
        actions: { label: string; onClick: () => void; primary?: boolean }[];
    }>({
        isOpen: false,
        title: '',
        actions: []
    });

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Load Todo Entry Dates
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
    }, [user, currentMonth, dailyTodos]);

    // Subscriptions
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
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: Date.now()
        };

        let id = '';
        if (period === 'daily') id = getDailyId(selectedDate);
        else if (period === 'weekly') id = getWeeklyId(selectedDate);
        else if (period === 'monthly') id = getMonthlyId(selectedDate);

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

    // --- Drag and Drop Logic ---

    // Move item: Add to target, Remove from source
    const moveItem = async (item: TodoItem, sourcePeriod: TodoPeriod, targetPeriod: TodoPeriod, targetId: string) => {
        if (!user) return;

        // 1. Remove from source
        let sourceListId = '';
        let sourceList: TodoItem[] = [];

        if (sourcePeriod === 'daily') { sourceListId = getDailyId(selectedDate); sourceList = dailyTodos; }
        else if (sourcePeriod === 'weekly') { sourceListId = getWeeklyId(selectedDate); sourceList = weeklyTodos; }
        else if (sourcePeriod === 'monthly') { sourceListId = getMonthlyId(selectedDate); sourceList = monthlyTodos; }

        const newSourceList = sourceList.filter(i => i.id !== item.id);
        await saveTodoList(user.uid, sourcePeriod, sourceListId, newSourceList);

        // 2. Add to target
        // Requires fetching target list first as we might be moving to a different date not currently loaded
        // However, we can use arrayUnion approach but simpler to read-write for consistency with 'saveTodoList' which overwrites 'items'.
        // We know saveTodoList overwrites. We need to fetch current target items first.
        // BUT, if target is current selected lists (e.g. dragging to 'Week' list), we have the state.
        // If target is a Calendar Date (different day), we don't have that state loaded.

        // Helper to get list from DB or State
        // Actually best to just do a transaction or read-modify-write.
        // We haven't exported 'getTodoList' for arbitrary use in 'page.tsx' but we can import it.
        // Wait, imported getTodoList in 'lib/todo'? No, it is exported. I need to add it to imports.
        // Let's assume I can import `getTodoList`.

        // We need to fetch target list first.
        const { getTodoList } = await import('@/lib/todo'); // Dynamic import or just add successful top import
        const targetItems = await getTodoList(user.uid, targetPeriod, targetId);

        // Avoid duplicates by ID? 
        if (!targetItems.some(i => i.id === item.id)) {
            const newTargetList = [...targetItems, item];
            await saveTodoList(user.uid, targetPeriod, targetId, newTargetList);
        }
    };

    // Copy item: Add to target, Keep in source
    const copyItem = async (item: TodoItem, targetPeriod: TodoPeriod, targetId: string) => {
        if (!user) return;
        const { getTodoList } = await import('@/lib/todo');
        const targetItems = await getTodoList(user.uid, targetPeriod, targetId);

        // Check for duplicate
        if (!targetItems.some(i => i.id === item.id)) {
            // New ID for the copy? Or same ID? Use Same ID to track? 
            // Usually copies should be independent. Let's give new ID.
            const newItem = { ...item, id: Date.now().toString() };
            const newTargetList = [...targetItems, newItem];
            await saveTodoList(user.uid, targetPeriod, targetId, newTargetList);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const item = active.data.current?.item as TodoItem;

        // Determine source list
        // We can look up which list contains the item ID, but IDs might collide if we used simple Date.now().
        // Better to check `active.data`. But I didn't pass source list info in Draggable data.
        // Let's infer or check lists.
        if (dailyTodos.some(i => i.id === item.id)) setActiveSourceList('daily');
        else if (weeklyTodos.some(i => i.id === item.id)) setActiveSourceList('weekly');
        else if (monthlyTodos.some(i => i.id === item.id)) setActiveSourceList('monthly');

        setActiveItem(item);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);
        setActiveSourceList(null);

        if (!over || !activeSourceList || !user) return;

        const item = active.data.current?.item as TodoItem;
        const overType = over.data.current?.type;
        const overData = over.data.current;

        // --- Logic Matrix ---

        if (overType === 'calendar') {
            const targetDate = overData?.date as Date;
            if (!targetDate) return;

            // Source: Daily -> Calendar (Move)
            if (activeSourceList === 'daily') {
                const targetId = getDailyId(targetDate);
                await moveItem(item, 'daily', 'daily', targetId);
            }

            // Source: Weekly -> Calendar (Popup: Shift to Week / Shift to Date)
            else if (activeSourceList === 'weekly') {
                setModalConfig({
                    isOpen: true,
                    title: 'Shift Task',
                    message: `Do you want to shift this task to the week of ${targetDate.toLocaleDateString()} or that specific date?`,
                    actions: [
                        {
                            label: 'Shift to Week',
                            onClick: async () => {
                                const targetId = getWeeklyId(targetDate);
                                await moveItem(item, 'weekly', 'weekly', targetId);
                                closeModal();
                            }
                        },
                        {
                            label: 'Shift to Date',
                            onClick: async () => {
                                const targetId = getDailyId(targetDate);
                                // Moving from Weekly to Daily (Remove from Weekly, Add to Daily)
                                await moveItem(item, 'weekly', 'daily', targetId);
                                closeModal();
                            }
                        }
                    ]
                });
            }

            // Source: Monthly -> Calendar (Popup: Month / Week / Date)
            else if (activeSourceList === 'monthly') {
                setModalConfig({
                    isOpen: true,
                    title: 'Drop Task',
                    message: `Where do you want to drop this monthly task?`,
                    actions: [
                        { // Drop on Month (of that date) - likely just copy/move to that month?
                            // "if you take month one and drop it on something on calender it will ask if you want to drop on month, week or that date"
                            // Assuming Copy logic for Month breakdowns or Move? keeping "Copy" for safety/breakdown workflow.
                            label: 'Add to Month',
                            onClick: async () => {
                                const targetId = getMonthlyId(targetDate);
                                await copyItem(item, 'monthly', targetId);
                                closeModal();
                            }
                        },
                        {
                            label: 'Add to Week',
                            onClick: async () => {
                                const targetId = getWeeklyId(targetDate);
                                await copyItem(item, 'weekly', targetId); // "month... drop on week then it copies"
                                closeModal();
                            }
                        },
                        {
                            label: 'Add to Date',
                            onClick: async () => {
                                const targetId = getDailyId(targetDate);
                                await copyItem(item, 'daily', targetId); // "similarly if you drop on day"
                                closeModal();
                            }
                        }
                    ]
                });
            }
        }
        else if (overType === 'todo-list') {
            // Dropping on another list (Today/Week/Month)
            const targetListId = overData?.listId; // 'list:daily', 'list:weekly', 'list:monthly'? No, I passed `id` prop.
            // In TodoPage render:
            // Daily -> id={getDailyId(selectedDate)} (which looks like YYYY-MM-DD)
            // Wait, standardizing ID format for detection is better. 
            // In TodoList component, I used `id` as `useDroppable` id.
            // So over.id will be "2025-10-27" (daily) or "2025-W43" (weekly).

            // I need to know which PERIOD the target list corresponds to.
            // I can infer from format OR pass explicit type in data. Provide explicit type.

            // To fix TodoList droppable data:
            // I need to pass the period type to TodoList so it passes it to useDroppable data.
            // I'll update TodoList props later or infer now.
            // Let's rely on checking against current IDs.

            const dailyId = getDailyId(selectedDate);
            const weeklyId = getWeeklyId(selectedDate);
            const monthlyId = getMonthlyId(selectedDate);

            let targetPeriod: TodoPeriod | null = null;
            if (over.id === dailyId) targetPeriod = 'daily';
            else if (over.id === weeklyId) targetPeriod = 'weekly';
            else if (over.id === monthlyId) targetPeriod = 'monthly';

            if (!targetPeriod) return; // Dropped on unknown list

            const targetId = over.id as string;

            // Source: Month -> Week (Copy)
            if (activeSourceList === 'monthly' && targetPeriod === 'weekly') {
                await copyItem(item, 'weekly', targetId);
            }
            // Source: Month -> Day (Copy)
            else if (activeSourceList === 'monthly' && targetPeriod === 'daily') {
                await copyItem(item, 'daily', targetId);
            }
            // Source: Week -> Day (Copy: "keeps on the droped place as well as the week")
            else if (activeSourceList === 'weekly' && targetPeriod === 'daily') {
                await copyItem(item, 'daily', targetId);
            }
            // Source: Week -> Month (Copy)
            else if (activeSourceList === 'weekly' && targetPeriod === 'monthly') {
                await copyItem(item, 'monthly', targetId);
            }
            // Source: Day -> Week/Month? (Not specified, assume copy)
            else if (activeSourceList === 'daily' && (targetPeriod === 'weekly' || targetPeriod === 'monthly')) {
                await copyItem(item, targetPeriod, targetId);
            }
            // Same list? Do nothing or reorder (not implementing reorder yet)
        }
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    if (!user) return null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className={styles.page}>
                <Header />
                <main className={styles.container}>
                    <div className={styles.layout}>
                        <div className={styles.sidebar}>
                            <MonthSelector
                                currentDate={currentMonth}
                                onMonthChange={setCurrentMonth}
                            />

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
                                        id={getMonthlyId(selectedDate)}
                                        title="This Month"
                                        items={monthlyTodos}
                                        onAdd={(text) => handleAdd(text, 'monthly', monthlyTodos)}
                                        onToggle={(id, val) => handleToggle(id, val, 'monthly', monthlyTodos)}
                                        onDelete={(id) => handleDelete(id, 'monthly', monthlyTodos)}
                                    />
                                </div>
                                <div className={styles.sectionWeek}>
                                    <TodoList
                                        id={getWeeklyId(selectedDate)}
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
                                    id={getDailyId(selectedDate)}
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

                <DragOverlay modifiers={[snapCenterToCursor]}>
                    {activeItem ? (
                        <div className={`${styles.dragOverlayItem}`}>
                            <span className={styles.dragOverlayText}>{activeItem.text}</span>
                        </div>
                    ) : null}
                </DragOverlay>

                <Modal
                    isOpen={modalConfig.isOpen}
                    onClose={closeModal}
                    title={modalConfig.title}
                >
                    <div className={styles.modalContent}>
                        {modalConfig.message && <p className={styles.modalMessage}>{modalConfig.message}</p>}
                        <div className={styles.modalActions}>
                            {modalConfig.actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={action.onClick}
                                    className={`${styles.modalBtn} ${action.primary ? styles.modalBtnPrimary : ''}`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </Modal>
            </div>
        </DndContext>
    );
}
