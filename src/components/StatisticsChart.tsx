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
import cn from "../lib/cn";

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
            <View className="bg-bg-200 dark:bg-dark-bg-200" style={styles.periodSelector}>
                {periods.map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period && styles.selectedPeriod,
                        ]}
                        onPress={() => handlePeriodChange(period)}
                        activeOpacity={0.7}
                    >
                        <Text
                            className={cn(
                                "color-text-secondary dark:color-dark-text-secondary",
                                selectedPeriod === period ? "color-text-primary dark:color-dark-text-primary" : ''
                            )}
                            style={[
                                styles.periodText,
                                selectedPeriod === period && styles.selectedPeriodText,
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
            if (intensity > 0.8) return '#FF6B6B';
            if (intensity > 0.5) return '#4ECDC4';
            if (intensity > 0.2) return '#45B7D1';
            return '#E2E8F0';
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
                <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.barLabel}>
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
            <View className="bg-bg-200 dark:bg-dark-bg-200" style={styles.chartCard}>
                {/* Total Count and Period Selector */}
                <View style={styles.topSection}>
                    <View style={styles.totalCountSection}>
                        <View style={styles.totalCountHeader}>
                            <Text className="color-text-secondary dark:color-dark-text-secondary" style={styles.totalCountLabel}>
                                Total Flows
                            </Text>
                            <View style={styles.trendIndicator}>
                                <Icon name="trending-up" size={16} color="#10B981" />
                                <Text style={styles.trendText}>+12%</Text>
                            </View>
                        </View>
                        <Text className="text-text-primary dark:text-dark-text-primary" style={styles.totalCountValue}>
                            {getTotalFlows()}
                        </Text>
                    </View>

                    <PeriodSelector />
                </View>

                {/* Date Navigation */}
                <View style={styles.dateNavigation}>
                    <TouchableOpacity 
                        onPress={() => navigateDate('prev')}
                        style={styles.dateNavButton}
                        activeOpacity={0.7}
                    >
                        <Icon name="chevron-left" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text className="text-text-primary dark:text-dark-text-primary" style={styles.dateText}>
                        {formatDate(currentDate)}
                    </Text>
                    <TouchableOpacity 
                        onPress={() => navigateDate('next')}
                        style={styles.dateNavButton}
                        activeOpacity={0.7}
                    >
                        <Icon name="chevron-right" size={24} color="#666" />
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
                <View style={styles.insightsSection}>
                    <View style={styles.insightItem}>
                        <Icon name="local-fire-department" size={16} color="#FF6B6B" />
                        <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.insightText}>
                            Peak: {Math.max(...currentChartData.data)} flows
                        </Text>
                    </View>
                    <View style={styles.insightItem}>
                        <Icon name="trending-up" size={16} color="#4ECDC4" />
                        <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.insightText}>
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
        backgroundColor: '#10B98115',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
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
    selectedPeriod: {
        backgroundColor: '#4ECDC415',
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
    },
    selectedPeriodText: {
        color: '#4ECDC4',
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
        backgroundColor: '#F7F7F9',
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
        borderTopColor: '#E2E8F0',
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