'use client';

import { ReactNode } from 'react';
import AuthProvider from './AuthProvider';
import PageTransition from './PageTransition';
import FeatureProvider from './FeatureProvider';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            <FeatureProvider>
                <PageTransition>{children}</PageTransition>
            </FeatureProvider>
        </AuthProvider>
    );
}
