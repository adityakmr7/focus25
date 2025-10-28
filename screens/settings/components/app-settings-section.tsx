import { useSettingsStore } from '@/stores/local-settings-store';
import React from 'react';
import { Switch } from 'react-native-heroui';
import ChevronRight from './chevron-right';
import Divider from './divider';
import SettingItem from './setting-item';
import SettingsSection from './settings-section';

interface AppSettingsSectionProps {
    onTextSizePress: () => void;
    onThemePress: () => void;
}

const AppSettingsSection: React.FC<AppSettingsSectionProps> = ({
    onTextSizePress,
    onThemePress,
}) => {
    const {
        themeMode,
        notifications,
        setNotifications,
        textSize,
        syncWithCloud,
        setSyncWithCloud,
    } = useSettingsStore();

    return (
        <SettingsSection title="App Settings">
            <SettingItem
                title="Notifications"
                subtitle="Get notified when timer completes in background"
                rightElement={
                    <Switch size="md" value={notifications} onChange={setNotifications} />
                }
            />
            <Divider />
            {/* <SettingItem
                title="Text Size"
                subtitle={textSize.charAt(0).toUpperCase() + textSize.slice(1)}
                rightElement={<ChevronRight />}
                onPress={onTextSizePress}
            />
            <Divider /> */}
            <SettingItem
                title="Theme"
                subtitle={
                    themeMode === 'system' ? 'System' : themeMode === 'light' ? 'Light' : 'Dark'
                }
                rightElement={<ChevronRight />}
                onPress={onThemePress}
            />
        </SettingsSection>
    );
};

export default AppSettingsSection;
