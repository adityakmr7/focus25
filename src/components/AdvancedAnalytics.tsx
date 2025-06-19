import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../providers/ThemeProvider';
import { usePomodoroStore } from '../store/pomodoroStore';
import { useStatisticsStore } from '../store/statisticsStore';
import { useGoalsStore } from '../store/goalsStore';

const { width } = Dimensions.get('window');

interface AnalyticsInsight {
  id: string;
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
  color: string;
  icon: string;
}

interface AdvancedAnalyticsProps {
  timeRange: 'week' | 'month' | 'quarter' | 'year';
  onTimeRangeChange: (range: 'week' | 'month' | 'quarter' | 'year') => void;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  timeRange,
  onTimeRangeChange,
}) => {
  const { theme } = useTheme();
  const { flowMetrics } = usePomodoroStore();
  const { flows, breaks, interruptions } = useStatisticsStore();
  const { goals } = useGoalsStore();

  const [selectedChart, setSelectedChart] = useState<'productivity' | 'focus' | 'goals'>('productivity');
  const chartAnimation = useSharedValue(0);

  React.useEffect(() => {
    chartAnimation.value = withTiming(1, { duration: 800 });
  }, [selectedChart]);

  // Generate insights based on data
  const insights = useMemo((): AnalyticsInsight[] => {
    const completionRate = flows.started > 0 ? (flows.completed / flows.started) * 100 : 0;
    const averageSessionLength = flows.completed > 0 ? flows.minutes / flows.completed : 0;
    const focusEfficiency = Math.max(0, 100 - (interruptions * 5));
    const goalCompletionRate = goals.length > 0 ? (goals.filter(g => g.isCompleted).length / goals.length) * 100 : 0;

    return [
      {
        id: 'completion',
        title: 'Session Completion',
        value: `${Math.round(completionRate)}%`,
        change: 12,
        trend: 'up',
        description: 'Sessions completed vs started',
        color: theme.success,
        icon: 'checkmark-circle',
      },
      {
        id: 'focus-time',
        title: 'Average Focus Time',
        value: `${Math.round(averageSessionLength)}m`,
        change: 8,
        trend: 'up',
        description: 'Average session duration',
        color: theme.primary,
        icon: 'time',
      },
      {
        id: 'efficiency',
        title: 'Focus Efficiency',
        value: `${Math.round(focusEfficiency)}%`,
        change: -3,
        trend: 'down',
        description: 'Based on interruption frequency',
        color: theme.accent,
        icon: 'trending-up',
      },
      {
        id: 'goals',
        title: 'Goal Achievement',
        value: `${Math.round(goalCompletionRate)}%`,
        change: 15,
        trend: 'up',
        description: 'Goals completed this period',
        color: theme.warning,
        icon: 'flag',
      },
      {
        id: 'streak',
        title: 'Current Streak',
        value: `${flowMetrics.currentStreak}`,
        change: 2,
        trend: 'up',
        description: 'Consecutive days of focus',
        color: theme.error,
        icon: 'flame',
      },
      {
        id: 'intensity',
        title: 'Flow Intensity',
        value: flowMetrics.flowIntensity.toUpperCase(),
        change: 0,
        trend: 'stable',
        description: 'Current flow state level',
        color: flowMetrics.flowIntensity === 'high' ? theme.success : 
               flowMetrics.flowIntensity === 'medium' ? theme.warning : theme.error,
        icon: 'pulse',
      },
    ];
  }, [flows, breaks, interruptions, goals, flowMetrics, theme]);

  // Generate chart data
  const productivityChartData = useMemo(() => {
    // Mock data - in real app, this would come from historical statistics
    const labels = timeRange === 'week' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : timeRange === 'month'
      ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      : timeRange === 'quarter'
      ? ['Month 1', 'Month 2', 'Month 3']
      : ['Q1', 'Q2', 'Q3', 'Q4'];

    const focusData = timeRange === 'week'
      ? [120, 150, 180, 200, 170, 90, 60]
      : timeRange === 'month'
      ? [800, 950, 1100, 1200]
      : timeRange === 'quarter'
      ? [3500, 4200, 4800]
      : [12000, 14500, 16200, 18000];

    const breakData = timeRange === 'week'
      ? [30, 40, 45, 50, 42, 25, 15]
      : timeRange === 'month'
      ? [200, 240, 275, 300]
      : timeRange === 'quarter'
      ? [875, 1050, 1200]
      : [3000, 3625, 4050, 4500];

    return {
      labels,
      datasets: [
        {
          data: focusData,
          color: (opacity = 1) => `rgba(${hexToRgb(theme.success)}, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: breakData,
          color: (opacity = 1) => `rgba(${hexToRgb(theme.primary)}, ${opacity})`,
          strokeWidth: 3,
        },
      ],
      legend: ['Focus Time', 'Break Time'],
    };
  }, [timeRange, theme]);

  const focusDistributionData = useMemo(() => {
    return [
      {
        name: 'Deep Focus',
        population: 45,
        color: theme.success,
        legendFontColor: theme.text,
        legendFontSize: 12,
      },
      {
        name: 'Medium Focus',
        population: 35,
        color: theme.warning,
        legendFontColor: theme.text,
        legendFontSize: 12,
      },
      {
        name: 'Light Focus',
        population: 20,
        color: theme.error,
        legendFontColor: theme.text,
        legendFontSize: 12,
      },
    ];
  }, [theme]);

  const goalProgressData = useMemo(() => {
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const activeGoals = goals.filter(g => !g.isCompleted).length;

    return {
      labels: ['Completed', 'In Progress'],
      datasets: [{
        data: [completedGoals, activeGoals],
        colors: [
          (opacity = 1) => `rgba(${hexToRgb(theme.success)}, ${opacity})`,
          (opacity = 1) => `rgba(${hexToRgb(theme.warning)}, ${opacity})`,
        ],
      }],
    };
  }, [goals, theme]);

  const chartConfig = {
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${hexToRgb(theme.primary)}, ${opacity})`,
    labelColor: (opacity = 1) => theme.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.accent,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: theme.background,
      strokeWidth: 1,
    },
  };

  const animatedChartStyle = useAnimatedStyle(() => ({
    opacity: chartAnimation.value,
    transform: [
      {
        translateY: interpolate(chartAnimation.value, [0, 1], [20, 0])
      }
    ]
  }));

  const renderInsightCard = (insight: AnalyticsInsight) => (
    <View key={insight.id} style={[styles.insightCard, { backgroundColor: theme.surface }]}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightIcon, { backgroundColor: insight.color + '20' }]}>
          <Ionicons name={insight.icon as any} size={20} color={insight.color} />
        </View>
        <View style={styles.insightChange}>
          <Ionicons
            name={insight.trend === 'up' ? 'trending-up' : insight.trend === 'down' ? 'trending-down' : 'remove'}
            size={16}
            color={insight.trend === 'up' ? theme.success : insight.trend === 'down' ? theme.error : theme.textSecondary}
          />
          <Text style={[
            styles.changeText,
            { color: insight.trend === 'up' ? theme.success : insight.trend === 'down' ? theme.error : theme.textSecondary }
          ]}>
            {insight.change > 0 ? '+' : ''}{insight.change}%
          </Text>
        </View>
      </View>
      
      <Text style={[styles.insightValue, { color: insight.color }]}>
        {insight.value}
      </Text>
      <Text style={[styles.insightTitle, { color: theme.text }]}>
        {insight.title}
      </Text>
      <Text style={[styles.insightDescription, { color: theme.textSecondary }]}>
        {insight.description}
      </Text>
    </View>
  );

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              { backgroundColor: theme.surface },
              timeRange === range && { backgroundColor: theme.accent + '20' }
            ]}
            onPress={() => onTimeRangeChange(range)}
          >
            <Text style={[
              styles.timeRangeText,
              { color: timeRange === range ? theme.accent : theme.textSecondary }
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Insights Grid */}
      <View style={styles.insightsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Key Insights
        </Text>
        <View style={styles.insightsGrid}>
          {insights.map(renderInsightCard)}
        </View>
      </View>

      {/* Chart Selector */}
      <View style={styles.chartSelectorContainer}>
        {(['productivity', 'focus', 'goals'] as const).map((chart) => (
          <TouchableOpacity
            key={chart}
            style={[
              styles.chartSelectorButton,
              { backgroundColor: theme.surface },
              selectedChart === chart && { backgroundColor: theme.accent + '20' }
            ]}
            onPress={() => setSelectedChart(chart)}
          >
            <Ionicons
              name={
                chart === 'productivity' ? 'trending-up' :
                chart === 'focus' ? 'radio' : 'flag'
              }
              size={20}
              color={selectedChart === chart ? theme.accent : theme.textSecondary}
            />
            <Text style={[
              styles.chartSelectorText,
              { color: selectedChart === chart ? theme.accent : theme.textSecondary }
            ]}>
              {chart.charAt(0).toUpperCase() + chart.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Charts */}
      <Animated.View style={[styles.chartContainer, animatedChartStyle]}>
        {selectedChart === 'productivity' && (
          <View style={styles.chartWrapper}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Productivity Trends
            </Text>
            <LineChart
              data={productivityChartData}
              width={width - 48}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {selectedChart === 'focus' && (
          <View style={styles.chartWrapper}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Focus Distribution
            </Text>
            <PieChart
              data={focusDistributionData}
              width={width - 48}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </View>
        )}

        {selectedChart === 'goals' && (
          <View style={styles.chartWrapper}>
            <Text style={[styles.chartTitle, { color: theme.text }]}>
              Goal Progress
            </Text>
            <BarChart
              data={goalProgressData}
              width={width - 48}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </View>
        )}
      </Animated.View>

      {/* Detailed Metrics */}
      <View style={styles.detailedMetricsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Detailed Metrics
        </Text>
        
        <View style={[styles.metricCard, { backgroundColor: theme.surface }]}>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Total Focus Sessions
            </Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {flows.completed}
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Total Focus Time
            </Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {Math.floor(flows.minutes / 60)}h {flows.minutes % 60}m
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Average Session Length
            </Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {flows.completed > 0 ? Math.round(flows.minutes / flows.completed) : 0}m
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Longest Streak
            </Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {flowMetrics.longestStreak} days
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
              Interruptions Today
            </Text>
            <Text style={[styles.metricValue, { color: interruptions > 5 ? theme.error : theme.success }]}>
              {interruptions}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    width: (width - 60) / 2,
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
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  chartSelectorContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  chartSelectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  chartSelectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    marginBottom: 32,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  detailedMetricsSection: {
    marginBottom: 32,
  },
  metricCard: {
    padding: 20,
    borderRadius: 16,
    gap: 16,
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
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 40,
  },
});