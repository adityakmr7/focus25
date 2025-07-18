import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, SafeAreaView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { SettingItem } from '../components/SettingItem';
import { SectionHeader } from '../components/SectionHeader';
import { TimeDurationSelector } from '../components/TimeDurationSelector';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeStore } from '../store/themeStore';
import { useTheme } from '../hooks/useTheme';
import { useGoalsStore } from '../store/goalsStore';
import { useStatisticsStore } from '../store/statisticsStore';
import { usePomodoroStore } from '../store/pomodoroStore';
import { Ionicons } from '@expo/vector-icons';
import { version } from '../../package.json';
import { updateService } from '../services/updateService';

interface SettingsScreenProps {
    navigation?: {
        goBack: () => void;
        navigate: (screen: string) => void;
    };
}

interface StorageInfo {
    totalSize: number;
    breakdown: {
        goals: number;
        statistics: number;
        settings: number;
        theme: number;
        flowMetrics: number;
    };
    formattedSize: string;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { setMode } = useThemeStore();
    const { theme, isDark } = useTheme();
    const {
        timeDuration,
        soundEffects,
        notifications,
        autoBreak,
        focusReminders,
        weeklyReports,
        dataSync,
        showStatistics,
        toggleSetting,
        setTimeDuration,
        exportData,
        deleteData,
        rateApp,
        openSupport,
        openPrivacy,
        openTerms,
        openFeedback,
        breakDuration,
        setBreakDuration,
    } = useSettingsStore();

    const { goals } = useGoalsStore();
    const { flows, breaks, interruptions } = useStatisticsStore();
    const { flowMetrics } = usePomodoroStore();

    const [storageInfo, setStorageInfo] = useState<StorageInfo>({
        totalSize: 0,
        breakdown: {
            goals: 0,
            statistics: 0,
            settings: 0,
            theme: 0,
            flowMetrics: 0,
        },
        formattedSize: '0 KB',
    });

    const [isExporting, setIsExporting] = useState(false);
    const [isCalculatingStorage, setIsCalculatingStorage] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false); // Track if animations have run
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

    // Reanimated shared values
    const headerProgress = useSharedValue(0);
    const sectionsProgress = useSharedValue(0);

    useEffect(() => {
        // Only animate on first mount
        if (!hasAnimated) {
            headerProgress.value = withTiming(1, { duration: 800 });
            sectionsProgress.value = withDelay(200, withTiming(1, { duration: 800 }));
            setHasAnimated(true);
        }

        calculateStorageUsage();
    }, []); // Empty dependency array - only run on mount

    // Separate effect for storage recalculation
    useEffect(() => {
        if (hasAnimated) {
            // Only recalculate if initial animation has completed
            calculateStorageUsage();
        }
    }, [goals.length, flows, breaks, interruptions, flowMetrics]);

    // Memoize storage calculation
    const calculateStorageUsage = useCallback(async () => {
        setIsCalculatingStorage(true);
        try {
            const goalsSize = JSON.stringify(goals).length;
            const statisticsSize = JSON.stringify({ flows, breaks, interruptions }).length;
            const settingsSize = JSON.stringify({
                timeDuration,
                breakDuration,
                soundEffects,
                notifications,
                autoBreak,
                focusReminders,
                weeklyReports,
                dataSync,
            }).length;
            const themeSize = 500;
            const flowMetricsSize = JSON.stringify(flowMetrics).length;

            const totalSize =
                goalsSize + statisticsSize + settingsSize + themeSize + flowMetricsSize;

            const formatBytes = (bytes: number): string => {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            setStorageInfo({
                totalSize,
                breakdown: {
                    goals: goalsSize,
                    statistics: statisticsSize,
                    settings: settingsSize,
                    theme: themeSize,
                    flowMetrics: flowMetricsSize,
                },
                formattedSize: formatBytes(totalSize),
            });
        } catch (error) {
            console.error('Failed to calculate storage usage:', error);
        } finally {
            setIsCalculatingStorage(false);
        }
    }, [
        goals,
        flows,
        breaks,
        interruptions,
        flowMetrics,
        timeDuration,
        breakDuration,
        soundEffects,
        notifications,
        autoBreak,
        focusReminders,
        weeklyReports,
        dataSync,
    ]);

    // Memoize handlers
    const showAlert = useCallback((title: string, message: string): void => {
        Alert.alert(title, message, [{ text: 'OK' }]);
    }, []);

    const handleExportData = useCallback(async (): Promise<void> => {
        setIsExporting(true);
        try {
            const exportedData = await exportData();

            if (Platform.OS === 'web') {
                const blob = new Blob([exportedData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `focus25_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showAlert('Export Successful', 'Your data has been downloaded successfully.');
            } else {
                await Share.share({
                    message: exportedData,
                    title: 'Focus25 Data Export',
                });
            }
        } catch (error) {
            console.error('Export failed:', error);
            showAlert('Export Failed', 'Failed to export your data. Please try again.');
        } finally {
            setIsExporting(false);
        }
    }, [exportData, showAlert]);

    const handleDeleteData = useCallback((): void => {
        Alert.alert(
            'Delete All Data',
            `Are you sure you want to delete all your focus data? This will permanently remove:\n\n• ${goals.length} goals\n• All statistics and flow metrics\n• Custom settings and themes\n\nThis action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteData();
                            showAlert(
                                'Data Deleted',
                                'All your data has been permanently deleted.',
                            );
                            setTimeout(calculateStorageUsage, 500);
                        } catch (error) {
                            showAlert('Delete Failed', 'Failed to delete data. Please try again.');
                        }
                    },
                },
            ],
        );
    }, [goals.length, deleteData, showAlert, calculateStorageUsage]);

    const handleStorageDetails = useCallback((): void => {
        const breakdown = storageInfo.breakdown;
        const total = storageInfo.totalSize;

        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const getPercentage = (size: number): string => {
            return total > 0 ? `${Math.round((size / total) * 100)}%` : '0%';
        };

        const message =
            `Storage Breakdown:\n\n` +
            `📊 Goals: ${formatBytes(breakdown.goals)} (${getPercentage(breakdown.goals)})\n` +
            `📈 Statistics: ${formatBytes(breakdown.statistics)} (${getPercentage(breakdown.statistics)})\n` +
            `🔥 Flow Metrics: ${formatBytes(breakdown.flowMetrics)} (${getPercentage(breakdown.flowMetrics)})\n` +
            `⚙️ Settings: ${formatBytes(breakdown.settings)} (${getPercentage(breakdown.settings)})\n` +
            `🎨 Theme: ${formatBytes(breakdown.theme)} (${getPercentage(breakdown.theme)})\n\n` +
            `Total: ${storageInfo.formattedSize}`;

        Alert.alert('Storage Details', message, [{ text: 'OK' }]);
    }, [storageInfo]);

    const handleRateApp = useCallback((): void => {
        rateApp();
    }, [rateApp, showAlert]);

    const handleSupport = useCallback((): void => {
        openSupport();
    }, [openSupport, showAlert]);

    const handlePrivacy = useCallback((): void => {
        openPrivacy();
    }, [openPrivacy, showAlert]);

    const handleTerms = useCallback((): void => {
        openTerms();
    }, [openTerms, showAlert]);

    const handleTheme = useCallback((): void => {
        setMode(isDark ? 'light' : 'dark');
    }, [isDark, setMode]);

    const handleFeedback = useCallback((): void => {
        openFeedback();
    }, [openFeedback, showAlert]);

    const handleCheckForUpdates = useCallback(async (): Promise<void> => {
        if (Platform.OS === 'web') {
            showAlert('Not Available', 'Update checking is not available on the web version.');
            return;
        }

        setIsCheckingUpdates(true);
        try {
            const updateInfo = await updateService.checkForUpdates(true); // Force check
            
            if (updateInfo.isUpdateAvailable) {
                await updateService.showUpdateAlert(updateInfo);
            } else {
                showAlert('You\'re Up to Date!', `You have the latest version (${updateInfo.currentVersion}) of the app.`);
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
            showAlert('Update Check Failed', 'Unable to check for updates. Please try again later.');
        } finally {
            setIsCheckingUpdates(false);
        }
    }, [showAlert]);

    const handleThemeCustomization = useCallback((): void => {
        if (navigation) {
            navigation.navigate('ThemeCustomization');
        } else {
            showAlert('Navigation Error', 'Theme customization is not available.');
        }
    }, [navigation, showAlert]);

    // Memoize animated styles
    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(headerProgress.value, [0, 1], [0, 1]),
            transform: [
                {
                    translateY: interpolate(headerProgress.value, [0, 1], [-30, 0]),
                },
            ],
        };
    });

    const sectionsAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(sectionsProgress.value, [0, 1], [0, 1]),
            transform: [
                {
                    translateY: interpolate(sectionsProgress.value, [0, 1], [20, 0]),
                },
            ],
        };
    });

    // Memoize AnimatedSection component
    const AnimatedSection = useMemo(
        () =>
            React.memo(({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
                const sectionProgress = useSharedValue(0);
                const [sectionAnimated, setSectionAnimated] = useState(false);

                useEffect(() => {
                    if (hasAnimated && !sectionAnimated) {
                        sectionProgress.value = withDelay(delay, withTiming(1, { duration: 600 }));
                        setSectionAnimated(true);
                    }
                }, [hasAnimated, sectionAnimated, delay]);

                const sectionAnimatedStyle = useAnimatedStyle(() => {
                    return {
                        opacity: interpolate(sectionProgress.value, [0, 1], [0, 1]),
                        transform: [
                            {
                                translateY: interpolate(sectionProgress.value, [0, 1], [20, 0]),
                            },
                        ],
                    };
                });

                return <Animated.View style={sectionAnimatedStyle}>{children}</Animated.View>;
            }),
        [hasAnimated],
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Enhanced Header */}
            <Animated.View
                style={[styles.header, { borderBottomColor: theme.surface }, headerAnimatedStyle]}
            >
                <View style={styles.headerContent}>
                    <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Customize your focus experience
                    </Text>
                </View>
                <View style={styles.placeholder} />
            </Animated.View>

            <Animated.ScrollView
                style={[styles.scrollView, sectionsAnimatedStyle]}
                showsVerticalScrollIndicator={false}
            >
                <AnimatedSection delay={100}>
                    <SectionHeader title="TIMER SETTINGS" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <View style={styles.timeDurationContainer}>
                            <View style={styles.durationContent}>
                                <Ionicons
                                    name="timer"
                                    size={20}
                                    color={theme.accent}
                                    style={styles.durationIcon}
                                />
                                <Text style={[styles.timeDurationLabel, { color: theme.text }]}>
                                    Focus Duration
                                </Text>
                            </View>
                            <TimeDurationSelector value={timeDuration} onChange={setTimeDuration} />
                        </View>

                        <View style={styles.timeDurationContainer}>
                            <View style={styles.durationContent}>
                                <Ionicons
                                    name="cafe"
                                    size={20}
                                    color={theme.accent}
                                    style={styles.durationIcon}
                                />
                                <Text style={[styles.timeDurationLabel, { color: theme.text }]}>
                                    Break Duration
                                </Text>
                            </View>
                            <TimeDurationSelector
                                value={breakDuration}
                                onChange={setBreakDuration}
                            />
                        </View>
                    </View>
                </AnimatedSection>

                <AnimatedSection delay={200}>
                    <SectionHeader title="APPEARANCE" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Theme Customization"
                            subtitle="Personalize colors and timer style"
                            icon="color-palette-outline"
                            showArrow={true}
                            onPress={handleThemeCustomization}
                        />
                        <SettingItem
                            title="Dark Mode"
                            subtitle="Toggle dark/light theme"
                            icon="moon-outline"
                            hasSwitch={true}
                            switchValue={isDark}
                            onSwitchToggle={handleTheme}
                        />
                    </View>
                </AnimatedSection>

                <AnimatedSection delay={300}>
                    <SectionHeader title="NOTIFICATIONS" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Push Notifications"
                            subtitle="Receive focus reminders and updates"
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
                            disabled={true}
                            title="Weekly Reports"
                            subtitle="Receive weekly productivity summaries"
                            icon="bar-chart-outline"
                            hasSwitch={true}
                            switchValue={weeklyReports}
                            onSwitchToggle={() => toggleSetting('weeklyReports')}
                        />
                    </View>
                </AnimatedSection>

                <AnimatedSection delay={400}>
                    <SectionHeader title="EXPERIENCE" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Sound Effects"
                            subtitle="Play sounds during focus sessions"
                            icon="volume-medium-outline"
                            hasSwitch={true}
                            switchValue={soundEffects}
                            onSwitchToggle={() => toggleSetting('soundEffects')}
                        />
                        <SettingItem
                            title="Show Statistics"
                            subtitle="Show statistics tab in navigation"
                            icon="bar-chart-outline"
                            hasSwitch={true}
                            switchValue={showStatistics}
                            onSwitchToggle={() => toggleSetting('showStatistics')}
                        />
                        {/*<SettingItem*/}
                        {/*    title="Auto Break"*/}
                        {/*    subtitle="Automatically start break sessions"*/}
                        {/*    icon="pause-circle-outline"*/}
                        {/*    hasSwitch={true}*/}
                        {/*    switchValue={autoBreak}*/}
                        {/*    onSwitchToggle={() => toggleSetting('autoBreak')}*/}
                        {/*/>*/}
                    </View>
                </AnimatedSection>

                <AnimatedSection delay={500}>
                    <SectionHeader title="DATA & SYNC" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            disabled={true}
                            title="Cloud Sync"
                            subtitle="Sync your data across devices"
                            icon="cloud-outline"
                            hasSwitch={true}
                            switchValue={dataSync}
                            onSwitchToggle={() => toggleSetting('dataSync')}
                        />
                        <SettingItem
                            title={isExporting ? 'Exporting...' : 'Export Data'}
                            subtitle={`Download ${goals.length} goals, statistics & settings`}
                            icon="download-outline"
                            showArrow={!isExporting}
                            onPress={isExporting ? undefined : handleExportData}
                        />
                        <SettingItem
                            title="Storage Usage"
                            subtitle={
                                isCalculatingStorage
                                    ? 'Calculating...'
                                    : `${storageInfo.formattedSize} used`
                            }
                            icon="folder-outline"
                            value={isCalculatingStorage ? '...' : storageInfo.formattedSize}
                            showArrow={true}
                            onPress={handleStorageDetails}
                        />
                    </View>
                </AnimatedSection>

                <AnimatedSection delay={600}>
                    <SectionHeader title="SUPPORT" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Help & Support"
                            subtitle="Get help with the app"
                            icon="help-circle-outline"
                            showArrow={true}
                            onPress={handleSupport}
                        />
                        <SettingItem
                            title={isCheckingUpdates ? 'Checking for Updates...' : 'Check for Updates'}
                            subtitle={isCheckingUpdates ? 'Please wait...' : 'Check if a new version is available'}
                            icon="refresh-outline"
                            showArrow={!isCheckingUpdates}
                            onPress={isCheckingUpdates ? undefined : handleCheckForUpdates}
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
                </AnimatedSection>

                <AnimatedSection delay={700}>
                    <SectionHeader title="LEGAL" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
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
                </AnimatedSection>

                <AnimatedSection delay={800}>
                    <SectionHeader title="DANGER ZONE" />
                    <View
                        style={[
                            styles.section,
                            styles.dangerSection,
                            { backgroundColor: theme.surface },
                        ]}
                    >
                        <SettingItem
                            title="Delete All Data"
                            subtitle={`Permanently remove ${goals.length} goals and all statistics`}
                            icon="trash-outline"
                            showArrow={true}
                            onPress={handleDeleteData}
                        />
                    </View>
                </AnimatedSection>

                <View style={styles.footer}>
                    <Text style={[styles.versionText, { color: theme.textSecondary }]}>
                        Focus25 {version}
                    </Text>
                    <Text style={[styles.copyrightText, { color: theme.textSecondary }]}>
                        © 2025 Focus25 App
                    </Text>
                </View>
            </Animated.ScrollView>
        </SafeAreaView>
    );
};

// ... (styles remain the same)
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
        opacity: 0.7,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    dangerSection: {
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    timeDurationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    durationContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    durationIcon: {
        marginRight: 12,
    },
    timeDurationLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    versionText: {
        fontSize: 14,
        marginBottom: 4,
    },
    copyrightText: {
        fontSize: 12,
    },
});

export default SettingsScreen;
