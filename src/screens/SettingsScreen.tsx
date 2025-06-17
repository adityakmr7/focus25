import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
    Animated,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { SettingItem } from '../components/SettingItem';
import { SectionHeader } from '../components/SectionHeader';
import { TimeDurationSelector } from '../components/TimeDurationSelector';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../providers/ThemeProvider';
import { useThemeStore } from '../store/themeStore';
import { Ionicons } from '@expo/vector-icons';

interface SettingsScreenProps {
    navigation?: {
        goBack: () => void;
        navigate: (screen: string) => void;
    };
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { setMode } = useThemeStore();
    const {
        timeDuration,
        soundEffects,
        notifications,
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
        openStorage,
        openFeedback,
        breakDuration,
        setBreakDuration
    } = useSettingsStore();

    const headerAnimation = useRef(new Animated.Value(0)).current;
    const sectionsAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(200, [
            Animated.timing(headerAnimation, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(sectionsAnimation, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

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
        setMode(isDark ? 'light' : 'dark');
    };

    const handleStorage = (): void => {
        openStorage();
        showAlert('Storage', 'Storage details coming soon!');
    };

    const handleFeedback = (): void => {
        openFeedback();
        showAlert('Feedback', 'Opening feedback form...');
    };

    const handleThemeCustomization = (): void => {
        if (navigation) {
            navigation.navigate('ThemeCustomization');
        } else {
            showAlert('Navigation Error', 'Theme customization is not available.');
        }
    };

    const headerOpacity = headerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const headerTranslateY = headerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-30, 0],
    });

    const sectionsOpacity = sectionsAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const sectionsTranslateY = sectionsAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [20, 0],
    });

    const AnimatedSection: React.FC<{ 
        children: React.ReactNode; 
        delay?: number;
    }> = ({ children, delay = 0 }) => {
        const sectionAnimation = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.timing(sectionAnimation, {
                toValue: 1,
                duration: 600,
                delay,
                useNativeDriver: true,
            }).start();
        }, []);

        const opacity = sectionAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
        });

        const translateY = sectionAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
        });

        return (
            <Animated.View
                style={{
                    opacity,
                    transform: [{ translateY }],
                }}
            >
                {children}
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Enhanced Header */}
            <Animated.View
                style={[
                    styles.header,
                    { borderBottomColor: theme.surface },
                    {
                        opacity: headerOpacity,
                        transform: [{ translateY: headerTranslateY }],
                    },
                ]}
            >
                <TouchableOpacity 
                    onPress={() => navigation?.goBack()}
                    style={[styles.backButton, { backgroundColor: theme.surface }]}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        Settings
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Customize your flow experience
                    </Text>
                </View>
                <View style={styles.placeholder} />
            </Animated.View>

            <Animated.ScrollView
                style={[
                    styles.scrollView,
                    {
                        opacity: sectionsOpacity,
                        transform: [{ translateY: sectionsTranslateY }],
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <AnimatedSection delay={100}>
                    <SectionHeader title="TIMER SETTINGS" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <View style={styles.timeDurationContainer}>
                            <View style={styles.durationContent}>
                                <Ionicons name="timer" size={20} color={theme.accent} style={styles.durationIcon} />
                                <Text style={[styles.timeDurationLabel, { color: theme.text }]}>
                                    Focus Duration
                                </Text>
                            </View>
                            <TimeDurationSelector
                                value={timeDuration}
                                onChange={setTimeDuration}
                            />
                        </View>

                        <View style={styles.timeDurationContainer}>
                            <View style={styles.durationContent}>
                                <Ionicons name="cafe" size={20} color={theme.accent} style={styles.durationIcon} />
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
                </AnimatedSection>

                <AnimatedSection delay={400}>
                    <SectionHeader title="EXPERIENCE" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Sound Effects"
                            subtitle="Play sounds during flow sessions"
                            icon="volume-medium-outline"
                            hasSwitch={true}
                            switchValue={soundEffects}
                            onSwitchToggle={() => toggleSetting('soundEffects')}
                        />
                        <SettingItem
                            title="Auto Break"
                            subtitle="Automatically start break sessions"
                            icon="pause-circle-outline"
                            hasSwitch={true}
                            switchValue={autoBreak}
                            onSwitchToggle={() => toggleSetting('autoBreak')}
                        />
                    </View>
                </AnimatedSection>

                <AnimatedSection delay={500}>
                    <SectionHeader title="DATA & SYNC" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
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
                    <View style={[styles.section, styles.dangerSection, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Delete All Data"
                            subtitle="Permanently remove all your flow data"
                            icon="trash-outline"
                            showArrow={true}
                            onPress={handleDeleteData}
                        />
                    </View>
                </AnimatedSection>

                <View style={styles.footer}>
                    <Text style={[styles.versionText, { color: theme.textSecondary }]}>Flow Focus v1.2.3</Text>
                    <Text style={[styles.copyrightText, { color: theme.textSecondary }]}>© 2025 Flow Focus App</Text>
                </View>
            </Animated.ScrollView>
        </SafeAreaView>
    );
};

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
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
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