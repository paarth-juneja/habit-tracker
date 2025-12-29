'use client';

import { useState } from 'react';
import styles from './YearMonthPicker.module.css';

interface YearMonthPickerProps {
    currentDate: Date;
    onSelect: (date: Date) => void;
    onClose: () => void;
}

export default function YearMonthPicker({ currentDate, onSelect, onClose }: YearMonthPickerProps) {
    const [step, setStep] = useState<'year' | 'month'>('year');
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => currentYear - 2 + i); // e.g. 2023 to 2034
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const today = new Date();
    const currentRealYear = today.getFullYear();
    const currentRealMonth = today.getMonth();

    const handleYearSelect = (year: number) => {
        setSelectedYear(year);
        setStep('month');
    };

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(selectedYear);
        newDate.setMonth(monthIndex);
        onSelect(newDate);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.picker} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>{step === 'year' ? 'Select Year' : 'Select Month'}</h3>
                    {step === 'month' && (
                        <button
                            className={styles.backBtn}
                            onClick={() => setStep('year')}
                        >
                            ← Back
                        </button>
                    )}
                </div>

                <div className={styles.grid}>
                    {step === 'year' ? (
                        years.map(year => (
                            <button
                                key={year}
                                className={`
                                    ${styles.option} 
                                    ${year === currentRealYear ? styles.current : ''}
                                `}
                                onClick={() => handleYearSelect(year)}
                            >
                                {year}
                            </button>
                        ))
                    ) : (
                        months.map((month, index) => (
                            <button
                                key={month}
                                className={`
                                    ${styles.option} 
                                    ${index === currentRealMonth && selectedYear === currentRealYear ? styles.current : ''}
                                `}
                                onClick={() => handleMonthSelect(index)}
                            >
                                {month.slice(0, 3)}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
