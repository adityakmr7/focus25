import { useSettingsStore } from '@/stores/local-settings-store';
import React from 'react';
import { Switch } from 'react-native-heroui';
import ChevronRight from './chevron-right';
import Divider from './divider';
import SettingItem from './setting-item';
import SettingsSection from './settings-section';

interface FocusSettingsSectionProps {
    onFocusDurationPress: () => void;
    onBreakDurationPress: () => void;
}

const FocusSettingsSection: React.FC<FocusSettingsSectionProps> = ({
    onFocusDurationPress,
    onBreakDurationPress,
}) => {
    const { focusDuration, breakDuration, soundEffects, setSoundEffects, metronome, setMetronome } =
        useSettingsStore();

    return (
        <SettingsSection title="Focus Settings">
            <SettingItem
                title="Focus Duration"
                subtitle={`${focusDuration} ${focusDuration === 1 ? 'minute' : 'minutes'}`}
                rightElement={<ChevronRight />}
                onPress={onFocusDurationPress}
            />
            <Divider />
            <SettingItem
                title="Break Duration"
                subtitle={`${breakDuration} ${breakDuration === 1 ? 'minute' : 'minutes'}`}
                rightElement={<ChevronRight />}
                onPress={onBreakDurationPress}
            />
            <Divider />
            <SettingItem
                title="Sound Effects"
                rightElement={<Switch size="md" value={soundEffects} onChange={setSoundEffects} />}
            />
            <Divider />
            <SettingItem
                title="Metronome"
                subtitle="Tick sound on every countdown"
                rightElement={<Switch size="md" value={metronome} onChange={setMetronome} />}
            />
        </SettingsSection>
    );
};

export default FocusSettingsSection;
