'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // 1. Explicitly set persistence to LOCAL (persists across tab closes)
        // If you want session only (clears on close), use browserSessionPersistence
        const setAuthPersistence = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
            } catch (error) {
                console.error("Error setting persistence:", error);
            }
        };

        setAuthPersistence();

        // 2. Auth State Listener - SINGLE SOURCE OF TRUTH
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);

            // 3. Strict Route Protection
            const publicRoutes = ['/login', '/signup', '/']; // Add all public routes
            const isProtected = !publicRoutes.includes(pathname);

            if (!user && !loading && isProtected && pathname !== '/') {
                // Redirect immediately if not logged in and trying to access protected route
                if (!pathname.startsWith('/login')) {
                    router.replace('/login');
                }
            }
        });

        return () => unsubscribe();
    }, [router, pathname, loading]);

    // Secondary protection in case of timing issues
    useEffect(() => {
        const publicRoutes = ['/login', '/signup', '/'];
        const isProtected = !publicRoutes.includes(pathname);

        if (!loading && !user && isProtected && pathname !== '/') {
            if (!pathname.startsWith('/login')) {
                router.replace('/login');
            }
        }
    }, [user, loading, pathname, router]);

    const logout = async () => {
        try {
            await signOut(auth);
            // State update will happen via onAuthStateChanged
            // But we can force a redirect here for better UX specific to logout action
            router.replace('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            // Fallback redirect even if error
            router.replace('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {!loading ? children : <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>}
        </AuthContext.Provider>
    );
}
