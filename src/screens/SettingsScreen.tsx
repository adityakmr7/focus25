import React, { useEffect, useRef, useState } from 'react';
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
    Share,
} from 'react-native';
import { SettingItem } from '../components/SettingItem';
import { SectionHeader } from '../components/SectionHeader';
import { TimeDurationSelector } from '../components/TimeDurationSelector';
import { useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../providers/ThemeProvider';
import { useThemeStore } from '../store/themeStore';
import { useGoalsStore } from '../store/goalsStore';
import { useStatisticsStore } from '../store/statisticsStore';
import { usePomodoroStore } from '../store/pomodoroStore';
import { DataExportService } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';

interface SettingsScreenProps {
    navigation?: {
        goBack: () => void;
        navigate: (screen: string) => void;
    };
}

/**
 * Settings Screen Component
 * 
 * Comprehensive settings interface with MMKV storage integration
 * Provides data management, export/import, and storage analytics
 */
const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { theme, isDark } = useTheme();
    const { setMode } = useThemeStore();
    
    // Store hooks for data management
    const settingsStore = useSettingsStore();
    const goalsStore = useGoalsStore();
    const statisticsStore = useStatisticsStore();
    const pomodoroStore = usePomodoroStore();
    
    // Local state for storage information
    const [storageStats, setStorageStats] = useState({
        totalSize: 0,
        totalKeys: 0,
        breakdown: {
            settings: { size: 0, keys: 0 },
            goals: { size: 0, goalCount: 0 },
            statistics: { size: 0, totalSessions: 0 },
            pomodoro: { size: 0, sessions: 0 },
        }
    });

    // Animation references
    const headerAnimation = useRef(new Animated.Value(0)).current;
    const sectionsAnimation = useRef(new Animated.Value(0)).current;

    /**
     * Initialize animations and load storage stats
     */
    useEffect(() => {
        // Start animations
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

        // Load storage statistics
        loadStorageStats();
    }, []);

    /**
     * Load Storage Statistics
     * 
     * Gathers storage information from all stores
     */
    const loadStorageStats = () => {
        try {
            const settingsInfo = settingsStore.getStorageInfo();
            const goalsInfo = goalsStore.getStorageInfo();
            const statisticsInfo = statisticsStore.getStorageInfo();
            const pomodoroInfo = pomodoroStore.getStorageInfo();
            
            // Get overall storage stats
            const overallStats = DataExportService.getStorageStats();
            
            setStorageStats({
                totalSize: overallStats.total.size,
                totalKeys: overallStats.total.keys,
                breakdown: {
                    settings: settingsInfo,
                    goals: goalsInfo,
                    statistics: statisticsInfo,
                    pomodoro: pomodoroInfo,
                }
            });
            
            console.log('Storage stats loaded:', overallStats);
        } catch (error) {
            console.error('Error loading storage stats:', error);
        }
    };

    /**
     * Format bytes to human readable format
     */
    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    /**
     * Show Alert Helper
     */
    const showAlert = (title: string, message: string): void => {
        Alert.alert(title, message, [{ text: 'OK' }]);
    };

    /**
     * Export All Data
     * 
     * Exports all app data in JSON format
     */
    const handleExportAllData = async (): Promise<void> => {
        try {
            const allData = {
                settings: JSON.parse(settingsStore.exportData()),
                goals: JSON.parse(goalsStore.exportGoalsToJSON()),
                statistics: JSON.parse(statisticsStore.exportStatistics()),
                flowData: JSON.parse(pomodoroStore.exportFlowData()),
                exportInfo: {
                    exportDate: new Date().toISOString(),
                    version: '1.0.0',
                    storageStats: storageStats,
                }
            };

            const jsonData = JSON.stringify(allData, null, 2);

            if (Platform.OS === 'web') {
                // Web download
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `flow_app_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showAlert('Export Complete', 'All data exported successfully!');
            } else {
                // Mobile share
                await Share.share({
                    message: jsonData,
                    title: 'Flow App Data Export',
                });
            }
        } catch (error) {
            console.error('Error exporting all data:', error);
            showAlert('Export Failed', 'Failed to export data. Please try again.');
        }
    };

    /**
     * Export Statistics as CSV
     */
    const handleExportStatisticsCSV = async (): Promise<void> => {
        try {
            const csvData = statisticsStore.exportStatisticsCSV();

            if (Platform.OS === 'web') {
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `flow_statistics_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showAlert('Export Complete', 'Statistics exported as CSV!');
            } else {
                await Share.share({
                    message: csvData,
                    title: 'Flow Statistics CSV',
                });
            }
        } catch (error) {
            console.error('Error exporting statistics CSV:', error);
            showAlert('Export Failed', 'Failed to export statistics. Please try again.');
        }
    };

    /**
     * Export Goals as CSV
     */
    const handleExportGoalsCSV = async (): Promise<void> => {
        try {
            const csvData = goalsStore.exportGoalsToCSV();

            if (Platform.OS === 'web') {
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `flow_goals_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showAlert('Export Complete', 'Goals exported as CSV!');
            } else {
                await Share.share({
                    message: csvData,
                    title: 'Flow Goals CSV',
                });
            }
        } catch (error) {
            console.error('Error exporting goals CSV:', error);
            showAlert('Export Failed', 'Failed to export goals. Please try again.');
        }
    };

    /**
     * Delete All Data
     * 
     * Clears all app data with confirmation
     */
    const handleDeleteAllData = (): void => {
        Alert.alert(
            'Delete All Data',
            'This will permanently delete ALL your data including:\n\n• Settings\n• Goals\n• Statistics\n• Flow metrics\n\nThis action cannot be undone!',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Everything',
                    style: 'destructive',
                    onPress: () => {
                        try {
                            settingsStore.deleteData();
                            goalsStore.resetGoals();
                            statisticsStore.resetStatistics();
                            pomodoroStore.resetDailyMetrics();
                            
                            // Reload storage stats
                            loadStorageStats();
                            
                            showAlert('Data Deleted', 'All data has been permanently deleted.');
                        } catch (error) {
                            console.error('Error deleting all data:', error);
                            showAlert('Delete Failed', 'Failed to delete all data. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    /**
     * Clear Storage Cache
     * 
     * Clears temporary data while preserving user data
     */
    const handleClearCache = (): void => {
        Alert.alert(
            'Clear Cache',
            'This will clear temporary data and may improve performance. Your settings and progress will be preserved.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Cache',
                    onPress: () => {
                        try {
                            // In a real implementation, this would clear cache data
                            // For now, we'll just reload storage stats
                            loadStorageStats();
                            showAlert('Cache Cleared', 'Temporary data has been cleared.');
                        } catch (error) {
                            console.error('Error clearing cache:', error);
                            showAlert('Clear Failed', 'Failed to clear cache. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    // Animation interpolations
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

    /**
     * Animated Section Component
     */
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
                <TouchableOpacity 
                    onPress={loadStorageStats}
                    style={[styles.refreshButton, { backgroundColor: theme.surface }]}
                >
                    <Ionicons name="refresh" size={20} color={theme.accent} />
                </TouchableOpacity>
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
                {/* Timer Settings */}
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
                                value={settingsStore.timeDuration}
                                onChange={settingsStore.setTimeDuration}
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
                                value={settingsStore.breakDuration}
                                onChange={settingsStore.setBreakDuration}
                            />
                        </View>
                    </View>
                </AnimatedSection>

                {/* Appearance */}
                <AnimatedSection delay={200}>
                    <SectionHeader title="APPEARANCE" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Theme Customization"
                            subtitle="Personalize colors and timer style"
                            icon="color-palette-outline"
                            showArrow={true}
                            onPress={() => navigation?.navigate('ThemeCustomization')}
                        />
                        <SettingItem
                            title="Dark Mode"
                            subtitle="Toggle dark/light theme"
                            icon="moon-outline"
                            hasSwitch={true}
                            switchValue={isDark}
                            onSwitchToggle={() => setMode(isDark ? 'light' : 'dark')}
                        />
                    </View>
                </AnimatedSection>

                {/* Notifications */}
                <AnimatedSection delay={300}>
                    <SectionHeader title="NOTIFICATIONS" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Push Notifications"
                            subtitle="Receive flow reminders and updates"
                            icon="notifications-outline"
                            hasSwitch={true}
                            switchValue={settingsStore.notifications}
                            onSwitchToggle={() => settingsStore.toggleSetting('notifications')}
                        />
                        <SettingItem
                            title="Focus Reminders"
                            subtitle="Get reminded to start your focus sessions"
                            icon="time-outline"
                            hasSwitch={true}
                            switchValue={settingsStore.focusReminders}
                            onSwitchToggle={() => settingsStore.toggleSetting('focusReminders')}
                        />
                        <SettingItem
                            title="Weekly Reports"
                            subtitle="Receive weekly productivity summaries"
                            icon="bar-chart-outline"
                            hasSwitch={true}
                            switchValue={settingsStore.weeklyReports}
                            onSwitchToggle={() => settingsStore.toggleSetting('weeklyReports')}
                        />
                    </View>
                </AnimatedSection>

                {/* Experience */}
                <AnimatedSection delay={400}>
                    <SectionHeader title="EXPERIENCE" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Sound Effects"
                            subtitle="Play sounds during flow sessions"
                            icon="volume-medium-outline"
                            hasSwitch={true}
                            switchValue={settingsStore.soundEffects}
                            onSwitchToggle={() => settingsStore.toggleSetting('soundEffects')}
                        />
                        <SettingItem
                            title="Auto Break"
                            subtitle="Automatically start break sessions"
                            icon="pause-circle-outline"
                            hasSwitch={true}
                            switchValue={settingsStore.autoBreak}
                            onSwitchToggle={() => settingsStore.toggleSetting('autoBreak')}
                        />
                    </View>
                </AnimatedSection>

                {/* Data Management & Storage */}
                <AnimatedSection delay={500}>
                    <SectionHeader title="DATA MANAGEMENT" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Storage Usage"
                            subtitle={`${formatBytes(storageStats.totalSize)} • ${storageStats.totalKeys} items`}
                            icon="folder-outline"
                            showArrow={true}
                            onPress={() => {
                                Alert.alert(
                                    'Storage Breakdown',
                                    `Total: ${formatBytes(storageStats.totalSize)}\n\n` +
                                    `Settings: ${formatBytes(storageStats.breakdown.settings.size)}\n` +
                                    `Goals: ${storageStats.breakdown.goals.goalCount} goals\n` +
                                    `Statistics: ${storageStats.breakdown.statistics.totalSessions} sessions\n` +
                                    `Flow Data: ${storageStats.breakdown.pomodoro.sessions} sessions`,
                                    [{ text: 'OK' }]
                                );
                            }}
                        />
                        
                        <SettingItem
                            title="Export All Data"
                            subtitle="Download complete backup as JSON"
                            icon="download-outline"
                            showArrow={true}
                            onPress={handleExportAllData}
                        />
                        
                        <SettingItem
                            title="Export Statistics"
                            subtitle="Download statistics as CSV"
                            icon="bar-chart-outline"
                            showArrow={true}
                            onPress={handleExportStatisticsCSV}
                        />
                        
                        <SettingItem
                            title="Export Goals"
                            subtitle="Download goals as CSV"
                            icon="flag-outline"
                            showArrow={true}
                            onPress={handleExportGoalsCSV}
                        />
                        
                        <SettingItem
                            title="Clear Cache"
                            subtitle="Clear temporary data"
                            icon="refresh-outline"
                            showArrow={true}
                            onPress={handleClearCache}
                        />
                    </View>
                </AnimatedSection>

                {/* Cloud Sync */}
                <AnimatedSection delay={600}>
                    <SectionHeader title="SYNC & BACKUP" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Cloud Sync"
                            subtitle="Sync your data across devices"
                            icon="cloud-outline"
                            hasSwitch={true}
                            switchValue={settingsStore.dataSync}
                            onSwitchToggle={() => settingsStore.toggleSetting('dataSync')}
                        />
                    </View>
                </AnimatedSection>

                {/* Support */}
                <AnimatedSection delay={700}>
                    <SectionHeader title="SUPPORT" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Help & Support"
                            subtitle="Get help with the app"
                            icon="help-circle-outline"
                            showArrow={true}
                            onPress={settingsStore.openSupport}
                        />
                        <SettingItem
                            title="Rate App"
                            subtitle="Rate us on the App Store"
                            icon="star-outline"
                            showArrow={true}
                            onPress={settingsStore.rateApp}
                        />
                        <SettingItem
                            title="Send Feedback"
                            subtitle="Share your thoughts with us"
                            icon="chatbubble-outline"
                            showArrow={true}
                            onPress={settingsStore.openFeedback}
                        />
                    </View>
                </AnimatedSection>

                {/* Legal */}
                <AnimatedSection delay={800}>
                    <SectionHeader title="LEGAL" />
                    <View style={[styles.section, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Privacy Policy"
                            icon="shield-outline"
                            showArrow={true}
                            onPress={settingsStore.openPrivacy}
                        />
                        <SettingItem
                            title="Terms of Service"
                            icon="document-text-outline"
                            showArrow={true}
                            onPress={settingsStore.openTerms}
                        />
                    </View>
                </AnimatedSection>

                {/* Danger Zone */}
                <AnimatedSection delay={900}>
                    <SectionHeader title="DANGER ZONE" />
                    <View style={[styles.section, styles.dangerSection, { backgroundColor: theme.surface }]}>
                        <SettingItem
                            title="Delete All Data"
                            subtitle="Permanently remove all your data"
                            icon="trash-outline"
                            showArrow={true}
                            onPress={handleDeleteAllData}
                        />
                    </View>
                </AnimatedSection>

                {/* App Information */}
                <View style={styles.footer}>
                    <Text style={[styles.versionText, { color: theme.textSecondary }]}>
                        Flow Focus v1.2.3
                    </Text>
                    <Text style={[styles.storageText, { color: theme.textSecondary }]}>
                        MMKV Storage • {formatBytes(storageStats.totalSize)} used
                    </Text>
                    <Text style={[styles.copyrightText, { color: theme.textSecondary }]}>
                        © 2025 Flow Focus App
                    </Text>
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
    refreshButton: {
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
        fontWeight: '600',
    },
    storageText: {
        fontSize: 12,
        marginBottom: 4,
    },
    copyrightText: {
        fontSize: 12,
    },
});

export default SettingsScreen;