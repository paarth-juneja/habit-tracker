import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Habit Tracker - Track Your Goals & Daily Habits',
    description: 'A comprehensive habit tracking app to set goals, track daily habits, and achieve your dreams. From 10-year visions to weekly tasks.',
    keywords: ['habit tracker', 'goal setting', 'productivity', 'daily habits', 'self improvement'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
