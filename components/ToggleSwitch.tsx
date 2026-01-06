import styles from './ToggleSwitch.module.css';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export default function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
    return (
        <label className={styles.switch}>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <span className={styles.slider}></span>
        </label>
    );
}
