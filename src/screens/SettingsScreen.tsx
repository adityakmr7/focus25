import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, SafeAreaView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { SectionHeader } from '../components/SectionHeader';
import { TimeDurationSelector } from '../components/TimeDurationSelector';
// Design System Components
import {
    Container,
    Stack,
    Spacer,
    Card,
    CardHeader,
    CardContent,
    Button,
    SettingItem as DSSettingItem,
} from '../design-system';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeStore } from '../store/themeStore';
import { useTheme } from '../hooks/useTheme';
import { useStatisticsStore } from '../store/statisticsStore';
// Design System Theme
import { useTheme as useDesignSystemTheme, ThemeProvider } from '../design-system/themes';
import { usePomodoroStore } from '../store/pomodoroStore';
import { Ionicons } from '@expo/vector-icons';
import { version } from '../../package.json';
import { updateService } from '../services/updateService';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import { firebaseSyncService, SyncResult } from '../services/firebaseSyncService';
import { onAuthStateChanged, signInWithApple, signInWithGoogle, signOut } from '../config/firebase';
import { canExportData, canUseCloudSync, proFeatureService } from '../services/proFeatureService';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FeatureGate } from '../components/FeatureGate';
import { FEATURES } from '../constants/features';
import { useAuthStore } from '../store/authStore';
import { ProUpgradeBottomSheet } from '../components/ProUpgradeBottomSheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

interface SettingsScreenProps {
    navigation?: {
        goBack: () => void;
        navigate: (screen: string) => void;
    };
}
// Inner component that uses design system theme
const SettingsScreenContent: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { setMode } = useThemeStore();
    const { theme, isDark } = useTheme();
    const { theme: designSystemTheme } = useDesignSystemTheme();
    const { isLandscape, isTablet } = useDeviceOrientation();
    const { isAuthenticated, isPro, user } = useFeatureAccess();
    const { initializeAuth, setUser, updateUserProfile } = useAuthStore();
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
        rateApp,
        openSupport,
        openPrivacy,
        openTerms,
        openFeedback,
        breakDuration,
        setBreakDuration,
    } = useSettingsStore();

    const [hasAnimated, setHasAnimated] = useState(false); // Track if animations have run
    const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showProUpgradeSheet, setShowProUpgradeSheet] = useState(false);
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
    }, []); // Empty dependency array - only run on mount

    // Initialize auth store
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);


    // Memoize handlers
    const showAlert = useCallback((title: string, message: string): void => {
        Alert.alert(title, message, [{ text: 'OK' }]);
    }, []);

  
    
    
    const handleUpdateToPro = () => {
        setShowProUpgradeSheet(true);
    };

    const handleProUpgradeSuccess = () => {
        // Refresh any necessary data after successful upgrade
    };

   

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
                showAlert(
                    "You're Up to Date!",
                    `You have the latest version (${updateInfo.currentVersion}) of the app.`,
                );
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
            showAlert(
                'Update Check Failed',
                'Unable to check for updates. Please try again later.',
            );
        } finally {
            setIsCheckingUpdates(false);
        }
    }, [showAlert]);


    const handleSyncToCloud = useCallback(async (): Promise<void> => {
        if (!user) {
            showAlert(
                'Authentication Required',
                'Please sign in with Google or Apple first to sync your data.',
            );
            return;
        }


        setIsSyncing(true);
        try {
            const result: SyncResult = await firebaseSyncService.syncToFirebase();
            showAlert(result.success ? 'Sync Successful' : 'Sync Failed', result.message);
        } catch (error) {
            console.error('Sync error:', error);
            showAlert('Sync Failed', 'Failed to sync data to cloud. Please try again.');
        } finally {
            setIsSyncing(false);
        }
    }, [user, showAlert]);

    const handleSyncFromCloud = useCallback(async (): Promise<void> => {
        if (!user) {
            showAlert(
                'Authentication Required',
                'Please sign in to restore your data from the cloud.',
            );
            return;
        }

        if (!canUseCloudSync()) {
            const proPrompt = proFeatureService.showProUpgradePrompt('cloud_sync');
            showAlert(proPrompt.title, proPrompt.message);
            return;
        }

        setIsSyncing(true);
        try {
            const result: SyncResult = await firebaseSyncService.syncFromFirebase();
            showAlert(result.success ? 'Restore Successful' : 'Restore Failed', result.message);
        } catch (error) {
            console.error('Sync from cloud error:', error);
            showAlert('Restore Failed', 'Failed to restore data from cloud. Please try again.');
        } finally {
            setIsSyncing(false);
        }
    }, [user, showAlert]);

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

            {/* Pro Status Header */}

            <Animated.ScrollView
                style={[styles.scrollView, sectionsAnimatedStyle]}
                contentContainerStyle={[
                    isTablet && styles.tabletScrollContent,
                    isLandscape && isTablet && styles.tabletLandscapeContent,
                ]}
                showsVerticalScrollIndicator={false}
            >
                <AnimatedSection delay={100}>
                    <SectionHeader title="TIMER SETTINGS" />
                    <Card variant="elevated" padding="md" style={{  marginBottom: 8 }}>
                        <CardContent>
                            <Stack direction="column" gap="md">
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
                            </Stack>
                        </CardContent>
                    </Card>
                </AnimatedSection>

                <AnimatedSection delay={200}>
                    <SectionHeader title="APPEARANCE" />
                    <Card variant="elevated" padding="md" style={{  marginBottom: 8 }}>

                        <CardContent>
                            <Stack direction="column" gap="sm">
                                <DSSettingItem
                                    title="Dark Mode"
                                    subtitle="Toggle dark/light theme"
                                    icon="moon-outline"
                                    hasSwitch={true}
                                    switchValue={isDark}
                                    onSwitchToggle={handleTheme}
                                />
                                
                            </Stack>
                        </CardContent>
                    </Card>
                </AnimatedSection>

                <AnimatedSection delay={300}>
                    <SectionHeader title="NOTIFICATIONS" />
                    <Card variant="elevated" padding="md" style={{  marginBottom: 8 }}>
                        <CardContent>
                            <Stack direction="column" gap="sm">
                                <DSSettingItem
                                    title="Push Notifications"
                                    subtitle="Receive focus reminders and updates"
                                    icon="notifications-outline"
                                    hasSwitch={true}
                                    switchValue={notifications}
                                    onSwitchToggle={() => toggleSetting('notifications')}
                                />
                                <DSSettingItem
                                    title="Focus Reminders"
                                    subtitle="Get reminded to start your focus sessions"
                                    icon="time-outline"
                                    hasSwitch={true}
                                    switchValue={focusReminders}
                                    onSwitchToggle={() => toggleSetting('focusReminders')}
                                />
                                <DSSettingItem
                                    disabled={true}
                                    title="Weekly Reports"
                                    subtitle="Receive weekly productivity summaries"
                                    icon="bar-chart-outline"
                                    hasSwitch={true}
                                    switchValue={weeklyReports}
                                    onSwitchToggle={() => toggleSetting('weeklyReports')}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </AnimatedSection>

                <AnimatedSection delay={400}>
                    <SectionHeader title="EXPERIENCE" />
                    <Card variant="elevated" padding="md" style={{ marginBottom: 8 }}>

                        <CardContent>
                            <Stack direction="column" gap="sm">
                                <DSSettingItem
                                    title="Sound Effects"
                                    subtitle="Play sounds during focus sessions"
                                    icon="volume-medium-outline"
                                    hasSwitch={true}
                                    switchValue={soundEffects}
                                    onSwitchToggle={() => toggleSetting('soundEffects')}
                                />
                                <DSSettingItem
                                    title="Show Statistics"
                                    subtitle="Show statistics tab in navigation"
                                    icon="bar-chart-outline"
                                    hasSwitch={true}
                                    switchValue={showStatistics}
                                    onSwitchToggle={() => toggleSetting('showStatistics')}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </AnimatedSection>

                {/* Pro Features Section */}
                <AnimatedSection delay={500}>
                    <SectionHeader title="PRO FEATURES" />
                    <Card variant="elevated" padding="md" style={{  marginBottom: 8 }}>

                        <CardContent>
                            <Stack direction="column" gap="sm">
                                <FeatureGate 
                                    feature={FEATURES.CLOUD_SYNC}
                                    fallback={
                                        <DSSettingItem
                                            title="Cloud Sync"
                                            subtitle="Sync your data across devices"
                                            icon="cloud-outline"
                                            hasSwitch={true}
                                            switchValue={dataSync}
                                            onSwitchToggle={() => toggleSetting('dataSync')}
                                        />
                                    }
                                >
                                    <DSSettingItem
                                        title={isSyncing ? 'Syncing to Cloud...' : 'Backup to Cloud'}
                                        subtitle={
                                            isSyncing
                                                ? 'Please wait...'
                                                : 'Upload your data to the cloud'
                                        }
                                        icon="cloud-upload-outline"
                                        showArrow={!isSyncing}
                                        onPress={isSyncing ? undefined : handleSyncToCloud}
                                    />
                                    <DSSettingItem
                                        title={isSyncing ? 'Syncing from Cloud...' : 'Restore from Cloud'}
                                        subtitle={
                                            isSyncing
                                                ? 'Please wait...'
                                                : 'Download and restore your data from the cloud'
                                        }
                                        icon="cloud-download-outline"
                                        showArrow={!isSyncing}
                                        onPress={isSyncing ? undefined : handleSyncFromCloud}
                                    />
                                </FeatureGate>

                                {!isPro && (
                                    <DSSettingItem
                                        title="Upgrade to Pro"
                                        subtitle="Unlock all premium features"
                                        icon="diamond-outline"
                                        showArrow={true}
                                        onPress={handleUpdateToPro}
                                    />
                                )}
                            </Stack>
                        </CardContent>
                    </Card>
                </AnimatedSection>

                <AnimatedSection delay={600}>
                    <SectionHeader title="SUPPORT" />
                    <Card variant="elevated" padding="md" style={{ marginBottom: 8 }}>

                        <CardContent>
                            <Stack direction="column" gap="sm">
                                <DSSettingItem
                                    title="Help & Support"
                                    subtitle="Get help with the app"
                                    icon="help-circle-outline"
                                    showArrow={true}
                                    onPress={handleSupport}
                                />
                                <DSSettingItem
                                    title={
                                        isCheckingUpdates ? 'Checking for Updates...' : 'Check for Updates'
                                    }
                                    subtitle={
                                        isCheckingUpdates
                                            ? 'Please wait...'
                                            : 'Check if a new version is available'
                                    }
                                    icon="refresh-outline"
                                    showArrow={!isCheckingUpdates}
                                    onPress={isCheckingUpdates ? undefined : handleCheckForUpdates}
                                />
                                <DSSettingItem
                                    title="Rate App"
                                    subtitle="Rate us on the App Store"
                                    icon="star-outline"
                                    showArrow={true}
                                    onPress={handleRateApp}
                                />
                                <DSSettingItem
                                    title="Send Feedback"
                                    subtitle="Share your thoughts with us"
                                    icon="chatbubble-outline"
                                    showArrow={true}
                                    onPress={handleFeedback}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </AnimatedSection>

                <AnimatedSection delay={700}>
                    <SectionHeader title="LEGAL" />
                    <Card variant="elevated" padding="md" style={{  marginBottom: 8 }}>
                        <CardContent>
                            <Stack direction="column" gap="sm">
                                <DSSettingItem
                                    title="Privacy Policy"
                                    icon="shield-outline"
                                    showArrow={true}
                                    onPress={handlePrivacy}
                                />
                                <DSSettingItem
                                    title="Terms of Service"
                                    icon="document-text-outline"
                                    showArrow={true}
                                    onPress={handleTerms}
                                />
                            </Stack>
                        </CardContent>
                    </Card>
                </AnimatedSection>



                <Container padding="lg" center>
                    <Stack direction="column" gap="xs" align="center">
                        <Text style={[styles.versionText, { color: theme.textSecondary }]}>
                            Focus25 {version}
                        </Text>
                        <Text style={[styles.copyrightText, { color: theme.textSecondary }]}>
                            © 2025 Focus25 App
                        </Text>
                    </Stack>
                </Container>
            </Animated.ScrollView>
            
            {/* Pro Upgrade Bottom Sheet */}
            <ProUpgradeBottomSheet
                visible={showProUpgradeSheet}
                onClose={() => setShowProUpgradeSheet(false)}
                onSuccess={handleProUpgradeSuccess}
            />
        </SafeAreaView>
    );
};

// Main SettingsScreen component that provides theme context
const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    
    return (
        <ThemeProvider initialMode={isDark ? 'dark' : 'light'}>
            <BottomSheetModalProvider>
                <SettingsScreenContent navigation={navigation} />
            </BottomSheetModalProvider>
        </ThemeProvider>
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
    tabletScrollContent: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 40,
    },
    tabletLandscapeContent: {
        maxWidth: 800,
        paddingHorizontal: 60,
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
    button: {
        width: 200,
        height: 44,
    },
    proStatusContainer: {
        alignItems: 'center',
    },
    proStatusText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    proStatusSubtext: {
        fontSize: 14,
        marginTop: 2,
        textAlign: 'center',
    },
    appleSignInContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    appleButton: {
        width: '100%',
        height: 44,
    },
});

export default SettingsScreen;
