import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../providers/ThemeProvider';
import { useStatisticsStore } from '../store/statisticsStore';
import { databaseService } from '../services/database';

// Type definitions
type PeriodType = 'D' | 'W' | 'M' | 'Y';

interface ChartData {
    labels: string[];
    data: number[];
    maxValue: number;
}

interface StatisticsChartProps {
    onPeriodChange?: (period: PeriodType) => void;
}

const StatisticsChart: React.FC<StatisticsChartProps> = ({ onPeriodChange }) => {
    const { theme } = useTheme();
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('D');
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [chartData, setChartData] = useState<ChartData>({
        labels: [],
        data: [],
        maxValue: 0,
    });
    const [isLoading, setIsLoading] = useState(false);

    // Get statistics data from store
    const { flows, breaks, totalCount, loadStatistics } = useStatisticsStore();

    // Animation values
    const animationProgress = React.useRef(new Animated.Value(0)).current;
    const chartContainerAnimation = React.useRef(new Animated.Value(0)).current;

    // Generate chart data based on period and current date
    const generateChartData = async (period: PeriodType, date: Date): Promise<ChartData> => {
        setIsLoading(true);

        try {
            let labels: string[] = [];
            let data: number[] = [];
            let maxValue = 0;

            switch (period) {
                case 'D': {
                    // Daily: Show hourly data for the selected day
                    labels = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
                    const dateStr = date.toISOString().split('T')[0];

                    // Get hourly statistics for the day (mock implementation)
                    // In a real app, you'd store hourly statistics in your database
                    const hourlyData = await getHourlyStatistics(dateStr);
                    data = hourlyData.length > 0 ? hourlyData : [2, 5, 8, 6, 4, 1]; // Fallback to demo data
                    maxValue = Math.max(...data, 10);
                    break;
                }

                case 'W': {
                    // Weekly: Show daily data for the selected week
                    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const weekData = await getWeeklyStatistics(date);
                    data = weekData;
                    maxValue = Math.max(...data, 5);
                    break;
                }

                case 'M': {
                    // Monthly: Show weekly data for the selected month
                    labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                    const monthData = await getMonthlyStatistics(date);
                    data = monthData;
                    maxValue = Math.max(...data, 10);
                    break;
                }

                case 'Y': {
                    // Yearly: Show quarterly data for the selected year
                    labels = ['Q1', 'Q2', 'Q3', 'Q4'];
                    const yearData = await getYearlyStatistics(date);
                    data = yearData;
                    maxValue = Math.max(...data, 50);
                    break;
                }
            }

            return { labels, data, maxValue };
        } catch (error) {
            console.error('Error generating chart data:', error);
            // Return fallback data on error
            return {
                labels: ['No Data'],
                data: [0],
                maxValue: 1,
            };
        } finally {
            setIsLoading(false);
        }
    };

    // Helper functions to get statistics for different periods
    const getHourlyStatistics = async (dateStr: string): Promise<number[]> => {
        try {
            // This would typically query your database for hourly statistics
            // For now, we'll use the current day's data and distribute it across hours
            const stats = await databaseService.getStatistics(dateStr);
            const totalSessions = stats.flows.completed;

            // Distribute sessions across typical productive hours (mock algorithm)
            const hourlyDistribution = [0.1, 0.15, 0.25, 0.2, 0.15, 0.15]; // 6AM, 9AM, 12PM, 3PM, 6PM, 9PM
            return hourlyDistribution.map(ratio => Math.round(totalSessions * ratio));
        } catch (error) {
            console.error('Error getting hourly statistics:', error);
            return [];
        }
    };

    const getWeeklyStatistics = async (date: Date): Promise<number[]> => {
        try {
            const weekData: number[] = [];
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday

            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(startOfWeek);
                currentDate.setDate(startOfWeek.getDate() + i);
                const dateStr = currentDate.toISOString().split('T')[0];

                try {
                    const stats = await databaseService.getStatistics(dateStr);
                    weekData.push(stats.flows.completed);
                } catch {
                    weekData.push(0); // No data for this day
                }
            }

            return weekData;
        } catch (error) {
            console.error('Error getting weekly statistics:', error);
            return [0, 0, 0, 0, 0, 0, 0];
        }
    };

    const getMonthlyStatistics = async (date: Date): Promise<number[]> => {
        try {
            const monthData: number[] = [];
            const year = date.getFullYear();
            const month = date.getMonth();
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);

            // Divide month into 4 weeks
            for (let week = 0; week < 4; week++) {
                const weekStart = new Date(firstDay);
                weekStart.setDate(firstDay.getDate() + (week * 7));

                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                // Ensure we don't go beyond the month
                if (weekEnd > lastDay) {
                    weekEnd.setTime(lastDay.getTime());
                }

                let weekTotal = 0;
                const currentDate = new Date(weekStart);

                while (currentDate <= weekEnd) {
                    const dateStr = currentDate.toISOString().split('T')[0];
                    try {
                        const stats = await databaseService.getStatistics(dateStr);
                        weekTotal += stats.flows.completed;
                    } catch {
                        // No data for this day, continue
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }

                monthData.push(weekTotal);
            }

            return monthData;
        } catch (error) {
            console.error('Error getting monthly statistics:', error);
            return [0, 0, 0, 0];
        }
    };

    const getYearlyStatistics = async (date: Date): Promise<number[]> => {
        try {
            const yearData: number[] = [];
            const year = date.getFullYear();

            // Get data for each quarter
            for (let quarter = 0; quarter < 4; quarter++) {
                const startMonth = quarter * 3;
                const endMonth = startMonth + 2;

                let quarterTotal = 0;

                for (let month = startMonth; month <= endMonth; month++) {
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);

                    const currentDate = new Date(firstDay);
                    while (currentDate <= lastDay) {
                        const dateStr = currentDate.toISOString().split('T')[0];
                        try {
                            const stats = await databaseService.getStatistics(dateStr);
                            quarterTotal += stats.flows.completed;
                        } catch {
                            // No data for this day, continue
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }

                yearData.push(quarterTotal);
            }

            return yearData;
        } catch (error) {
            console.error('Error getting yearly statistics:', error);
            return [0, 0, 0, 0];
        }
    };

    // Load chart data when period or date changes
    useEffect(() => {
        const loadChartData = async () => {
            const newChartData = await generateChartData(selectedPeriod, currentDate);
            setChartData(newChartData);
        };

        loadChartData();
    }, [selectedPeriod, currentDate]);

    // Animate chart when data changes
    useEffect(() => {
        Animated.sequence([
            Animated.timing(animationProgress, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
            Animated.timing(animationProgress, {
                toValue: 1,
                duration: 800,
                useNativeDriver: false,
            }),
        ]).start();
    }, [chartData]);

    useEffect(() => {
        // Initial container animation
        Animated.timing(chartContainerAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    const formatDate = (date: Date): string => {
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        };
        return date.toLocaleDateString('en-US', options);
    };

    const formatDateByPeriod = (date: Date, period: PeriodType): string => {
        switch (period) {
            case 'D':
                return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                });
            case 'W':
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay() + 1);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            case 'M':
                return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            case 'Y':
                return date.getFullYear().toString();
            default:
                return formatDate(date);
        }
    };

    const navigateDate = (direction: 'prev' | 'next'): void => {
        const newDate = new Date(currentDate);
        switch (selectedPeriod) {
            case 'D':
                newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
            case 'W':
                newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
                break;
            case 'M':
                newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
                break;
            case 'Y':
                newDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
                break;
        }
        setCurrentDate(newDate);
    };

    const handlePeriodChange = (period: PeriodType): void => {
        if (period !== selectedPeriod) {
            setSelectedPeriod(period);
            onPeriodChange?.(period);
        }
    };

    const PeriodSelector: React.FC = () => {
        const periods: PeriodType[] = ['D', 'W', 'M', 'Y'];

        return (
            <View style={[styles.periodSelector, { backgroundColor: theme.surface }]}>
                {periods.map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period && { backgroundColor: theme.accent + '15' },
                        ]}
                        onPress={() => handlePeriodChange(period)}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.periodText,
                                { color: selectedPeriod === period ? theme.accent : theme.textSecondary }
                            ]}
                        >
                            {period}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const AnimatedBar: React.FC<{
        value: number;
        maxValue: number;
        index: number;
        label: string;
    }> = ({ value, maxValue, index, label }) => {
        const barHeight = animationProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, maxValue > 0 ? (value / maxValue) * 120 : 0],
            extrapolate: 'clamp',
        });

        const barOpacity = animationProgress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
            extrapolate: 'clamp',
        });

        const getBarColor = () => {
            if (maxValue === 0) return theme.surface;

            const intensity = value / maxValue;
            if (intensity > 0.8) return theme.error;
            if (intensity > 0.5) return theme.accent;
            if (intensity > 0.2) return theme.primary;
            return theme.surface;
        };

        return (
            <View style={styles.barContainer}>
                <View style={styles.barBackground}>
                    <Animated.View
                        style={[
                            styles.bar,
                            {
                                height: barHeight,
                                backgroundColor: getBarColor(),
                                opacity: barOpacity,
                            },
                        ]}
                    />
                </View>
                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>
                    {label}
                </Text>
            </View>
        );
    };

    const getTotalFlows = (): number => {
        return chartData.data.reduce((sum, value) => sum + value, 0);
    };

    const getTrendPercentage = (): number => {
        // Calculate trend based on current vs previous period (mock calculation)
        const currentTotal = getTotalFlows();
        const previousTotal = Math.max(1, currentTotal - 2); // Mock previous period data
        return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    };

    const containerOpacity = chartContainerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const containerTranslateY = chartContainerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0],
    });

    const trendPercentage = getTrendPercentage();

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: containerOpacity,
                    transform: [{ translateY: containerTranslateY }],
                },
            ]}
        >
            <View style={[styles.chartCard, { backgroundColor: theme.surface }]}>
                {/* Total Count and Period Selector */}
                <View style={styles.topSection}>
                    <View style={styles.totalCountSection}>
                        <View style={styles.totalCountHeader}>
                            <Text style={[styles.totalCountLabel, { color: theme.textSecondary }]}>
                                Total Flows
                            </Text>
                            <View style={[
                                styles.trendIndicator,
                                { backgroundColor: trendPercentage >= 0 ? theme.success + '15' : theme.error + '15' }
                            ]}>
                                <Icon
                                    name={trendPercentage >= 0 ? "trending-up" : "trending-down"}
                                    size={16}
                                    color={trendPercentage >= 0 ? theme.success : theme.error}
                                />
                                <Text style={[
                                    styles.trendText,
                                    { color: trendPercentage >= 0 ? theme.success : theme.error }
                                ]}>
                                    {Math.abs(trendPercentage)}%
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.totalCountValue, { color: theme.text }]}>
                            {isLoading ? '...' : getTotalFlows()}
                        </Text>
                    </View>

                    <PeriodSelector />
                </View>

                {/* Date Navigation */}
                <View style={styles.dateNavigation}>
                    <TouchableOpacity
                        onPress={() => navigateDate('prev')}
                        style={[styles.dateNavButton, { backgroundColor: theme.surface }]}
                        activeOpacity={0.7}
                    >
                        <Icon name="chevron-left" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <Text style={[styles.dateText, { color: theme.text }]}>
                        {formatDateByPeriod(currentDate, selectedPeriod)}
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigateDate('next')}
                        style={[styles.dateNavButton, { backgroundColor: theme.surface }]}
                        activeOpacity={0.7}
                        disabled={currentDate >= new Date()} // Disable future dates
                    >
                        <Icon
                            name="chevron-right"
                            size={24}
                            color={currentDate >= new Date() ? theme.textSecondary + '50' : theme.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Enhanced Animated Chart */}
                <View style={styles.chartContainer}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                                Loading chart data...
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.chartArea}>
                            {chartData.data.map((value, index) => (
                                <AnimatedBar
                                    key={`${selectedPeriod}-${currentDate.getTime()}-${index}`}
                                    value={value}
                                    maxValue={chartData.maxValue}
                                    index={index}
                                    label={chartData.labels[index]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Chart Insights */}
                <View style={[styles.insightsSection, { borderTopColor: theme.border }]}>
                    <View style={styles.insightItem}>
                        <Icon name="local-fire-department" size={16} color={theme.error} />
                        <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                            Peak: {chartData.data.length > 0 ? Math.max(...chartData.data) : 0} flows
                        </Text>
                    </View>
                    <View style={styles.insightItem}>
                        <Icon name="trending-up" size={16} color={theme.accent} />
                        <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                            Avg: {chartData.data.length > 0 ? Math.round(getTotalFlows() / chartData.data.length) : 0} flows
                        </Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 24,
        marginBottom: 20,
    },
    chartCard: {
        borderRadius: 24,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.1,
                shadowRadius: 24,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    topSection: {
        marginBottom: 24,
    },
    totalCountSection: {
        marginBottom: 20,
    },
    totalCountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalCountLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    trendIndicator: {
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
    totalCountValue: {
        fontSize: 48,
        fontWeight: '800',
        letterSpacing: -2,
    },
    periodSelector: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderRadius: 8,
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dateNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    dateNavButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        flex: 1,
    },
    chartContainer: {
        height: 160,
        marginBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    chartArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
        maxWidth: 40,
    },
    barBackground: {
        height: 120,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 12,
        width: 24,
    },
    bar: {
        width: 24,
        borderRadius: 12,
        minHeight: 4,
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
    barLabel: {
        fontSize: 12,
        fontWeight: '500',
        textAlign: 'center',
    },
    insightsSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
    },
    insightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    insightText: {
        fontSize: 12,
        fontWeight: '500',
    },
});

export default StatisticsChart;
