import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import Providers from '@/components/Providers';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Everform - Track Your Goals & Daily Habits',
    description: 'A comprehensive habit tracking app to set goals, track daily habits, and achieve your dreams. From 10-year visions to weekly tasks.',
    keywords: ['habit tracker', 'goal setting', 'productivity', 'daily habits', 'self improvement'],
    icons: {
        icon: '/favicon-white-circle.png',
        apple: '/favicon-white-circle.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ServiceWorkerRegistration />
                <Providers>
                    {children}
                </Providers>
                <Analytics />
            </body>
        </html>
    );
}

