import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import StatisticsChart from '../components/StatisticsChart';
import { useStatisticsStore } from '../store/statisticsStore';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useGoalsStore } from '../store/goalsStore';
import { FlowMetrics } from '../components/FlowMetrics';
import { GoalsModal } from '../components/GoalsModal';
import { useThemeStore } from '../store/themeStore';
import { useColorScheme } from 'react-native';
import { hybridDatabaseService } from '../data/hybridDatabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface StatisticsScreenProps {
    navigation?: {
        navigate: (screen: string) => void;
    };
}

interface FlowStats {
    started: number;
    completed: number;
    minutes: number;
}

interface BreakStats {
    started: number;
    completed: number;
    minutes: number;
}

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    gradient: string[];
    trend?: number;
    delay?: number;
    onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    gradient,
    trend,
    delay = 0,
    onPress,
}) => {
    const { mode, getCurrentTheme } = useThemeStore();
    const systemColorScheme = useColorScheme();
    const theme = getCurrentTheme();
    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';
    const animatedValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 800,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(scaleValue, {
                toValue: 1,
                delay,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }),
        ]).start();
    }, []);

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0],
    });

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Animated.View
            style={[
                styles.statCard,
                {
                    transform: [{ translateY }, { scale: scaleValue }],
                    opacity,
                },
            ]}
        >
            <TouchableOpacity
                onPress={onPress}
                style={[styles.cardContent, { backgroundColor: theme.surface }]}
                activeOpacity={onPress ? 0.7 : 1}
            >
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: gradient[0] + '20' }]}>
                        <Icon name={icon} size={24} color={gradient[0]} />
                    </View>
                    {trend !== undefined && (
                        <View
                            style={[
                                styles.trendContainer,
                                { backgroundColor: trend >= 0 ? '#10B98120' : '#EF444420' },
                            ]}
                        >
                            <Icon
                                name={trend >= 0 ? 'trending-up' : 'trending-down'}
                                size={16}
                                color={trend >= 0 ? '#10B981' : '#EF4444'}
                            />
                            <Text
                                style={[
                                    styles.trendText,
                                    { color: trend >= 0 ? '#10B981' : '#EF4444' },
                                ]}
                            >
                                {Math.abs(trend)}%
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={[styles.cardValue, { color: theme.text }]}>{value}</Text>
                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                        {subtitle}
                    </Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const ActionButton: React.FC<{
    icon: string;
    label: string;
    onPress: () => void;
    gradient: string[];
    delay?: number;
}> = ({ icon, label, onPress, gradient, delay = 0 }) => {
    const { mode, getCurrentTheme } = useThemeStore();
    const systemColorScheme = useColorScheme();
    const theme = getCurrentTheme();
    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';
    const animatedValue = useRef(new Animated.Value(0)).current;
    const scaleValue = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 600,
                delay,
                useNativeDriver: true,
            }),
            Animated.spring(scaleValue, {
                toValue: 1,
                delay,
                useNativeDriver: true,
                tension: 120,
                friction: 7,
            }),
        ]).start();
    }, []);

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0],
    });

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    return (
        <Animated.View
            style={[
                {
                    transform: [{ translateY }, { scale: scaleValue }],
                    opacity,
                },
            ]}
        >
            <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.surface }]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={[styles.actionIconContainer, { backgroundColor: gradient[0] }]}>
                    <Icon name={icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.actionButtonText, { color: theme.text }]}>{label}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
    const { mode, getCurrentTheme } = useThemeStore();
    const systemColorScheme = useColorScheme();
    const theme = getCurrentTheme();
    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';
    const {
        selectedPeriod,
        currentDate,
        loadStatistics,
        totalCount,
        flows,
        breaks,
        interruptions,
        isLoading,
        syncWithDatabase,
        initializeStore: initializeStatistics,
    } = useStatisticsStore();

    const { flowMetrics, initializeStore: initializePomodoro } = usePomodoroStore();

    const {
        goals,
        getActiveGoals,
        updateGoalsFromStats,
        initializeStore: initializeGoals,
    } = useGoalsStore();

    const [showGoalsModal, setShowGoalsModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
    const headerAnimatedValue = useRef(new Animated.Value(0)).current;

    // Update hybrid database service with auth state
    // useEffect(() => {
    //     hybridDatabaseService.setAuthState(isAuthenticated, user?.id);
    // }, [isAuthenticated, user?.id]);

    useEffect(() => {
        Animated.timing(headerAnimatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    // Initialize stores when component mounts
    useEffect(() => {
        const initializeStores = async () => {
            try {
                await Promise.all([
                    initializeStatistics(),
                    initializePomodoro(),
                    initializeGoals(),
                ]);
            } catch (error) {
                console.error('Failed to initialize stores:', error);
            }
        };

        initializeStores();
    }, []);

    // Auto-refresh data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadStatistics();
            setLastUpdateTime(new Date());
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Update goals based on current statistics
    useEffect(() => {
        const stats = {
            dailySessions: flows.completed,
            dailyFocusTime: flows.minutes,
            currentStreak: flowMetrics.currentStreak,
            weeklyConsistency: flows.completed > 0 ? Math.min(85 + flows.completed * 5, 100) : 0,
        };

        updateGoalsFromStats(stats);
    }, [flows, flowMetrics]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([loadStatistics(), syncWithDatabase()]);
            setLastUpdateTime(new Date());
        } catch (error) {
            console.error('Failed to refresh data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleSyncData = async () => {
        try {
            await hybridDatabaseService.syncToSupabase();
            setLastUpdateTime(new Date());
        } catch (error) {
            console.error('Failed to sync data:', error);
        }
    };

    const headerOpacity = headerAnimatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const headerTranslateY = headerAnimatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-30, 0],
    });

    const activeGoals = getActiveGoals();
    const recentGoals = activeGoals.slice(0, 3);

    // Calculate dynamic trends based on historical data
    const calculateTrend = (current: number, category: string) => {
        // Mock calculation - in real app, compare with previous period
        const baseValue = category === 'flows' ? 10 : category === 'time' ? 120 : 5;
        const difference = ((current - baseValue) / baseValue) * 100;
        return Math.round(Math.max(-50, Math.min(50, difference)));
    };

    // Calculate completion rate
    const completionRate =
        flows.started > 0 ? Math.round((flows.completed / flows.started) * 100) : 0;

    // Calculate average session length
    const averageSessionLength =
        flows.completed > 0 ? Math.round(flows.minutes / flows.completed) : 0;

    // Calculate focus efficiency (sessions completed vs interruptions)
    const focusEfficiency = flows.completed > 0 ? Math.max(0, 100 - interruptions * 10) : 100;

    const statsData = [
        {
            title: 'Total Sessions',
            value: flows.completed,
            subtitle: `${flows.started} started • ${completionRate}% completed`,
            icon: 'local-fire-department',
            gradient: ['#FF6B6B', '#FF8E8E'],
            trend: calculateTrend(flows.completed, 'flows'),
            onPress: () => navigation?.navigate('FlowAnalytics'),
        },
        {
            title: 'Focus Time',
            value:
                flows.minutes > 60
                    ? `${Math.floor(flows.minutes / 60)}h ${flows.minutes % 60}m`
                    : `${flows.minutes}m`,
            subtitle:
                averageSessionLength > 0
                    ? `Avg: ${averageSessionLength}m per session`
                    : 'No sessions yet',
            icon: 'schedule',
            gradient: ['#4ECDC4', '#44A08D'],
            trend: calculateTrend(flows.minutes, 'time'),
        },
        {
            title: 'Breaks Taken',
            value: breaks.completed,
            subtitle:
                breaks.minutes > 0
                    ? `${Math.floor(breaks.minutes / 60)}h ${breaks.minutes % 60}m total`
                    : 'No breaks yet',
            icon: 'coffee',
            gradient: ['#45B7D1', '#96C93D'],
            trend: calculateTrend(breaks.completed, 'breaks'),
        },
        {
            title: 'Focus Score',
            value: `${focusEfficiency}%`,
            subtitle:
                interruptions > 0
                    ? `${interruptions} interruption${interruptions !== 1 ? 's' : ''} today`
                    : 'Perfect focus!',
            icon: interruptions === 0 ? 'psychology' : 'notifications-off',
            gradient: focusEfficiency >= 80 ? ['#10B981', '#34D399'] : ['#F093FB', '#F5576C'],
            trend: interruptions === 0 ? 15 : -Math.min(interruptions * 5, 30),
        },
    ];

    const getGoalProgress = (goal: any) => {
        return Math.min((goal.current / goal.target) * 100, 100);
    };

    const getGoalColor = (category: string) => {
        switch (category) {
            case 'sessions':
                return '#FF6B6B';
            case 'focus_time':
                return '#4ECDC4';
            case 'streak':
                return '#FFD93D';
            case 'consistency':
                return '#9F7AEA';
            default:
                return '#6B7280';
        }
    };

    const formatLastUpdate = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.accent}
                        colors={[theme.accent]}
                    />
                }
            >
                {/* Animated Header */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: headerOpacity,
                            transform: [{ translateY: headerTranslateY }],
                        },
                    ]}
                >
                    <View style={styles.headerContent}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Statistics</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                            Track your productivity journey
                        </Text>
                    </View>
                    <View style={styles.headerStats}>
                        <Text style={[styles.lastUpdate, { color: theme.textSecondary }]}>
                            Updated {formatLastUpdate(lastUpdateTime)}
                        </Text>

                        <View style={styles.syncStatus}>
                            <Ionicons name="cloud-offline" size={16} color="#F59E0B" />
                            <Text style={[styles.syncText, { color: '#F59E0B' }]}>Local Only</Text>
                        </View>
                        <View style={styles.todayStats}>
                            <Text style={[styles.todayValue, { color: theme.text }]}>
                                {flows.completed}
                            </Text>
                            <Text style={[styles.todayLabel, { color: theme.textSecondary }]}>
                                Today
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Enhanced Chart with Animation */}
                <View style={styles.chartSection}>
                    <StatisticsChart />
                </View>

                {/* Real-time Statistics Cards Grid */}
                <View style={styles.statsGrid}>
                    {statsData.map((stat, index) => (
                        <StatCard
                            key={stat.title}
                            title={stat.title}
                            value={stat.value}
                            subtitle={stat.subtitle}
                            icon={stat.icon}
                            gradient={stat.gradient}
                            trend={stat.trend}
                            delay={index * 100 + 200}
                            onPress={stat.onPress}
                        />
                    ))}
                </View>

                {/* Goals Overview Section */}
                <View style={styles.goalsSection}>
                    <Animated.View
                        style={[
                            styles.sectionHeader,
                            {
                                opacity: headerOpacity,
                                transform: [{ translateY: headerTranslateY }],
                            },
                        ]}
                    >
                        <View style={styles.sectionTitleContainer}>
                            <Icon name="flag" size={24} color={theme.accent} />
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Active Goals ({activeGoals.length})
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.viewAllButton, { backgroundColor: theme.accent + '20' }]}
                            onPress={() => setShowGoalsModal(true)}
                        >
                            <Text style={[styles.viewAllText, { color: theme.accent }]}>
                                {activeGoals.length > 3
                                    ? `View All ${activeGoals.length}`
                                    : 'Manage'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {recentGoals.length > 0 ? (
                        <View style={styles.goalsGrid}>
                            {recentGoals.map((goal, index) => (
                                <Animated.View
                                    key={goal.id}
                                    style={[
                                        styles.goalCard,
                                        { backgroundColor: theme.surface },
                                        {
                                            opacity: headerOpacity,
                                            transform: [{ translateY: headerTranslateY }],
                                        },
                                    ]}
                                >
                                    <View style={styles.goalHeader}>
                                        <View
                                            style={[
                                                styles.goalIcon,
                                                {
                                                    backgroundColor:
                                                        getGoalColor(goal.category) + '20',
                                                },
                                            ]}
                                        >
                                            <Icon
                                                name={
                                                    goal.category === 'sessions'
                                                        ? 'timer'
                                                        : goal.category === 'focus_time'
                                                          ? 'schedule'
                                                          : goal.category === 'streak'
                                                            ? 'local-fire-department'
                                                            : 'calendar-today'
                                                }
                                                size={16}
                                                color={getGoalColor(goal.category)}
                                            />
                                        </View>
                                        <Text style={[styles.goalTitle, { color: theme.text }]}>
                                            {goal.title}
                                        </Text>
                                        {goal.isCompleted && (
                                            <Icon name="check-circle" size={16} color="#10B981" />
                                        )}
                                    </View>

                                    <View style={styles.goalProgress}>
                                        <Text
                                            style={[
                                                styles.goalProgressText,
                                                { color: theme.textSecondary },
                                            ]}
                                        >
                                            {goal.current} / {goal.target} {goal.unit}
                                        </Text>
                                        <View
                                            style={[
                                                styles.goalProgressBar,
                                                { backgroundColor: '#E5E7EB' },
                                            ]}
                                        >
                                            <View
                                                style={[
                                                    styles.goalProgressFill,
                                                    {
                                                        width: `${getGoalProgress(goal)}%`,
                                                        backgroundColor: goal.isCompleted
                                                            ? '#10B981'
                                                            : getGoalColor(goal.category),
                                                    },
                                                ]}
                                            />
                                        </View>
                                        <Text
                                            style={[
                                                styles.goalPercentage,
                                                { color: theme.textSecondary },
                                            ]}
                                        >
                                            {Math.round(getGoalProgress(goal))}% complete
                                        </Text>
                                    </View>
                                </Animated.View>
                            ))}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.emptyGoalsCard, { backgroundColor: theme.surface }]}
                            onPress={() => setShowGoalsModal(true)}
                        >
                            <Icon name="flag-outline" size={32} color={theme.accent} />
                            <Text style={[styles.emptyGoalsTitle, { color: theme.text }]}>
                                Set Your First Goal
                            </Text>
                            <Text
                                style={[styles.emptyGoalsSubtitle, { color: theme.textSecondary }]}
                            >
                                Track your progress and stay motivated
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                    <ActionButton
                        icon="flag"
                        label="Manage Goals"
                        onPress={() => setShowGoalsModal(true)}
                        gradient={['#9F7AEA', '#C084FC']}
                        delay={400}
                    />
                </View>

                {/* Flow Metrics Section */}
                <View style={styles.flowMetricsSection}>
                    <Animated.View
                        style={[
                            styles.sectionHeader,
                            {
                                opacity: headerOpacity,
                                transform: [{ translateY: headerTranslateY }],
                            },
                        ]}
                    >
                        <View style={styles.sectionTitleContainer}>
                            <Icon name="psychology" size={24} color="#4ECDC4" />
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                Flow State Analysis
                            </Text>
                        </View>
                        <View style={styles.flowIntensityBadge}>
                            <Text
                                style={[
                                    styles.flowIntensityText,
                                    {
                                        color:
                                            flowMetrics.flowIntensity === 'high'
                                                ? '#10B981'
                                                : flowMetrics.flowIntensity === 'medium'
                                                  ? '#F59E0B'
                                                  : '#EF4444',
                                    },
                                ]}
                            >
                                {flowMetrics.flowIntensity.toUpperCase()}
                            </Text>
                        </View>
                    </Animated.View>
                    <FlowMetrics showDetailed={false} />
                </View>

                {/*/!* Quick Insights *!/*/}
                {/*<View style={styles.insightsSection}>*/}
                {/*  <Animated.View*/}
                {/*    style={[*/}
                {/*      styles.sectionHeader,*/}
                {/*      {*/}
                {/*        opacity: headerOpacity,*/}
                {/*        transform: [{ translateY: headerTranslateY }],*/}
                {/*      },*/}
                {/*    ]}*/}
                {/*  >*/}
                {/*    <View style={styles.sectionTitleContainer}>*/}
                {/*      <Icon name="lightbulb" size={24} color="#FFD93D" />*/}
                {/*      <Text style={[styles.sectionTitle, { color: theme.text }]}>*/}
                {/*        Quick Insights*/}
                {/*      </Text>*/}
                {/*    </View>*/}
                {/*  </Animated.View>*/}

                {/*  <View style={styles.insightsGrid}>*/}
                {/*    <View style={[styles.insightCard, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>*/}
                {/*      <Icon name="trending-up" size={20} color="#10B981" />*/}
                {/*      <Text style={[styles.insightTitle, { color: theme.text }]}>*/}
                {/*        Best Time*/}
                {/*      </Text>*/}
                {/*      <Text style={[styles.insightValue, { color: theme.textSecondary }]}>*/}
                {/*        {flows.completed > 0 ? '2:00 PM' : 'Not enough data'}*/}
                {/*      </Text>*/}
                {/*    </View>*/}

                {/*    <View style={[styles.insightCard, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>*/}
                {/*      <Icon name="speed" size={20} color="#4ECDC4" />*/}
                {/*      <Text style={[styles.insightTitle, { color: theme.text }]}>*/}
                {/*        Streak*/}
                {/*      </Text>*/}
                {/*      <Text style={[styles.insightValue, { color: theme.textSecondary }]}>*/}
                {/*        {flowMetrics.currentStreak} days*/}
                {/*      </Text>*/}
                {/*    </View>*/}

                {/*    <View style={[styles.insightCard, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>*/}
                {/*      <Icon name="emoji-events" size={20} color="#FFD93D" />*/}
                {/*      <Text style={[styles.insightTitle, { color: theme.text }]}>*/}
                {/*        This Week*/}
                {/*      </Text>*/}
                {/*      <Text style={[styles.insightValue, { color: theme.textSecondary }]}>*/}
                {/*        {flows.completed * 7} sessions*/}
                {/*      </Text>*/}
                {/*    </View>*/}
                {/*  </View>*/}
                {/*</View>*/}

                {/* Bottom Spacing */}
                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Goals Modal */}
            <GoalsModal visible={showGoalsModal} onClose={() => setShowGoalsModal(false)} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
        opacity: 0.7,
    },
    headerStats: {
        alignItems: 'flex-end',
    },
    lastUpdate: {
        fontSize: 12,
        marginBottom: 4,
    },
    syncStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 8,
    },
    syncText: {
        fontSize: 12,
        fontWeight: '600',
    },
    todayStats: {
        alignItems: 'center',
    },
    todayValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    todayLabel: {
        fontSize: 12,
        opacity: 0.7,
    },
    chartSection: {
        marginTop: 10,
    },
    goalsSection: {
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    viewAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '600',
    },
    goalsGrid: {
        gap: 12,
    },
    goalCard: {
        padding: 16,
        borderRadius: 16,
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
    goalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    goalIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    goalTitle: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    goalProgress: {
        gap: 6,
    },
    goalProgressText: {
        fontSize: 12,
        fontWeight: '500',
    },
    goalProgressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    goalProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    goalPercentage: {
        fontSize: 11,
        fontWeight: '500',
    },
    emptyGoalsCard: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
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
    emptyGoalsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 12,
        marginBottom: 4,
    },
    emptyGoalsSubtitle: {
        fontSize: 14,
        textAlign: 'center',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 30,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        height: 80,
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
    actionIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    statsGrid: {
        paddingHorizontal: 24,
        gap: 16,
    },
    statCard: {
        marginBottom: 16,
    },
    cardContent: {
        padding: 20,
        borderRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardValue: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        opacity: 0.7,
    },
    flowMetricsSection: {
        marginTop: 30,
        paddingHorizontal: 24,
    },
    flowIntensityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    flowIntensityText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    insightsSection: {
        marginTop: 30,
        paddingHorizontal: 24,
    },
    insightsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    insightCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    insightTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 4,
    },
    insightValue: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    bottomSpacing: {
        height: 40,
    },
});

export default StatisticsScreen;
