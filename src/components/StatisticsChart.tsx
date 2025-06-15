import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';
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
    const animationProgress = useSharedValue(0);
    const chartWidth = useSharedValue(1);

    // Chart data for different periods
    const chartDataMap: Record<PeriodType, ChartData> = {
        D: {
            labels: ['4', '8', '12', '16', '20'],
            data: [0, 2, 4, 3, 1],
            maxValue: 5,
        },
        W: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            data: [5, 8, 6, 10, 7, 4, 3],
            maxValue: 12,
        },
        M: {
            labels: ['1', '5', '10', '15', '20', '25', '30'],
            data: [20, 35, 28, 40, 32, 25, 18],
            maxValue: 45,
        },
        Y: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            data: [120, 180, 150, 200, 160, 140, 170, 190, 210, 180, 160, 200],
            maxValue: 220,
        },
    };

    const currentChartData = chartDataMap[selectedPeriod];

    useEffect(() => {
        // Animate chart when period changes
        animationProgress.value = withTiming(1, { duration: 800 });
        chartWidth.value = withTiming(getChartWidthMultiplier(), { duration: 600 });
    }, [selectedPeriod]);

    const getChartWidthMultiplier = (): number => {
        switch (selectedPeriod) {
            case 'D': return 1;
            case 'W': return 1.2;
            case 'M': return 0.8;
            case 'Y': return 0.6;
            default: return 1;
        }
    };

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
            animationProgress.value = 0;
            onPeriodChange?.(period);
        }
    };

    const PeriodSelector: React.FC = () => {
        const periods: PeriodType[] = ['D', 'W', 'M', 'Y'];

        return (
            <View className={"bg-bg-200 dark:bg-dark-bg-200"} style={styles.periodSelector}>
                {periods.map((period) => (
                    <TouchableOpacity
                        key={period}
                        className={cn(
                            "bg-bg-200 dark:bg-dark-bg-200",
                            selectedPeriod === period ? "bg-dark-bg-200 dark:bg-dark-bg-200" : "bg-bg-100 dark:bg-dark-bg-100",''
                        )}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period && styles.selectedPeriod,
                        ]}
                        onPress={() => handlePeriodChange(period)}
                    >
                        <Text
                            className={ cn("color-text-primary dark:color-dark-text-primary",selectedPeriod === period ? "color-primary dark:color-dark-primary":'')}

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
        const barHeight = useAnimatedStyle(() => {
            const height = interpolate(
                animationProgress.value,
                [0, 1],
                [0, (value / maxValue) * 150],
                Extrapolate.CLAMP
            );

            const width = interpolate(
                chartWidth.value,
                [0.6, 1.2],
                [20, 35],
                Extrapolate.CLAMP
            );

            return {
                height: height,
                width: width,
                backgroundColor: value > 0 ? '#40E0D0' : '#2a2a2a',
            };
        });

        return (
            <View style={styles.barContainer}>
                <View style={styles.barBackground}>
                    <Animated.View style={[styles.bar, barHeight]} />
                </View>
                <Text style={styles.barLabel}>{label}</Text>
            </View>
        );
    };

    const getTotalFlows = (): number => {
        return currentChartData.data.reduce((sum, value) => sum + value, 0);
    };

    return (
        <View className={"bg-bg-200 dark:bg-bg-200 pt-2.5 pl-2.5 pr-2.5 border-r-2"} style={styles.container}>
            {/* Total Count and Period Selector */}
            <View style={styles.topSection}>
                <View style={styles.totalCountSection}>
                    <View style={styles.totalCountHeader}>
                        <Text className={"color-text-primary dark:color-dark-text-primary"} style={styles.totalCountLabel}>Total Count</Text>
                        <Icon name="keyboard-arrow-up" size={20} color="#666" />
                    </View>
                    <Text className={"text-text-primary dark:text-dark-text-primary"} style={styles.totalCountValue}>
                        {getTotalFlows()} <Text className={"text-text-primary dark:text-dark-text-primary"}  style={styles.flowsText}>Flows</Text>
                    </Text>
                </View>

                <PeriodSelector />
            </View>

            {/* Date Navigation */}
            <View style={styles.dateNavigation}>
                <TouchableOpacity onPress={() => navigateDate('prev')}>
                    <Icon name="chevron-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
                <TouchableOpacity onPress={() => navigateDate('next')}>
                    <Icon name="chevron-right" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Animated Chart */}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    topSection: {
        marginBottom: 20,
    },
    totalCountSection: {
        marginBottom: 20,
    },
    totalCountHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    totalCountLabel: {
        fontSize: 16,
        marginRight: 5,
    },
    totalCountValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    flowsText: {
        fontSize: 24,
        fontWeight: 'normal',
    },
    periodSelector: {
        flexDirection: 'row',
        borderRadius: 8,
        padding: 2,
        marginBottom: 20,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderRadius: 6,
    },
    selectedPeriod: {
    },
    periodText: {
        fontSize: 14,
        fontWeight: '500',
    },
    selectedPeriodText: {
        // color: '#fff',
    },
    dateNavigation: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dateText: {
        fontSize: 18,
        fontWeight: '500',
    },
    chartContainer: {
        height: 200,
        marginBottom: 20,
    },
    chartArea: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barBackground: {
        height: 150,
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 10,
    },
    bar: {
        borderRadius: 2,
        minHeight: 2,
    },
    barLabel: {
        fontSize: 14,
        textAlign: 'center',
    },
});

export default StatisticsChart;
