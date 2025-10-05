import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useThemeStore } from '../store/themeStore';
import { useColorScheme } from 'react-native';
import { useStatisticsStore } from '../store/statisticsStore';
import { usePomodoroStore } from '../store/pomodoroStore';
import { databaseService } from '../data/database';

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

const StatisticsChart: React.FC<StatisticsChartProps> = ({
  onPeriodChange,
}) => {
  const { mode, getCurrentTheme } = useThemeStore();
  const systemColorScheme = useColorScheme();
  const theme = getCurrentTheme();
  const isDark =
    mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';
  const { flows, breaks, interruptions, syncWithDatabase } =
    useStatisticsStore();
  const { flowMetrics } = usePomodoroStore();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('D');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [chartData, setChartData] = useState<ChartData>({
    labels: [],
    data: [],
    maxValue: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const animationProgress = React.useRef(new Animated.Value(0)).current;
  const chartContainerAnimation = React.useRef(new Animated.Value(0)).current;

  // Load historical data based on selected period
  const loadChartData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date(currentDate);
      const startDate = new Date(currentDate);
      let labels: string[] = [];
      let data: number[] = [];

      switch (selectedPeriod) {
        case 'D': {
          // Show last 7 days
          startDate.setDate(endDate.getDate() - 6);
          labels = [];
          data = [];

          for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dayName = date.toLocaleDateString('en-US', {
              weekday: 'short',
            });
            labels.push(dayName);

            try {
              const dateStr = date.toISOString().split('T')[0];
              const dayStats = await databaseService.getStatistics(dateStr);
              data.push(dayStats.flows?.completed || 0);
            } catch (error) {
              console.error('Error loading day stats:', error);
              data.push(0);
            }
          }
          break;
        }

        case 'W': {
          // Show last 4 weeks
          startDate.setDate(endDate.getDate() - 27); // 4 weeks = 28 days
          labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
          data = [0, 0, 0, 0];

          try {
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            const weeklyStats = await databaseService.getStatisticsRange(
              startDateStr,
              endDateStr
            );

            // Group by weeks
            weeklyStats.forEach(stat => {
              const statDate = new Date(stat.date);
              const daysDiff = Math.floor(
                (statDate.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const weekIndex = Math.floor(daysDiff / 7);

              if (weekIndex >= 0 && weekIndex < 4) {
                data[weekIndex] += stat.flows?.completed || 0;
              }
            });
          } catch (error) {
            console.error('Error loading weekly stats:', error);
          }
          break;
        }

        case 'M': {
          // Show last 6 months
          startDate.setMonth(endDate.getMonth() - 5);
          startDate.setDate(1);
          labels = [];
          data = [];

          for (let i = 0; i < 6; i++) {
            const monthDate = new Date(startDate);
            monthDate.setMonth(startDate.getMonth() + i);

            const monthName = monthDate.toLocaleDateString('en-US', {
              month: 'short',
            });
            labels.push(monthName);

            // Get first and last day of month
            const firstDay = new Date(
              monthDate.getFullYear(),
              monthDate.getMonth(),
              1
            );
            const lastDay = new Date(
              monthDate.getFullYear(),
              monthDate.getMonth() + 1,
              0
            );

            try {
              const monthStats = await databaseService.getStatisticsRange(
                firstDay.toISOString().split('T')[0],
                lastDay.toISOString().split('T')[0]
              );

              const monthTotal = monthStats.reduce(
                (sum, stat) => sum + (stat.flows?.completed || 0),
                0
              );
              data.push(monthTotal);
            } catch (error) {
              console.error('Error loading monthly stats:', error);
              data.push(0);
            }
          }
          break;
        }

        case 'Y': {
          // Show last 4 quarters
          const currentYear = endDate.getFullYear();
          const currentQuarter = Math.floor(endDate.getMonth() / 3);

          labels = ['Q1', 'Q2', 'Q3', 'Q4'];
          data = [0, 0, 0, 0];

          // Calculate data for each quarter of current year
          for (let quarter = 0; quarter < 4; quarter++) {
            const quarterStart = new Date(currentYear, quarter * 3, 1);
            const quarterEnd = new Date(currentYear, (quarter + 1) * 3, 0);

            // Only get data for completed quarters or current quarter
            if (quarter <= currentQuarter) {
              try {
                const quarterStats = await databaseService.getStatisticsRange(
                  quarterStart.toISOString().split('T')[0],
                  quarterEnd.toISOString().split('T')[0]
                );

                const quarterTotal = quarterStats.reduce(
                  (sum, stat) => sum + (stat.flows?.completed || 0),
                  0
                );
                data[quarter] = quarterTotal;
              } catch (error) {
                console.error('Error loading quarterly stats:', error);
              }
            }
          }
          break;
        }
      }

      const maxValue = Math.max(...data, 10); // Minimum of 10 for better visualization

      setChartData({
        labels,
        data,
        maxValue,
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
      // Fallback to empty data
      setChartData({
        labels:
          selectedPeriod === 'D'
            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            : selectedPeriod === 'W'
              ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
              : selectedPeriod === 'M'
                ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
                : ['Q1', 'Q2', 'Q3', 'Q4'],
        data: new Array(
          selectedPeriod === 'D'
            ? 7
            : selectedPeriod === 'W'
              ? 4
              : selectedPeriod === 'M'
                ? 6
                : 4
        ).fill(0),
        maxValue: 10,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when period or date changes
  useEffect(() => {
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

  const navigateDate = (direction: 'prev' | 'next'): void => {
    const newDate = new Date(currentDate);
    switch (selectedPeriod) {
      case 'D':
        newDate.setDate(
          currentDate.getDate() + (direction === 'next' ? 7 : -7)
        );
        break;
      case 'W':
        newDate.setDate(
          currentDate.getDate() + (direction === 'next' ? 28 : -28)
        );
        break;
      case 'M':
        newDate.setMonth(
          currentDate.getMonth() + (direction === 'next' ? 6 : -6)
        );
        break;
      case 'Y':
        newDate.setFullYear(
          currentDate.getFullYear() + (direction === 'next' ? 1 : -1)
        );
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
        {periods.map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && {
                backgroundColor: theme.accent + '15',
              },
            ]}
            onPress={() => handlePeriodChange(period)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodText,
                {
                  color:
                    selectedPeriod === period
                      ? theme.accent
                      : theme.textSecondary,
                },
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
      if (intensity > 0.8) return theme.success || '#10B981';
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
    if (chartData.data.length < 2) return 0;

    const recent =
      chartData.data.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
    const previous =
      chartData.data.slice(0, -3).reduce((sum, val) => sum + val, 0) /
      Math.max(chartData.data.length - 3, 1);

    if (previous === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - previous) / previous) * 100);
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
              <Text
                style={[styles.totalCountLabel, { color: theme.textSecondary }]}
              >
                Total sessions
              </Text>
              <View
                style={[
                  styles.trendIndicator,
                  {
                    backgroundColor:
                      trendPercentage >= 0
                        ? (theme.success || '#10B981') + '15'
                        : (theme.error || '#EF4444') + '15',
                  },
                ]}
              >
                <Icon
                  name={trendPercentage >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={
                    trendPercentage >= 0
                      ? theme.success || '#10B981'
                      : theme.error || '#EF4444'
                  }
                />
                <Text
                  style={[
                    styles.trendText,
                    {
                      color:
                        trendPercentage >= 0
                          ? theme.success || '#10B981'
                          : theme.error || '#EF4444',
                    },
                  ]}
                >
                  {trendPercentage > 0 ? '+' : ''}
                  {trendPercentage}%
                </Text>
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
            style={[
              styles.dateNavButton,
              { backgroundColor: theme.background },
            ]}
            activeOpacity={0.7}
          >
            <Icon name='chevron-left' size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.dateText, { color: theme.text }]}>
            {formatDate(currentDate)}
          </Text>
          <TouchableOpacity
            onPress={() => navigateDate('next')}
            style={[
              styles.dateNavButton,
              { backgroundColor: theme.background },
            ]}
            activeOpacity={0.7}
          >
            <Icon name='chevron-right' size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading chart data...
            </Text>
          </View>
        )}

        {/* Enhanced Animated Chart */}
        {!isLoading && (
          <View style={styles.chartContainer}>
            <View style={styles.chartArea}>
              {chartData.data.map((value, index) => (
                <AnimatedBar
                  key={`${selectedPeriod}-${index}`}
                  value={value}
                  maxValue={chartData.maxValue}
                  index={index}
                  label={chartData.labels[index]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Chart Insights */}
        <View
          style={[
            styles.insightsSection,
            { borderTopColor: theme.border || theme.surface },
          ]}
        >
          <View style={styles.insightItem}>
            <Icon
              name='local-fire-department'
              size={16}
              color={theme.error || '#EF4444'}
            />
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              Peak: {Math.max(...chartData.data)} flows
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Icon name='trending-up' size={16} color={theme.accent} />
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              Avg:{' '}
              {chartData.data.length > 0
                ? Math.round(getTotalFlows() / chartData.data.length)
                : 0}{' '}
              flows
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
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
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
