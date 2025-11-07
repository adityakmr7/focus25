import TypographyText from '@/components/TypographyText';
import { useStatisticsStore } from '@/stores/statistics-store';
import {
    statisticsService,
    DailyStats,
    WeeklyStats,
    MonthlyStats,
} from '@/services/statistics-service';
import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { HStack, VStack, SPACING, useTheme } from 'react-native-heroui';
import { SafeAreaView } from 'react-native-safe-area-context';

type TimePeriod = 'today' | 'week' | 'month';

export default function StatisticsScreen() {
    const { theme } = useTheme();
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
    const [refreshing, setRefreshing] = useState(false);

    const {
        overallStats,
        weeklyStats,
        monthlyStats,
        dailyStats,
        categoryStats,
        isLoading,
        loadWeeklyStats,
        loadMonthlyStats,
        loadOverallStats,
        loadCategoryStats,
        loadDailyStats,
        refreshAll,
    } = useStatisticsStore();

    // Load initial data
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timePeriod]);

    const loadData = async () => {
        const endDate = new Date();
        const startDate = new Date();

        switch (timePeriod) {
            case 'today':
                startDate.setDate(startDate.getDate());
                await loadDailyStats(startDate, endDate);
                break;
            case 'week':
                await loadWeeklyStats(1);
                break;
            case 'month':
                await loadMonthlyStats(1);
                break;
        }

        await Promise.all([loadOverallStats(), loadCategoryStats()]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshAll();
        } finally {
            setRefreshing(false);
        }
    };

    const formatDuration = (seconds: number): string => {
        return statisticsService.formatDuration(seconds);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const StatCard = ({
        title,
        value,
        subtitle,
    }: {
        title: string;
        value: string | number;
        subtitle?: string;
    }) => (
        <View
            style={[
                styles.statCard,
                {
                    backgroundColor: theme.colors.content1,
                    borderColor: theme.colors.background,
                },
            ]}
        >
            <TypographyText
                variant="body"
                size="sm"
                style={[styles.statTitle, { color: theme.colors.foreground }]}
            >
                {title}
            </TypographyText>
            <TypographyText
                variant="heading"
                size="lg"
                style={[styles.statValue, { color: theme.colors.foreground }]}
            >
                {value}
            </TypographyText>
            {subtitle && (
                <TypographyText
                    variant="caption"
                    style={[styles.statSubtitle, { color: theme.colors.foreground }]}
                >
                    {subtitle}
                </TypographyText>
            )}
        </View>
    );

    const currentPeriodStats =
        timePeriod === 'week'
            ? weeklyStats.length > 0
                ? weeklyStats[weeklyStats.length - 1]
                : null
            : timePeriod === 'month'
              ? monthlyStats.length > 0
                  ? monthlyStats[monthlyStats.length - 1]
                  : null
              : dailyStats.length > 0
                ? dailyStats[dailyStats.length - 1]
                : null;

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.colors.background || '#FFFFFF' }]}
        >
            {/* Header */}
            <HStack alignItems="center" justifyContent="center" px="md" py="sm">
                <TypographyText variant="title" color="default">
                    Statistics
                </TypographyText>
            </HStack>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <VStack px="md" gap="lg">
                    {/* Period Selector */}
                    <HStack gap="sm" justifyContent="center">
                        {(['today', 'week', 'month'] as TimePeriod[]).map((period) => (
                            <TouchableOpacity
                                key={period}
                                style={[
                                    styles.periodButton,
                                    {
                                        backgroundColor:
                                            timePeriod === period
                                                ? theme.colors.primary
                                                : theme.colors.content1,
                                    },
                                ]}
                                onPress={() => setTimePeriod(period)}
                            >
                                <TypographyText
                                    variant="body"
                                    size="sm"
                                    style={{
                                        color:
                                            timePeriod === period
                                                ? '#FFFFFF'
                                                : theme.colors.foreground,
                                        textTransform: 'capitalize',
                                        fontWeight: timePeriod === period ? '600' : '400',
                                    }}
                                >
                                    {period}
                                </TypographyText>
                            </TouchableOpacity>
                        ))}
                    </HStack>

                    {/* Overall Stats */}
                    {overallStats && (
                        <VStack gap="md">
                            <TypographyText variant="heading" size="md" color="default">
                                Overall
                            </TypographyText>
                            <View style={styles.statsGrid}>
                                <StatCard
                                    title="Total Focus Time"
                                    value={formatDuration(overallStats.totalFocusTime)}
                                    subtitle="All time"
                                />
                                <StatCard
                                    title="Total Sessions"
                                    value={overallStats.totalSessions}
                                    subtitle="Completed"
                                />
                                <StatCard
                                    title="Todos Completed"
                                    value={overallStats.completedTodos}
                                    subtitle={`of ${overallStats.totalTodos}`}
                                />
                                <StatCard
                                    title="Longest Streak"
                                    value={`${overallStats.longestStreak} days`}
                                    subtitle="Focus days in a row"
                                />
                            </View>
                        </VStack>
                    )}

                    {/* Current Period Stats */}
                    {currentPeriodStats && (
                        <VStack gap="md">
                            <TypographyText variant="heading" size="md" color="default">
                                {timePeriod === 'today'
                                    ? 'Today'
                                    : timePeriod === 'week'
                                      ? 'This Week'
                                      : 'This Month'}
                            </TypographyText>
                            <View style={styles.statsGrid}>
                                {timePeriod === 'today' && (
                                    <>
                                        <StatCard
                                            title="Focus Time"
                                            value={formatDuration(
                                                (currentPeriodStats as DailyStats).totalFocusTime,
                                            )}
                                        />
                                        <StatCard
                                            title="Sessions"
                                            value={(currentPeriodStats as DailyStats).focusSessions}
                                        />
                                        <StatCard
                                            title="Todos Completed"
                                            value={
                                                (currentPeriodStats as DailyStats).completedTodos
                                            }
                                        />
                                    </>
                                )}
                                {timePeriod === 'week' && (
                                    <>
                                        <StatCard
                                            title="Focus Time"
                                            value={formatDuration(
                                                (currentPeriodStats as WeeklyStats).totalFocusTime,
                                            )}
                                        />
                                        <StatCard
                                            title="Sessions"
                                            value={
                                                (currentPeriodStats as WeeklyStats).totalSessions
                                            }
                                        />
                                        {(currentPeriodStats as WeeklyStats)
                                            .averageSessionDuration > 0 && (
                                            <StatCard
                                                title="Avg Session"
                                                value={formatDuration(
                                                    (currentPeriodStats as WeeklyStats)
                                                        .averageSessionDuration,
                                                )}
                                            />
                                        )}
                                        <StatCard
                                            title="Todos Completed"
                                            value={
                                                (currentPeriodStats as WeeklyStats).completedTodos
                                            }
                                        />
                                    </>
                                )}
                                {timePeriod === 'month' && (
                                    <>
                                        <StatCard
                                            title="Focus Time"
                                            value={formatDuration(
                                                (currentPeriodStats as MonthlyStats).totalFocusTime,
                                            )}
                                        />
                                        <StatCard
                                            title="Sessions"
                                            value={
                                                (currentPeriodStats as MonthlyStats).totalSessions
                                            }
                                        />
                                        {(currentPeriodStats as MonthlyStats)
                                            .averageSessionDuration > 0 && (
                                            <StatCard
                                                title="Avg Session"
                                                value={formatDuration(
                                                    (currentPeriodStats as MonthlyStats)
                                                        .averageSessionDuration,
                                                )}
                                            />
                                        )}
                                        <StatCard
                                            title="Todos Completed"
                                            value={
                                                (currentPeriodStats as MonthlyStats).completedTodos
                                            }
                                        />
                                    </>
                                )}
                            </View>
                        </VStack>
                    )}

                    {/* Category Stats */}
                    {categoryStats.length > 0 && (
                        <VStack gap="md">
                            <TypographyText variant="heading" size="md" color="default">
                                By Category
                            </TypographyText>
                            <VStack gap="sm">
                                {categoryStats
                                    .sort((a, b) => b.totalTimeSpent - a.totalTimeSpent)
                                    .slice(0, 5)
                                    .map((stat) => (
                                        <View
                                            key={stat.category}
                                            style={[
                                                styles.categoryCard,
                                                {
                                                    backgroundColor: theme.colors.content1,
                                                    borderColor: theme.colors.background,
                                                },
                                            ]}
                                        >
                                            <HStack
                                                justifyContent="space-between"
                                                alignItems="center"
                                            >
                                                <VStack gap="xs">
                                                    <TypographyText
                                                        variant="body"
                                                        style={{
                                                            color: theme.colors.foreground,
                                                            fontWeight: '600',
                                                        }}
                                                    >
                                                        {stat.category}
                                                    </TypographyText>
                                                    <TypographyText
                                                        variant="caption"
                                                        style={{
                                                            color: theme.colors.foreground,
                                                            opacity: 0.7,
                                                        }}
                                                    >
                                                        {stat.todoCount} todos •{' '}
                                                        {stat.completedCount} completed
                                                    </TypographyText>
                                                </VStack>
                                                <TypographyText
                                                    variant="body"
                                                    style={{
                                                        color: theme.colors.foreground,
                                                        fontWeight: '600',
                                                    }}
                                                >
                                                    {formatDuration(stat.totalTimeSpent)}
                                                </TypographyText>
                                            </HStack>
                                        </View>
                                    ))}
                            </VStack>
                        </VStack>
                    )}

                    {/* Empty State */}
                    {!isLoading &&
                        overallStats &&
                        overallStats.totalSessions === 0 &&
                        overallStats.totalTodos === 0 && (
                            <View style={styles.emptyState}>
                                <TypographyText
                                    variant="body"
                                    style={{
                                        textAlign: 'center',
                                        opacity: 0.6,
                                        color: theme.colors.foreground,
                                    }}
                                >
                                    No statistics yet. Start completing Pomodoro sessions to see
                                    your productivity data!
                                </TypographyText>
                            </View>
                        )}
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING['unit-14'],
    },
    periodButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        minWidth: 70,
        alignItems: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    statTitle: {
        opacity: 0.7,
        marginBottom: 4,
        fontSize: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    statSubtitle: {
        opacity: 0.6,
        fontSize: 11,
    },
    categoryCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
