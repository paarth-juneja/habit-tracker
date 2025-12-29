'use client';

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import styles from './PageTransition.module.css';

interface PageTransitionProps {
    children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Trigger a quick fade-in on route change
        setIsTransitioning(true);
        const timeout = setTimeout(() => {
            setIsTransitioning(false);
        }, 50);

        return () => clearTimeout(timeout);
    }, [pathname]);

    return (
        <div className={`${styles.pageTransition} ${isTransitioning ? styles.transitioning : styles.visible}`}>
            {children}
        </div>
    );
}
