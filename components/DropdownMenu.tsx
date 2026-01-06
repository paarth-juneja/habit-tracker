'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './DropdownMenu.module.css';

export interface DropdownItem {
    label: string;
    onClick: () => void;
    danger?: boolean;
}

interface DropdownMenuProps {
    items: (DropdownItem | 'divider')[];
    trigger?: React.ReactNode;
}

export default function DropdownMenu({ items, trigger }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.container} ref={menuRef}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="More options"
            >
                {trigger || '⋮'}
            </button>

            {isOpen && (
                <div className={styles.menu}>
                    {items.map((item, index) => {
                        if (item === 'divider') {
                            return <div key={index} className={styles.divider} />;
                        }
                        return (
                            <button
                                key={index}
                                className={`${styles.menuItem} ${item.danger ? styles.danger : ''}`}
                                onClick={() => {
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
