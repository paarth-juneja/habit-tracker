'use client';

import { useEffect, useRef } from 'react';
import styles from './JournalEditor.module.css';

interface JournalEditorProps {
    date: Date;
    content: string;
    isSaving: boolean;
    onChange: (content: string) => void;
}

export default function JournalEditor({ date, content, isSaving, onChange }: JournalEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const formattedDate = date.toLocaleDateString('default', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    useEffect(() => {
        // Auto-focus when date changes
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [date]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.dateTitle}>{formattedDate}</h2>
                <div className={styles.status}>
                    {isSaving ? (
                        <span className={styles.saving}>Saving...</span>
                    ) : (
                        <span className={styles.saved}>Saved</span>
                    )}
                </div>
            </div>

            <textarea
                ref={textareaRef}
                className={styles.editor}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Write anything. This space is yours."
                spellCheck={false}
            />
        </div>
    );
}
