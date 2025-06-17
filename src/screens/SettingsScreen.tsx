import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import { SettingItem } from '../components/SettingItem';
import { SectionHeader } from '../components/SectionHeader';
import { TimeDurationSelector } from '../components/TimeDurationSelector';
import { useSettingsStore } from '../store/settingsStore';

interface SettingsScreenProps {
    navigation?: {
        goBack: () => void;
    };
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const {
        timeDuration,
        soundEffects,
        notifications,
        darkMode,
        autoBreak,
        focusReminders,
        weeklyReports,
        dataSync,
        toggleSetting,
        setTimeDuration,
        exportData,
        deleteData,
        rateApp,
        openSupport,
        openPrivacy,
        openTerms,
        openTheme,
        openStorage,
        openFeedback,
        breakDuration,
        setBreakDuration
    } = useSettingsStore();

    const showAlert = (title: string, message: string): void => {
        Alert.alert(title, message, [{ text: 'OK' }]);
    };

    const handleExportData = (): void => {
        exportData();
        showAlert('Export Data', 'Your data has been exported successfully.');
    };

    const handleDeleteData = (): void => {
        Alert.alert(
            'Delete All Data',
            'Are you sure you want to delete all your flow data? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteData();
                        showAlert('Data Deleted', 'All your data has been deleted.');
                    }
                }
            ]
        );
    };

    const handleRateApp = (): void => {
        rateApp();
        showAlert('Rate App', 'Thank you for using our app! Redirecting to app store...');
    };

    const handleSupport = (): void => {
        openSupport();
        showAlert('Support', 'Opening support page...');
    };

    const handlePrivacy = (): void => {
        openPrivacy();
        showAlert('Privacy Policy', 'Opening privacy policy...');
    };

    const handleTerms = (): void => {
        openTerms();
        showAlert('Terms of Service', 'Opening terms of service...');
    };

    const handleTheme = (): void => {
        openTheme();
        showAlert('Theme', 'Theme options coming soon!');
    };

    const handleStorage = (): void => {
        openStorage();
        showAlert('Storage', 'Storage details coming soon!');
    };

    const handleFeedback = (): void => {
        openFeedback();
        showAlert('Feedback', 'Opening feedback form...');
    };

    return (
        <SafeAreaView className={"bg-bg-100 flex-1 dark:bg-dark-bg-100"}>
            <View className={"border-b-bg-200 dark:border-b-dark-bg-200"} style={styles.header}>
                <View style={styles.placeholder} />
                <Text className={"color-text-primary dark:color-dark-text-primary"} style={styles.title}>Settings</Text>
                <View style={styles.placeholder} />
            </View>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <SectionHeader title="TIMER" />
                <View className={"bg-bg-200 dark:bg-dark-bg-200"} style={styles.section}>
                    <View style={styles.timeDurationContainer}>
                        <Text className={"text-text-primary dark:text-dark-text-primary"} style={styles.timeDurationLabel}>
                            Focus Duration
                        </Text>
                        <TimeDurationSelector
                            value={timeDuration}
                            onChange={setTimeDuration}
                        />
                    </View>

                    <View style={styles.timeDurationContainer}>
                        <Text className={"text-text-primary dark:text-dark-text-primary"} style={styles.timeDurationLabel}>
                            Break Duration
                        </Text>
                        <TimeDurationSelector
                            value={breakDuration}
                            onChange={setBreakDuration}
                        />
                    </View>
                </View>

                <SectionHeader title="NOTIFICATIONS" />
                <View className={"bg-bg-200 dark:bg-dark-bg-200"} style={styles.section}>
                    <SettingItem
                        title="Push Notifications"
                        subtitle="Receive flow reminders and updates"
                        icon="notifications-outline"
                        hasSwitch={true}
                        switchValue={notifications}
                        onSwitchToggle={() => toggleSetting('notifications')}
                    />
                    <SettingItem
                        title="Focus Reminders"
                        subtitle="Get reminded to start your focus sessions"
                        icon="time-outline"
                        hasSwitch={true}
                        switchValue={focusReminders}
                        onSwitchToggle={() => toggleSetting('focusReminders')}
                    />
                    <SettingItem
                        title="Weekly Reports"
                        subtitle="Receive weekly productivity summaries"
                        icon="bar-chart-outline"
                        hasSwitch={true}
                        switchValue={weeklyReports}
                        onSwitchToggle={() => toggleSetting('weeklyReports')}
                    />
                </View>

                <SectionHeader title="EXPERIENCE" />
                <View style={styles.section}>
                    <SettingItem
                        title="Sound Effects"
                        subtitle="Play sounds during flow sessions"
                        icon="volume-medium-outline"
                        hasSwitch={true}
                        switchValue={soundEffects}
                        onSwitchToggle={() => toggleSetting('soundEffects')}
                    />
                    <SettingItem
                        title="Vibration"
                        subtitle="Vibrate for important notifications"
                        icon="phone-portrait-outline"
                        hasSwitch={true}
                        switchValue={darkMode}
                        onSwitchToggle={() => toggleSetting('darkMode')}
                    />
                    <SettingItem
                        title="Auto Break"
                        subtitle="Automatically start break sessions"
                        icon="pause-circle-outline"
                        hasSwitch={true}
                        switchValue={autoBreak}
                        onSwitchToggle={() => toggleSetting('autoBreak')}
                    />
                    <SettingItem
                        title="Theme"
                        subtitle="App appearance"
                        icon="color-palette-outline"
                        value="Dark"
                        showArrow={true}
                        onPress={handleTheme}
                    />
                </View>

                <SectionHeader title="DATA & SYNC" />
                <View style={styles.section}>
                    <SettingItem
                        title="Cloud Sync"
                        subtitle="Sync your data across devices"
                        icon="cloud-outline"
                        hasSwitch={true}
                        switchValue={dataSync}
                        onSwitchToggle={() => toggleSetting('dataSync')}
                    />
                    <SettingItem
                        title="Export Data"
                        subtitle="Download your flow statistics"
                        icon="download-outline"
                        showArrow={true}
                        onPress={handleExportData}
                    />
                    <SettingItem
                        title="Storage Usage"
                        subtitle="Manage app storage"
                        icon="folder-outline"
                        value="12.4 MB"
                        showArrow={true}
                        onPress={handleStorage}
                    />
                </View>

                <SectionHeader title="SUPPORT" />
                <View style={styles.section}>
                    <SettingItem
                        title="Help & Support"
                        subtitle="Get help with the app"
                        icon="help-circle-outline"
                        showArrow={true}
                        onPress={handleSupport}
                    />
                    <SettingItem
                        title="Rate App"
                        subtitle="Rate us on the App Store"
                        icon="star-outline"
                        showArrow={true}
                        onPress={handleRateApp}
                    />
                    <SettingItem
                        title="Send Feedback"
                        subtitle="Share your thoughts with us"
                        icon="chatbubble-outline"
                        showArrow={true}
                        onPress={handleFeedback}
                    />
                </View>

                <SectionHeader title="LEGAL" />
                <View style={styles.section}>
                    <SettingItem
                        title="Privacy Policy"
                        icon="shield-outline"
                        showArrow={true}
                        onPress={handlePrivacy}
                    />
                    <SettingItem
                        title="Terms of Service"
                        icon="document-text-outline"
                        showArrow={true}
                        onPress={handleTerms}
                    />
                </View>

                <SectionHeader title="DANGER ZONE" />
                <View style={styles.section}>
                    <SettingItem
                        title="Delete All Data"
                        subtitle="Permanently remove all your flow data"
                        icon="trash-outline"
                        showArrow={true}
                        onPress={handleDeleteData}
                    />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Flow Focus v1.2.3</Text>
                    <Text style={styles.copyrightText}>© 2025 Flow Focus App</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
    placeholder: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    versionText: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
    },
    copyrightText: {
        fontSize: 12,
        color: '#444444',
    },
    timeDurationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    timeDurationLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default SettingsScreen;
