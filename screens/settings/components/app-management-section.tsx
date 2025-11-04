import React, { useCallback, useState } from 'react';
import ChevronRight from './chevron-right';
import Divider from './divider';
import SettingItem from './setting-item';
import SettingsSection from './settings-section';
import { Linking, Platform } from 'react-native';
import { APP_CONFIG } from '@/configs/app-config';
import { toast, Spinner, useTheme } from 'react-native-heroui';
import { updateService } from '@/services/update-service';

const AppManagementSection: React.FC = () => {
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
    const handleCheckUpdates = useCallback(async (): Promise<void> => {
        if (Platform.OS === 'web') {
            return;
        }

        setIsCheckingUpdates(true);
        try {
            const updateInfo = await updateService.checkForUpdates(true); // Force check

            if (updateInfo.isUpdateAvailable) {
                await updateService.showUpdateAlert(updateInfo);
            } else {
                toast.show("You're Up to Date!");
            }
        } catch (error) {
            toast.show('Update Check Failed');
        } finally {
            setIsCheckingUpdates(false);
        }
    }, []);

    const handleRateApp = () => {
        Linking.openURL(APP_CONFIG.APP_RATING_URL);
    };

    const handleSendFeedback = () => {
        Linking.openURL(APP_CONFIG.FEEDBACK_FORM_URL);
    };

    return (
        <SettingsSection title="App Management">
            <SettingItem
                title="Check for Updates"
                rightElement={
                    isCheckingUpdates ? <Spinner size="sm" color={'primary'} /> : <ChevronRight />
                }
                onPress={handleCheckUpdates}
            />
            <Divider />
            <SettingItem title="Rate App" rightElement={<ChevronRight />} onPress={handleRateApp} />
            <Divider />
            <SettingItem
                title="Send Feedback"
                rightElement={<ChevronRight />}
                onPress={handleSendFeedback}
            />
        </SettingsSection>
    );
};

export default AppManagementSection;
