import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import StatisticsChart from "../components/StatisticsChart";
import { useStatisticsStore } from "../store/statisticsStore";
import { usePomodoroStore } from '../store/pomodoroStore';
import { useGoalsStore } from '../store/goalsStore';
import { FlowMetrics } from '../components/FlowMetrics';
import { GoalsModal } from '../components/GoalsModal';
import cn from "../lib/cn";

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
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient, 
  trend, 
  delay = 0 
}) => {
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
      <View className="bg-bg-200 dark:bg-dark-bg-200" style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: gradient[0] + '20' }]}>
            <Icon name={icon} size={24} color={gradient[0]} />
          </View>
          {trend !== undefined && (
            <View style={[styles.trendContainer, { backgroundColor: trend >= 0 ? '#10B98120' : '#EF444420' }]}>
              <Icon 
                name={trend >= 0 ? "trending-up" : "trending-down"} 
                size={16} 
                color={trend >= 0 ? '#10B981' : '#EF4444'} 
              />
              <Text style={[styles.trendText, { color: trend >= 0 ? '#10B981' : '#EF4444' }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        
        <Text className="text-text-primary dark:text-dark-text-primary" style={styles.cardValue}>
          {value}
        </Text>
        <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.cardTitle}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.cardSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
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
        style={[styles.actionButton, { backgroundColor: gradient[0] + '15' }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.actionIconContainer, { backgroundColor: gradient[0] }]}>
          <Icon name={icon} size={20} color="#FFFFFF" />
        </View>
        <Text className="text-text-primary dark:text-dark-text-primary" style={styles.actionButtonText}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const StatisticsScreen: React.FC<StatisticsScreenProps> = ({ navigation }) => {
  const {
    selectedPeriod,
    currentDate,
    loadStatistics,
    totalCount,
    flows,
    breaks,
    interruptions,
  } = useStatisticsStore();
  
  const { flowMetrics } = usePomodoroStore();
  const { goals, getActiveGoals, updateGoalsFromStats } = useGoalsStore();
  
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const headerAnimatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnimatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Update goals based on current statistics
  useEffect(() => {
    const stats = {
      dailySessions: flows.completed,
      dailyFocusTime: flows.minutes,
      currentStreak: flowMetrics.currentStreak,
      weeklyConsistency: flows.completed > 0 ? 85 : 0, // Mock weekly consistency
    };
    
    updateGoalsFromStats(stats);
  }, [flows, flowMetrics]);

  const headerOpacity = headerAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const headerTranslateY = headerAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  const activeGoals = getActiveGoals();
  const recentGoals = activeGoals.slice(0, 3); // Show top 3 active goals

  const statsData = [
    {
      title: 'Total Flows',
      value: flows.completed,
      subtitle: `${flows.started} started`,
      icon: 'local-fire-department',
      gradient: ['#FF6B6B', '#FF8E8E'],
      trend: 12,
    },
    {
      title: 'Focus Time',
      value: `${Math.floor(flows.minutes / 60)}h ${flows.minutes % 60}m`,
      subtitle: 'This period',
      icon: 'schedule',
      gradient: ['#4ECDC4', '#44A08D'],
      trend: 8,
    },
    {
      title: 'Breaks Taken',
      value: breaks.completed,
      subtitle: `${Math.floor(breaks.minutes / 60)}h ${breaks.minutes % 60}m total`,
      icon: 'coffee',
      gradient: ['#45B7D1', '#96C93D'],
      trend: -3,
    },
    {
      title: 'Interruptions',
      value: interruptions,
      subtitle: 'Stay focused!',
      icon: 'notifications-off',
      gradient: ['#F093FB', '#F5576C'],
      trend: -15,
    },
  ];

  const getGoalProgress = (goal: any) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getGoalColor = (category: string) => {
    switch (category) {
      case 'sessions': return '#FF6B6B';
      case 'focus_time': return '#4ECDC4';
      case 'streak': return '#FFD93D';
      case 'consistency': return '#9F7AEA';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView className="bg-bg-100 dark:bg-dark-bg-100" style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
          <Text className="text-text-primary dark:text-dark-text-primary" style={styles.headerTitle}>
            Statistics
          </Text>
          <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.headerSubtitle}>
            Track your productivity journey
          </Text>
        </Animated.View>

        {/* Enhanced Chart with Animation */}
        <View style={styles.chartSection}>
          <StatisticsChart />
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
              <Icon name="flag" size={24} color="#9F7AEA" />
              <Text className="text-text-primary dark:text-dark-text-primary" style={styles.sectionTitle}>
                Active Goals
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.viewAllButton, { backgroundColor: '#9F7AEA' + '20' }]}
              onPress={() => setShowGoalsModal(true)}
            >
              <Text style={[styles.viewAllText, { color: '#9F7AEA' }]}>View All</Text>
            </TouchableOpacity>
          </Animated.View>

          {recentGoals.length > 0 ? (
            <View style={styles.goalsGrid}>
              {recentGoals.map((goal, index) => (
                <Animated.View
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
                    {
                      opacity: headerOpacity,
                      transform: [{ translateY: headerTranslateY }],
                    },
                  ]}
                >
                  <View style={styles.goalHeader}>
                    <View style={[
                      styles.goalIcon, 
                      { backgroundColor: getGoalColor(goal.category) + '20' }
                    ]}>
                      <Icon 
                        name={goal.category === 'sessions' ? 'timer' : 
                              goal.category === 'focus_time' ? 'schedule' :
                              goal.category === 'streak' ? 'local-fire-department' : 'calendar-today'} 
                        size={16} 
                        color={getGoalColor(goal.category)} 
                      />
                    </View>
                    <Text className="text-text-primary dark:text-dark-text-primary" style={styles.goalTitle}>
                      {goal.title}
                    </Text>
                  </View>
                  
                  <View style={styles.goalProgress}>
                    <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.goalProgressText}>
                      {goal.current} / {goal.target} {goal.unit}
                    </Text>
                    <View style={[styles.goalProgressBar, { backgroundColor: '#E5E7EB' }]}>
                      <View
                        style={[
                          styles.goalProgressFill,
                          {
                            width: `${getGoalProgress(goal)}%`,
                            backgroundColor: getGoalColor(goal.category),
                          }
                        ]}
                      />
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.emptyGoalsCard, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}
              onPress={() => setShowGoalsModal(true)}
            >
              <Icon name="flag-outline" size={32} color="#9F7AEA" />
              <Text className="text-text-primary dark:text-dark-text-primary" style={styles.emptyGoalsTitle}>
                Set Your First Goal
              </Text>
              <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.emptyGoalsSubtitle}>
                Track your progress and stay motivated
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <ActionButton
            icon="analytics"
            label="Flow Analytics"
            onPress={() => navigation?.navigate("FlowAnalytics")}
            gradient={['#f093fb', '#f5576c']}
            delay={300}
          />
          <ActionButton
            icon="flag"
            label="Set Goals"
            onPress={() => setShowGoalsModal(true)}
            gradient={['#9F7AEA', '#C084FC']}
            delay={400}
          />
        </View>

        {/* Enhanced Statistics Cards Grid */}
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
              delay={index * 100 + 500}
            />
          ))}
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
            <Icon name="psychology" size={24} color="#4ECDC4" />
            <Text className="text-text-primary dark:text-dark-text-primary" style={styles.sectionTitle}>
              Flow State Analysis
            </Text>
          </Animated.View>
          <FlowMetrics showDetailed={false} />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Animated.View
            style={[
              styles.sectionHeader,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
              },
            ]}
          >
            <Icon name="flash-on" size={24} color="#FF6B6B" />
            <Text className="text-text-primary dark:text-dark-text-primary" style={styles.sectionTitle}>
              Quick Actions
            </Text>
          </Animated.View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: '#FF6B6B15' }]}
              onPress={() => navigation?.navigate("FlowAnalytics")}
            >
              <Icon name="trending-up" size={32} color="#FF6B6B" />
              <Text className="text-text-primary dark:text-dark-text-primary" style={styles.quickActionTitle}>
                View Trends
              </Text>
              <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.quickActionSubtitle}>
                Analyze patterns
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: '#4ECDC415' }]}
              onPress={() => setShowGoalsModal(true)}
            >
              <Icon name="flag" size={32} color="#4ECDC4" />
              <Text className="text-text-primary dark:text-dark-text-primary" style={styles.quickActionTitle}>
                Manage Goals
              </Text>
              <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.quickActionSubtitle}>
                Track progress
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Goals Modal */}
      <GoalsModal
        visible={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
      />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
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
  quickActionsSection: {
    marginTop: 30,
    paddingHorizontal: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    padding: 20,
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
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default StatisticsScreen;