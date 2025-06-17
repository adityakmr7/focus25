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
import { FlowMetrics } from '../components/FlowMetrics';
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
  const headerAnimatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnimatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const headerOpacity = headerAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const headerTranslateY = headerAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

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
            icon="share"
            label="Export Data"
            onPress={() => console.log('Export data')}
            gradient={['#4facfe', '#00f2fe']}
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
              onPress={() => console.log('Set goals')}
            >
              <Icon name="flag" size={32} color="#4ECDC4" />
              <Text className="text-text-primary dark:text-dark-text-primary" style={styles.quickActionTitle}>
                Set Goals
              </Text>
              <Text className="text-text-secondary dark:text-dark-text-secondary" style={styles.quickActionSubtitle}>
                Plan your week
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
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