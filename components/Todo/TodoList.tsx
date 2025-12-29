'use client';

import { useState } from 'react';
import { TodoItem } from '@/lib/todo';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import styles from './TodoList.module.css';
import DropdownMenu from '../DropdownMenu';

interface TodoListProps {
    id: string; // The droppable ID (e.g., 'list:daily', 'list:weekly')
    title: string;
    items: TodoItem[];
    onAdd: (text: string) => void;
    onToggle: (id: string, completed: boolean) => void;
    onDelete: (id: string) => void;
    onDeleteAll?: () => void;
    onDeleteCompleted?: () => void;
    onMarkAllCompleted?: () => void;
    onDeletePending?: () => void;
    moveActions?: { label: string, onClick: () => void }[];
}

function DraggableTodoItem({ item, onToggle, onDelete }: {
    item: TodoItem,
    onToggle: (id: string, completed: boolean) => void,
    onDelete: (id: string) => void
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        data: { item, type: 'todo-item' }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`${styles.item} ${item.completed ? styles.completed : ''}`}
        >
            <label className={styles.checkboxLabel} onPointerDown={(e) => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={(e) => onToggle(item.id, e.target.checked)}
                    className={styles.checkbox}
                />
                <span className={styles.checkmark}></span>
            </label>
            <span className={styles.text}>{item.text}</span>
            <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onDelete(item.id)}
                className={styles.deleteBtn}
                aria-label="Delete task"
            >
                ×
            </button>
        </div>
    );
}

export default function TodoList({
    id,
    title,
    items,
    onAdd,
    onToggle,
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
                {items.length === 0 && (
                    <div className={styles.emptyState}>No tasks yet</div>
                )}
                {items.map(item => (
                    <DraggableTodoItem
                        key={item.id}
                        item={item}
                        onToggle={onToggle}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </div>
    );
}
