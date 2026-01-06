'use client';

import Image from 'next/image';
import styles from './Header.module.css';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useFeatures, ALL_FEATURES } from '@/components/FeatureProvider';
import DropdownMenu, { DropdownItem } from '@/components/DropdownMenu';
import { CustomizeNavigationModal, ManageFeaturesModal } from '@/components/HeaderSettings';
import ProfileModal from '@/components/ProfileModal';
import { useState } from 'react';

export default function Header() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { enabledFeatures, isFeatureInHeader } = useFeatures();

    const [isNavModalOpen, setIsNavModalOpen] = useState(false);
    const [isFeatModalOpen, setIsFeatModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleSignOut = async () => {
        await logout();
    };

    // Prepare dropdown items
    const dropdownItems: (DropdownItem | 'divider')[] = [
        {
            label: 'Profile',
            onClick: () => setIsProfileModalOpen(true),
        },
        'divider'
    ];

    // Add enabled features to dropdown
    const featuresList = ALL_FEATURES.filter(f => enabledFeatures.includes(f.id));
    featuresList.forEach(f => {
        dropdownItems.push({
            label: f.label,
            onClick: () => router.push(f.path)
        });
    });

    dropdownItems.push('divider');
    dropdownItems.push({
        label: 'Customize Navigation',
        onClick: () => setIsNavModalOpen(true)
    });
    dropdownItems.push({
        label: 'Manage Features',
        onClick: () => setIsFeatModalOpen(true)
    });
    dropdownItems.push('divider');
    dropdownItems.push({
        label: 'Sign Out',
        onClick: handleSignOut,
        danger: true
    });

    const HamburgerIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    );

    return (
        <header className={styles.header}>
            <CustomizeNavigationModal
                isOpen={isNavModalOpen}
                onClose={() => setIsNavModalOpen(false)}
            />
            <ManageFeaturesModal
                isOpen={isFeatModalOpen}
                onClose={() => setIsFeatModalOpen(false)}
            />
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
            />

            <div className={styles.container}>
                <div className={styles.logo}>
                    <Image
                        src="/everform-logo.png"
                        alt="Everform Logo"
                        width={32}
                        height={32}
                        className={styles.logoImage}
                    />
                    <span className={styles.logoText}>Everform</span>
                </div>

                {user && (
                    <div className={styles.userSection}>
                        {/* Visible Header Links */}
                        <nav className={styles.navLinks}>
                            {featuresList.filter(f => isFeatureInHeader(f.id)).map(feature => (
                                <button
                                    key={feature.id}
                                    onClick={() => router.push(feature.path)}
                                    className={styles.navBtn}
                                >
                                    {feature.label}
                                </button>
                            ))}
                        </nav>

                        {/* Hamburger Menu - Replaces Profile/SignOut separate buttons */}
                        <div className={styles.menuContainer}>
                            <DropdownMenu items={dropdownItems} trigger={HamburgerIcon} />
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
