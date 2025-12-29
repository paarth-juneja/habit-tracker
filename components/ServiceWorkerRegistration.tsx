'use client';

import { useEffect } from 'react';

/**
 * Component to register the Service Worker
 * 
 * Registers on mount and handles updates gracefully.
 * The SW only caches static assets, never auth endpoints.
 */
export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return;
        }

        // Disable SW in development mode to avoid slow reloads and HMR issues

        if (process.env.NODE_ENV === 'development') {
            // Check for and unregister any existing service workers
            navigator.serviceWorker.getRegistrations().then(registrations => {
                if (registrations.length > 0) {
                    console.log(`[SW] Development mode: Found ${registrations.length} active Service Worker(s). Unregistering...`);
                    for (const registration of registrations) {
                        registration.unregister();
                    }
                    console.log('[SW] All Service Workers unregistered to prevent dev interference.');
                }
            });
            return;
        }

        // Wait for page load to register SW
        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/',
                });

                console.log('[SW] Service Worker registered:', registration.scope);

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New SW available, skip waiting to activate immediately
                            console.log('[SW] New version available, activating...');
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });

                // Listen for messages from SW
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data && event.data.type === 'CACHE_CLEARED') {
                        console.log('[SW] Cache cleared by Service Worker');
                    }
                });
            } catch (error) {
                console.error('[SW] Registration failed:', error);
            }
        };

        // Delay registration to not block initial page load
        if (document.readyState === 'complete') {
            registerSW();
        } else {
            window.addEventListener('load', registerSW);
            return () => window.removeEventListener('load', registerSW);
        }
    }, []);

    // This component doesn't render anything
    return null;
}
