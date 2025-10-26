import TypographyText from '@/components/TypographyText';
import { useSettingsStore } from '@/stores/setting-store';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { HStack, SPACING, VStack, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppManagementSection from './components/app-management-section';
import AppSettingsSection from './components/app-settings-section';
import DurationPickerModal from './components/duration-picker-modal';
import FocusSettingsSection from './components/focus-settings-section';
import LegalSection from './components/legal-section';
import SupportSection from './components/support-section';
import ThemeSelectionModal from './components/theme-selection-modal';
import DataManagementSection from './components/data-management-section';

const SettingsScreen = () => {
    const { theme } = useTheme();

    // Modal states
    const [focusDurationModalVisible, setFocusDurationModalVisible] = useState(false);
    const [breakDurationModalVisible, setBreakDurationModalVisible] = useState(false);
    const [themeModalVisible, setThemeModalVisible] = useState(false);

    // Get settings from store
    const { focusDuration, breakDuration, setFocusDuration, setBreakDuration } = useSettingsStore();

    // Handler functions
    const handleTextSizePress = () => {
        console.log('Open text size picker');
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* Header */}
            <HStack alignItems="center" justifyContent="center" px="md" py="sm">
                <TypographyText variant="title" color="default">
                    Settings
                </TypographyText>
                <View style={{ width: 24 }} />
            </HStack>

            <ScrollView
                contentContainerStyle={{
                    paddingBottom: SPACING['unit-14'],
                }}
                style={{ flex: 1 }}
            >
                <VStack px="md" gap="lg">
                    {/* <UpgradeToPro /> */}
                    {/* <AccountSection /> */}
                    {/* <DeviceSection /> */}
                    <FocusSettingsSection
                        onFocusDurationPress={() => setFocusDurationModalVisible(true)}
                        onBreakDurationPress={() => setBreakDurationModalVisible(true)}
                    />
                    <AppSettingsSection
                        onTextSizePress={handleTextSizePress}
                        onThemePress={() => setThemeModalVisible(true)}
                    />
                    <AppManagementSection />
                    <LegalSection />
                    <SupportSection />
                    <DataManagementSection />
                </VStack>
            </ScrollView>

            {/* Duration Picker Modals */}
            <DurationPickerModal
                visible={focusDurationModalVisible}
                onClose={() => setFocusDurationModalVisible(false)}
                title="Focus Duration"
                selectedDuration={focusDuration}
                onSelectDuration={setFocusDuration}
            />
            <DurationPickerModal
                visible={breakDurationModalVisible}
                onClose={() => setBreakDurationModalVisible(false)}
                title="Break Duration"
                selectedDuration={breakDuration}
                onSelectDuration={setBreakDuration}
            />

            {/* Theme Selection Modal */}
            <ThemeSelectionModal
                visible={themeModalVisible}
                onClose={() => setThemeModalVisible(false)}
            />
        </SafeAreaView>
    );
};

export default SettingsScreen;
