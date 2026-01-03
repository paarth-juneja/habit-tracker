'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import {
    clearAllUserCache,
    clearAuthCache,
    detectCacheCorruption,
    clearAllCache,
    getLastKnownUid,
    setLastKnownUid,
    hasUserSwitched,
    clearUserLocalStorage,
    warmCache,
} from '@/lib/cacheManager';
import { clearLegacyEmailCache } from '@/lib/localStorage';

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
    const previousUidRef = useRef<string | null>(null);
    const isInitialMount = useRef(true);

    // Set Firebase persistence on mount
    useEffect(() => {
        const setAuthPersistence = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
            } catch (error) {
                console.error("Error setting persistence:", error);
            }
        };
        setAuthPersistence();

        // Clean up legacy email-based cache on first load
        clearLegacyEmailCache();
    }, []);

    // Main auth state listener - SINGLE SOURCE OF TRUTH
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            // Handle auth state changes
            if (firebaseUser) {
                // User is signed in
                const currentUid = firebaseUser.uid;

                // Check for user switch
                if (previousUidRef.current && previousUidRef.current !== currentUid) {
                    console.log('[AuthProvider] User switch detected, clearing previous user cache');
                    clearUserLocalStorage(previousUidRef.current);
                }

                // Check for cache corruption
                if (detectCacheCorruption(currentUid)) {
                    console.warn('[AuthProvider] Cache corruption detected, performing full cleanup');
                    await clearAllCache();
                }

                // Update tracking
                previousUidRef.current = currentUid;
                setLastKnownUid(currentUid);
                setUser(firebaseUser);

                // Warm cache for quick access to common data
                warmCache(currentUid);
            } else {
                // User is signed out
                // Clear any remaining user cache to prevent data leakage
                const lastUid = getLastKnownUid();
                if (lastUid) {
                    console.log('[AuthProvider] User signed out, clearing cache');
                    clearUserLocalStorage(lastUid);
                    setLastKnownUid(null);
                }

                previousUidRef.current = null;
                setUser(null);
            }

            setLoading(false);
            isInitialMount.current = false;
        });

        return () => unsubscribe();
    }, []);

    // Route protection
    useEffect(() => {
        const publicRoutes = ['/login', '/signup', '/'];
        const isProtected = !publicRoutes.includes(pathname);

        if (!loading && !user && isProtected && pathname !== '/') {
            if (!pathname.startsWith('/login')) {
                router.replace('/login');
            }
        }
    }, [user, loading, pathname, router]);

    // Logout handler with full cache cleanup
    const logout = async () => {
        try {
            const currentUid = user?.uid;

            // 1. Clear user cache BEFORE signing out
            if (currentUid) {
                console.log('[AuthProvider] Initiating logout with cache cleanup');
                await clearAllUserCache(currentUid);
            }

            // 2. Clear auth-related cache
            await clearAuthCache();

            // 3. Sign out from Firebase
            await signOut(auth);

            // 4. Clear last known UID
            setLastKnownUid(null);

            // 5. Redirect to login
            router.replace('/login');
        } catch (error) {
            console.error('Logout failed:', error);

            // Fail-safe: Force clear everything and redirect
            await clearAllCache();
            router.replace('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {!loading ? (
                children
            ) : (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0a0a0a',
                    color: 'white',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(255,255,255,0.1)',
                            borderTopColor: '#3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 16px'
                        }} />
                        <p>Loading...</p>
                        <style>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}
