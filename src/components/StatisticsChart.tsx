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

const { width: screenWidth } = Dimensions.get('window');

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

    // Animation values
    const animationProgress = React.useRef(new Animated.Value(0)).current;
    const chartContainerAnimation = React.useRef(new Animated.Value(0)).current;

    // Chart data for different periods
    const chartDataMap: Record<PeriodType, ChartData> = {
        D: {
            labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
            data: [2, 5, 8, 6, 4, 1],
            maxValue: 10,
        },
        W: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [12, 18, 15, 22, 19, 8, 5],
            maxValue: 25,
        },
        M: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            data: [45, 52, 38, 61],
            maxValue: 70,
        },
        Y: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            data: [180, 220, 195, 240],
            maxValue: 260,
        },
    };

    const currentChartData = chartDataMap[selectedPeriod];

    useEffect(() => {
        // Animate chart when period changes
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
    }, [selectedPeriod]);

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
            outputRange: [0, (value / maxValue) * 120],
            extrapolate: 'clamp',
        });

        const barOpacity = animationProgress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.5, 1],
            extrapolate: 'clamp',
        });

        const getBarColor = () => {
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
        return currentChartData.data.reduce((sum, value) => sum + value, 0);
    };

    const containerOpacity = chartContainerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
    });

    const containerTranslateY = chartContainerAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0],
    });

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
                            <View style={[styles.trendIndicator, { backgroundColor: theme.success + '15' }]}>
                                <Icon name="trending-up" size={16} color={theme.success} />
                                <Text style={[styles.trendText, { color: theme.success }]}>+12%</Text>
                            </View>
                        </View>
                        <Text style={[styles.totalCountValue, { color: theme.text }]}>
                            {getTotalFlows()}
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
                        {formatDate(currentDate)}
                    </Text>
                    <TouchableOpacity 
                        onPress={() => navigateDate('next')}
                        style={[styles.dateNavButton, { backgroundColor: theme.surface }]}
                        activeOpacity={0.7}
                    >
                        <Icon name="chevron-right" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Enhanced Animated Chart */}
                <View style={styles.chartContainer}>
                    <View style={styles.chartArea}>
                        {currentChartData.data.map((value, index) => (
                            <AnimatedBar
                                key={`${selectedPeriod}-${index}`}
                                value={value}
                                maxValue={currentChartData.maxValue}
                                index={index}
                                label={currentChartData.labels[index]}
                            />
                        ))}
                    </View>
                </View>

                {/* Chart Insights */}
                <View style={[styles.insightsSection, { borderTopColor: theme.border }]}>
                    <View style={styles.insightItem}>
                        <Icon name="local-fire-department" size={16} color={theme.error} />
                        <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                            Peak: {Math.max(...currentChartData.data)} flows
                        </Text>
                    </View>
                    <View style={styles.insightItem}>
                        <Icon name="trending-up" size={16} color={theme.accent} />
                        <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                            Avg: {Math.round(getTotalFlows() / currentChartData.data.length)} flows
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
    },
    chartContainer: {
        height: 160,
        marginBottom: 20,
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