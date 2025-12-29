'use client';

import { useState } from 'react';
import { TodoItem } from '@/lib/todo';
import styles from './TodoList.module.css';

interface TodoListProps {
    title: string;
    items: TodoItem[];
    onAdd: (text: string) => void;
    onToggle: (id: string, completed: boolean) => void;
    onDelete: (id: string) => void;
}

export default function TodoList({ title, items, onAdd, onToggle, onDelete }: TodoListProps) {
    const [newItemText, setNewItemText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItemText.trim()) {
            onAdd(newItemText.trim());
            setNewItemText('');
        }
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>{title}</h3>

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
                    <div key={item.id} className={`${styles.item} ${item.completed ? styles.completed : ''}`}>
                        <label className={styles.checkboxLabel}>
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
                            onClick={() => onDelete(item.id)}
                            className={styles.deleteBtn}
                            aria-label="Delete task"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
