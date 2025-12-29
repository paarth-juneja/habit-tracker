'use client';

import { ReactNode } from 'react';
import AuthProvider from './AuthProvider';
import PageTransition from './PageTransition';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            <PageTransition>{children}</PageTransition>
        </AuthProvider>
    );
}
