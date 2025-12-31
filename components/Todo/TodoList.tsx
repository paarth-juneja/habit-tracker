'use client';

import { useState } from 'react';
import { TodoItem } from '@/lib/todo';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './TodoList.module.css';
import DropdownMenu from '../DropdownMenu';

interface TodoListProps {
    id: string; // The droppable ID (e.g., 'list:daily', 'list:weekly')
    title: string;
    items: TodoItem[];
    onAdd: (text: string) => void;
    onUpdate: (id: string, updates: Partial<TodoItem>) => void;
    onDelete: (id: string) => void;
    onDeleteAll?: () => void;
    onDeleteCompleted?: () => void;
    onMarkAllCompleted?: () => void;
    onDeletePending?: () => void;
    moveActions?: { label: string, onClick: () => void }[];
}

function SortableTodoItem({ item, onUpdate, onDelete }: {
    item: TodoItem,
    onUpdate: (id: string, updates: Partial<TodoItem>) => void,
    onDelete: (id: string) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
        data: { item, type: 'todo-item' }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [isExpanded, setIsExpanded] = useState(false);
    const [newStepText, setNewStepText] = useState('');

    const handleAddStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStepText.trim()) return;
        const newStep = {
            id: Date.now().toString(),
            text: newStepText.trim(),
            completed: false
        };
        onUpdate(item.id, { steps: [...(item.steps || []), newStep] });
        setNewStepText('');
    };

    const toggleStep = (stepId: string, completed: boolean) => {
        const updatedSteps = (item.steps || []).map(s => s.id === stepId ? { ...s, completed } : s);
        onUpdate(item.id, { steps: updatedSteps });
    };

    const deleteStep = (stepId: string) => {
        const updatedSteps = (item.steps || []).filter(s => s.id !== stepId);
        onUpdate(item.id, { steps: updatedSteps });
    };

    return (
        <div ref={setNodeRef} style={style} className={styles.itemWrapper}>
            <div className={`${styles.item} ${item.completed ? styles.completed : ''}`}>
                <div {...attributes} {...listeners} className={styles.dragHandle}>
                    ⋮⋮
                </div>

                <label className={styles.checkboxLabel} onPointerDown={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => onUpdate(item.id, { completed: e.target.checked })}
                        className={styles.checkbox}
                    />
                    <span className={styles.checkmark}></span>
                </label>

                <div className={styles.content}>
                    <span className={styles.text}>{item.text}</span>
                    {item.dueDate && (
                        <div className={styles.dueDateDisplay}>
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => setIsExpanded(!isExpanded)}
                        title="Details"
                    >
                        {isExpanded ? '▲' : '▼'}
                    </button>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onDelete(item.id)}
                        className={`${styles.iconBtn} ${styles.deleteBtn}`}
                        aria-label="Delete task"
                    >
                        ×
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className={styles.details}>
                    <div className={styles.detailRow}>
                        <label>Due Date:</label>
                        <div className={styles.dateInputWrapper}>
                            <input
                                type="date"
                                value={item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    const date = e.target.value ? new Date(e.target.value).getTime() : undefined;
                                    onUpdate(item.id, { dueDate: date });
                                }}
                                className={styles.dateInput}
                            />
                            {item.dueDate && (
                                <button
                                    type="button"
                                    onClick={() => onUpdate(item.id, { dueDate: undefined })}
                                    className={styles.clearDateBtn}
                                    title="Clear deadline"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.stepsSection}>
                        <div className={styles.stepsLabel}>Steps:</div>
                        <ul className={styles.stepsList}>
                            {item.steps?.map(step => (
                                <li key={step.id} className={styles.stepItem}>
                                    <input
                                        type="checkbox"
                                        checked={step.completed}
                                        onChange={(e) => toggleStep(step.id, e.target.checked)}
                                    />
                                    <span className={step.completed ? styles.stepCompleted : ''}>{step.text}</span>
                                    <button onClick={() => deleteStep(step.id)} className={styles.stepDelete}>×</button>
                                </li>
                            ))}
                        </ul>
                        <form onSubmit={handleAddStep} className={styles.stepForm}>
                            <input
                                type="text"
                                value={newStepText}
                                onChange={(e) => setNewStepText(e.target.value)}
                                placeholder="Add a step..."
                                className={styles.stepInput}
                            />
                            <button type="submit" className={styles.stepAddBtn}>+</button>
                        </form>
                    </div>

                    <div className={styles.detailRow}>
                        <label>Notes:</label>
                        <textarea
                            value={item.notes || ''}
                            onChange={(e) => onUpdate(item.id, { notes: e.target.value })}
                            placeholder="Add notes..."
                            className={styles.notesInput}
                            rows={3}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function TodoList({
    id,
    title,
    items,
    onAdd,
    onUpdate,
    onDelete,
    onDeleteAll,
    onDeleteCompleted,
    onMarkAllCompleted,
    onDeletePending,
    moveActions
}: TodoListProps) {
    const [newItemText, setNewItemText] = useState('');

    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: { type: 'todo-list', listId: id }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText.trim()) {
            onAdd(newItemText.trim());
            setNewItemText('');
        }
    };

    const dropdownItems: (import('../DropdownMenu').DropdownItem | 'divider')[] = [];
    if (onMarkAllCompleted) dropdownItems.push({ label: 'Mark all as completed', onClick: onMarkAllCompleted });
    if (onDeleteCompleted) dropdownItems.push({ label: 'Delete completed', onClick: onDeleteCompleted, danger: true });
    if (onDeletePending) dropdownItems.push({ label: 'Delete pending', onClick: onDeletePending });
    if (onDeleteAll) dropdownItems.push({ label: 'Delete all', onClick: onDeleteAll, danger: true });

    if (dropdownItems.length > 0 && moveActions && moveActions.length > 0) {
        dropdownItems.push('divider' as const);
    }

    if (moveActions) {
        moveActions.forEach(action => {
            dropdownItems.push({ label: action.label, onClick: action.onClick });
        });
    }

    return (
        <div
            ref={setNodeRef}
            className={styles.container}
            style={isOver ? { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.05)' } : {}}
        >
            <div className={styles.header}>
                <h3 className={styles.title}>{title}</h3>
                {(dropdownItems.length > 0) && (
                    <DropdownMenu items={dropdownItems} />
                )}
            </div>

            <form onSubmit={handleSubmit} className={styles.inputForm}>
                <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    placeholder="Add a to-do..."
                    className={styles.input}
                />
            </form>

            <div className={styles.list}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.length === 0 && (
                        <div className={styles.emptyState}>No tasks yet</div>
                    )}
                    {items.map(item => (
                        <SortableTodoItem
                            key={item.id}
                            item={item}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
