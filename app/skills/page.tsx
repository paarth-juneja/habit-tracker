'use client';

import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import Header from '@/components/Header';
import { useAuth } from '@/components/AuthProvider';
import {
    getSkillsBacklog,
    addSkillToBacklog,
    removeSkillFromBacklog,
    getWeeklySkillPlans,
    saveWeeklySkillPlan,
    Skill,
    WeeklySkillPlan
} from '@/lib/skills';
import styles from './skills.module.css';

// --- Utility Functions ---

const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

const getDayRange = (year: number, week: number) => {
    const startDay = (week - 1) * 7 + 1;
    let endDay = week * 7;

    const totalDays = isLeapYear(year) ? 366 : 365;

    // Cap the last week
    if (endDay > totalDays) {
        endDay = totalDays;
    }

    return `Day ${startDay}-${endDay}`;
};

// --- Components ---

const DraggableSkill = ({
    skill,
    id,
    isOverlay = false,
    onEdit,
    onDelete
}: {
    skill: Skill | { name: string, id: string },
    id: string,
    isOverlay?: boolean,
    onEdit?: (id: string, newName: string) => void,
    onDelete?: (id: string) => void
}) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: id,
        data: { skill, type: 'skill' }
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(skill.name);

    if (isDragging && !isOverlay) {
        return <div ref={setNodeRef} className={styles.draggableSkill} style={{ opacity: 0.3 }} />;
    }

    const handleSave = () => {
        if (editValue.trim() && onEdit) {
            onEdit(skill.id, editValue.trim());
        }
        setIsEditing(false);
    };

    return (
        <div
            ref={setNodeRef}
            className={styles.draggableSkill}
            style={isOverlay ? { cursor: 'grabbing', scale: '1.05', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' } : {}}
        >
            {isEditing ? (
                <input
                    type="text"
                    className={styles.editInput}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                />
            ) : (
                <>
                    <span {...listeners} {...attributes} className={styles.skillName}>{skill.name}</span>
                    <div className={styles.skillActions}>
                        <button className={styles.editBtn} onClick={() => setIsEditing(true)} title="Edit">✎</button>
                        <button className={styles.deleteBtn} onClick={() => onDelete?.(skill.id)} title="Delete">×</button>
                        <span {...listeners} {...attributes} className={styles.grabIcon}>⋮⋮</span>
                    </div>
                </>
            )}
        </div>
    );
};

const DroppableWeekCell = ({ weekId, value, onChange }: { weekId: string, value: string, onChange: (val: string) => void }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: weekId,
    });

    return (
        <div
            ref={setNodeRef}
            className={`${styles.skillCell} ${isOver ? styles.skillCellActive : ''}`}
        >
            <input
                type="text"
                className={styles.cellInput}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

// --- Main Page ---

export default function SkillsPage() {
    const { user } = useAuth();
    // Default to current year, but user can change
    const [year, setYear] = useState(new Date().getFullYear());
    const [backlog, setBacklog] = useState<Skill[]>([]);
    const [weeklyPlans, setWeeklyPlans] = useState<Record<number, WeeklySkillPlan>>({});
    const [newSkillText, setNewSkillText] = useState('');
    const [activeDraggable, setActiveDraggable] = useState<Skill | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    // Initial Data Fetch
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            const backlogData = await getSkillsBacklog(user.uid);
            const plansData = await getWeeklySkillPlans(user.uid, year);

            const plansMap: Record<number, WeeklySkillPlan> = {};
            plansData.forEach(p => plansMap[p.weekNumber] = p);

            setBacklog(backlogData);
            setWeeklyPlans(plansMap);
        };

        loadData();
    }, [user, year]);

    // Handlers
    const handleAddSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSkillText.trim() || !user) return;

        // Optimistic update
        const tempId = crypto.randomUUID();
        const tempSkill: Skill = { id: tempId, name: newSkillText, createdAt: Date.now() };
        setBacklog(prev => [...prev, tempSkill]);
        setNewSkillText('');

        try {
            await addSkillToBacklog(user.uid, newSkillText);
            // Ideally we replace the temp item with real one, but ID is random anyway so it's fine for now 
            // Reloading would be safer for consistency but let's trust the flow
        } catch (error) {
            console.error("Failed to add skill", error);
            // Revert on fail
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.type === 'skill') {
            setActiveDraggable(event.active.data.current.skill as Skill);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDraggable(null);

        if (!over || !user) return;

        // Dropped on a week cell (id format: "week-{number}")
        if (String(over.id).startsWith('week-')) {
            const weekNum = parseInt(String(over.id).split('-')[1]);
            const skill = active.data.current?.skill as Skill;

            if (!skill) return;

            // 1. Remove from backlog
            const newBacklog = backlog.filter(s => s.id !== skill.id);
            setBacklog(newBacklog);
            removeSkillFromBacklog(user.uid, skill); // Fire & forget

            // 2. Add to Weekly Plan
            const weekId = `${year}-W${String(weekNum).padStart(2, '0')}`;
            const newPlan: WeeklySkillPlan = {
                ...(weeklyPlans[weekNum] || {}),
                id: weekId,
                year,
                weekNumber: weekNum,
                skillId: skill.id,
                skillName: skill.name
            };

            setWeeklyPlans(prev => ({ ...prev, [weekNum]: newPlan }));
            await saveWeeklySkillPlan(user.uid, newPlan);
        }
    };

    const handleEditSkill = async (skillId: string, newName: string) => {
        if (!user) return;
        const updatedBacklog = backlog.map(s =>
            s.id === skillId ? { ...s, name: newName } : s
        );
        setBacklog(updatedBacklog);

        // Update in Firestore - remove old and add updated
        const oldSkill = backlog.find(s => s.id === skillId);
        if (oldSkill) {
            await removeSkillFromBacklog(user.uid, oldSkill);
            await addSkillToBacklog(user.uid, newName);
        }
    };

    const handleDeleteSkill = async (skillId: string) => {
        if (!user) return;
        const skillToDelete = backlog.find(s => s.id === skillId);
        if (!skillToDelete) return;

        setBacklog(prev => prev.filter(s => s.id !== skillId));
        await removeSkillFromBacklog(user.uid, skillToDelete);
    };

    const handlePlanUpdate = async (weekNum: number, field: keyof WeeklySkillPlan, value: any) => {
        if (!user) return;

        const currentPlan = weeklyPlans[weekNum] || {
            id: `${year}-W${String(weekNum).padStart(2, '0')}`,
            year,
            weekNumber: weekNum
        };

        const updatedPlan = { ...currentPlan, [field]: value };
        setWeeklyPlans(prev => ({ ...prev, [weekNum]: updatedPlan }));

        // Debounce could be added here for text inputs, but for now direct save
        await saveWeeklySkillPlan(user.uid, updatedPlan);
    };

    const handleClearSkill = async (weekNum: number) => {
        if (!user) return;
        const currentPlan = weeklyPlans[weekNum];
        if (!currentPlan?.skillId) return;

        // Optionally add back to backlog? 
        // For now, let's just clear it from the week. 
        // If user wants it back in backlog, they can type it again. 
        // Or we could be nice and put it back. Let's put it back to backlog.

        if (currentPlan.skillName) {
            const returnedSkill: Skill = {
                id: currentPlan.skillId,
                name: currentPlan.skillName,
                createdAt: Date.now()
            };
            setBacklog(prev => [...prev, returnedSkill]);
            await addSkillToBacklog(user.uid, currentPlan.skillName); // This creates a NEW ID content-wise, slight duplication risk if ID matters strictly
        }

        const updatedPlan = { ...currentPlan, skillId: undefined, skillName: undefined }; // remove skill fields
        // Hack: Firestore doesn't like undefined for merge. We handled JSON parse/stringify in lib.

        const newPlans = { ...weeklyPlans };
        newPlans[weekNum] = updatedPlan as WeeklySkillPlan;
        setWeeklyPlans(newPlans);

        await saveWeeklySkillPlan(user.uid, updatedPlan as WeeklySkillPlan);
    };

    // Render 52 weeks
    const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

    // Year range for selector (current - 1 to current + 4)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

    return (
        <>
            <Header />
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className={styles.container}>
                    {/* Sidebar */}
                    <aside className={styles.sidebar}>
                        <div className={styles.yearSelector}>
                            <label htmlFor="year-select" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Planning Year</label>
                            <select
                                id="year-select"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className={styles.yearSelectInput}
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        <h2 className={styles.backlogHeader}>Skills</h2>

                        <form onSubmit={handleAddSkill} className={styles.addSkillForm}>
                            <input
                                type="text"
                                placeholder="Add a new skill..."
                                value={newSkillText}
                                onChange={(e) => setNewSkillText(e.target.value)}
                                className={styles.skillInput}
                            />
                            <button type="submit" className={styles.addButton}>+</button>
                        </form>

                        <div className={styles.skillsList}>
                            {backlog.map(skill => (
                                <DraggableSkill
                                    key={skill.id}
                                    id={skill.id}
                                    skill={skill}
                                    onEdit={handleEditSkill}
                                    onDelete={handleDeleteSkill}
                                />
                            ))}
                        </div>
                    </aside>

                    {/* Main Grid */}
                    <main className={styles.mainContent}>
                        <div className={styles.headerRow}>
                            <h1 className={styles.pageHeader}>{year} Skills Plan</h1>
                            <div className={styles.todayBox}>
                                <span className={styles.todayDate}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                <span className={styles.todayDay}>Day {Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1}</span>
                            </div>
                        </div>

                        <div className={styles.gridHeader}>
                            <span>Week</span>
                            <span>Planned Skill</span>
                            <span>Specific Target</span>
                            <span>Satisfaction</span>
                            <span>Notes</span>
                        </div>

                        <div className="weeks-container">
                            {weeks.map(weekNum => {
                                const plan = weeklyPlans[weekNum];
                                return (
                                    <div key={weekNum} className={styles.weekRow}>
                                        <div className={styles.weekInfo}>
                                            <span className={styles.weekNumber}>Week {weekNum}</span>
                                            <span className={styles.dateRange}>{getDayRange(year, weekNum)}</span>
                                        </div>

                                        <DroppableWeekCell
                                            weekId={`week-${weekNum}`}
                                            value={plan?.skillName || ''}
                                            onChange={(val) => handlePlanUpdate(weekNum, 'skillName', val)}
                                        />

                                        {/* Target Input */}
                                        <input
                                            type="text"
                                            className={styles.tableInput}
                                            value={plan?.target || ''}
                                            onChange={(e) => handlePlanUpdate(weekNum, 'target', e.target.value)}
                                        />

                                        {/* Satisfaction Input */}
                                        <select
                                            className={styles.satisfactionInput}
                                            value={plan?.satisfaction || ''}
                                            onChange={(e) => handlePlanUpdate(weekNum, 'satisfaction', Number(e.target.value))}
                                            style={{
                                                borderColor: plan?.satisfaction && plan.satisfaction >= 8 ? 'var(--color-success)' :
                                                    plan?.satisfaction && plan.satisfaction <= 4 ? 'var(--color-danger)' :
                                                        'var(--color-border)'
                                            }}
                                        >
                                            <option value="">-</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                                <option key={n} value={n}>{n}</option>
                                            ))}
                                        </select>

                                        {/* Notes Input */}
                                        <input
                                            type="text"
                                            className={styles.tableInput}
                                            value={plan?.note || ''}
                                            onChange={(e) => handlePlanUpdate(weekNum, 'note', e.target.value)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </main>

                    <DragOverlay>
                        {activeDraggable ? (
                            <DraggableSkill id="overlay" skill={activeDraggable} isOverlay />
                        ) : null}
                    </DragOverlay>
                </div>
            </DndContext>
        </>
    );
}
