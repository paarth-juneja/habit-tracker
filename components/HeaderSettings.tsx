'use client';

import Modal from './Modal';
import ToggleSwitch from './ToggleSwitch';
import { useFeatures, ALL_FEATURES } from './FeatureProvider';
import styles from './HeaderSettings.module.css';

interface CustomizeNavigationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CustomizeNavigationModal({ isOpen, onClose }: CustomizeNavigationModalProps) {
    const { enabledFeatures, isFeatureInHeader, toggleFeatureInHeader } = useFeatures();

    // Only show enabled features
    const featuresToList = ALL_FEATURES.filter(f => enabledFeatures.includes(f.id));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Customize Navigation">
            <div className={styles.container}>
                <p className={styles.description}>
                    Choose which features appear in the header navigation bar.
                </p>
                {featuresToList.length === 0 ? (
                    <p style={{ color: '#888' }}>No enabled features to customize.</p>
                ) : (
                    featuresToList.map(feature => (
                        <div key={feature.id} className={styles.row}>
                            <span className={styles.label}>{feature.label}</span>
                            <ToggleSwitch
                                checked={isFeatureInHeader(feature.id)}
                                onChange={() => toggleFeatureInHeader(feature.id)}
                            />
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
}

interface ManageFeaturesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ManageFeaturesModal({ isOpen, onClose }: ManageFeaturesModalProps) {
    const { isFeatureEnabled, toggleFeatureEnabled } = useFeatures();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Features">
            <div className={styles.container}>
                <p className={styles.description}>
                    Enable or disable features. Disabled features are hidden but data is preserved.
                </p>
                {ALL_FEATURES.map(feature => (
                    <div key={feature.id} className={styles.row}>
                        <span className={styles.label}>{feature.label}</span>
                        <ToggleSwitch
                            checked={isFeatureEnabled(feature.id)}
                            onChange={() => toggleFeatureEnabled(feature.id)}
                        />
                    </div>
                ))}
            </div>
        </Modal>
    );
}
