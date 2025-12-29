'use client';

import styles from './page.module.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import MonthSelector from '@/components/Journal/MonthSelector';
import CalendarGrid from '@/components/Journal/CalendarGrid';
import JournalEditor from '@/components/Journal/JournalEditor';
import Header from '@/components/Header';
import { useAuth } from '@/components/AuthProvider';
import { getJournalEntry, saveJournalEntry, getJournalDatesForMonth } from '@/lib/journal';

export default function JournalPage() {
    const { user } = useAuth();

    // State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [entryDates, setEntryDates] = useState<string[]>([]);

    // Refs for auto-save management
    const contentRef = useRef(content);
    const dirtyRef = useRef(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update contentRef whenever content changes
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Load entry dates for the month
    useEffect(() => {
        if (!user) return;

        const loadEntryDates = async () => {
            try {
                const dates = await getJournalDatesForMonth(user.uid, currentMonth);
                setEntryDates(dates);
            } catch (error) {
                console.error("Failed to load entry dates:", error);
            }
        };

        loadEntryDates();
    }, [user, currentMonth]);

    // Load content when Date changes
    useEffect(() => {
        if (!user) return;

        const loadContent = async () => {
            setIsLoading(true);
            try {
                const text = await getJournalEntry(user.uid, selectedDate);
                setContent(text);
                contentRef.current = text;
                dirtyRef.current = false; // Reset dirty selection
            } catch (error) {
                console.error("Failed to load entry:", error);
                setContent('');
            } finally {
                setIsLoading(false);
            }
        };

        loadContent();
    }, [user, selectedDate, contentRef, dirtyRef]);

    // Save Logic
    const saveContent = useCallback(async (dateToSave: Date, contentToSave: string) => {
        if (!user) return;

        setIsSaving(true);
        try {
            await saveJournalEntry(user.uid, dateToSave, contentToSave);
            // Refresh entry dates if it's new
            // Optimization: Only refresh if we know it was empty before? 
            // For simplicity, we can just update the local entryDates list optimistically or refetch.
            // Let's refetch or just add it to list

            const y = dateToSave.getFullYear();
            const m = String(dateToSave.getMonth() + 1).padStart(2, '0');
            const d = String(dateToSave.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            setEntryDates(prev => {
                const hasContent = contentToSave.trim().length > 0;

                if (!prev.includes(dateStr) && hasContent) {
                    return [...prev, dateStr];
                } else if (prev.includes(dateStr) && !hasContent) {
                    return prev.filter(d => d !== dateStr);
                }
                return prev;
            });

        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setIsSaving(false);
            dirtyRef.current = false;
        }
    }, [user]);

    // Debounced Auto-save
    useEffect(() => {
        if (isLoading) return;

        // If content changed, set dirty
        // Note: this effect runs on mount too (loading false). 
        // We need to avoid initial run saving. 
        // But we handle that by dirtyRef logic? 
        // Actually, simplest is: if content !== initialContent

        // We'll track changes via onChange handler instead of effect for dirty marking

        if (dirtyRef.current) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            setIsSaving(true); // Indicate pending save
            saveTimeoutRef.current = setTimeout(() => {
                saveContent(selectedDate, content);
            }, 1000);
        }

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [content, isLoading, saveContent, selectedDate]);

    // Save on Unmount or Date Switch (Flush)
    // We can't easily hook into "before date switch" in pure effect cleanup safely for async.
    // So we handle it in the handleDateSelect.

    const handleContentChange = (newContent: string) => {
        setContent(newContent);
        dirtyRef.current = true;
    };

    const handleDateSelect = async (date: Date) => {
        // If dirty, save immediately (fire and forget or await?)
        if (dirtyRef.current) {
            // Cancel pending debounce
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            // Save current content to current date
            saveContent(selectedDate, contentRef.current);
        }

        setSelectedDate(date);
    };

    if (!user) return null; // Or loading spinner

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

                        <CalendarGrid
                            currentMonth={currentMonth}
                            selectedDate={selectedDate}
                            entryDates={entryDates}
                            onDateSelect={handleDateSelect}
                        />
                    </div>

                    <div className={styles.mainContent}>
                        {isLoading ? (
                            <div style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
                        ) : (
                            <JournalEditor
                                date={selectedDate}
                                content={content}
                                isSaving={isSaving}
                                onChange={handleContentChange}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
