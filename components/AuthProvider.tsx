'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);

            // Basic protection for dashboard routes
            if (!user && !loading && pathname.startsWith('/dashboard')) {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router, pathname, loading]);

    useEffect(() => {
        if (!loading && !user && pathname.startsWith('/dashboard')) {
            router.push('/login');
        }
    }, [user, loading, pathname, router])


    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading ? children : <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>}
        </AuthContext.Provider>
    );
}
