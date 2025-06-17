import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import StatisticsChart from "../components/StatisticsChart";
import { useStatisticsStore } from "../store/statisticsStore";
import { usePomodoroStore } from '../store/pomodoroStore';
import { FlowMetrics } from '../components/FlowMetrics';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = {
  AllSessions: undefined;
  FlowAnalytics: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StatisticsScreenProps {
  navigation: NavigationProp;
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

interface StatisticsData {
  totalCount: number;
  flows: FlowStats;
  breaks: BreakStats;
  interruptions: number;
}

type PeriodType = "D" | "W" | "M" | "Y";

interface StatRowProps {
  label: string;
  value: number;
}

const StatisticsScreen: React.FC<StatisticsScreenProps> = () => {
  const {
    selectedPeriod,
    currentDate,
    loadStatistics,
    totalCount,
    flows,
    breaks,
    interruptions,
  } = useStatisticsStore();
  const navigation = useNavigation<NavigationProp>();

  const StatRow: React.FC<StatRowProps> = ({ label, value }) => (
    <View style={styles.statRow}>
      <Text
        className={"text-text-primary dark:text-dark-text-primary"}
        style={styles.statLabel}
      >
        {label}
      </Text>
      <Text
        className={"text-text-secondary dark:text-dark-text-secondary"}
        style={styles.statValue}
      >
        {value}
      </Text>
    </View>
  );

  const StatCard: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
  }) => (
    <View className={"bg-bg-200 dark:bg-dark-bg-200"} style={styles.statCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      className={"bg-bg-100 dark:bg-dark-bg-100"}
      style={styles.container}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text
          className={"color-text-primary dark:color-text-primary"}
          style={styles.headerTitle}
        >
          Statistics
        </Text>
        {/* Chart */}
        <StatisticsChart />
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="list" size={24} color="#4CAF50" />
            <Text
              className={"text-text-primary dark:text-dark-text-primary"}
              style={styles.actionButtonText}
            >
              Sessions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="share" size={24} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <StatCard title="Flows">
          <StatRow label="Started" value={flows.started} />
          <StatRow label="Completed" value={flows.completed} />
          <StatRow label="Minutes" value={flows.minutes} />
        </StatCard>

        <StatCard title="Breaks">
          <StatRow label="Started" value={breaks.started} />
          <StatRow label="Completed" value={breaks.completed} />
          <StatRow label="Minutes" value={breaks.minutes} />
        </StatCard>

        <StatCard title="Interruptions">
          <StatRow label="Total" value={interruptions} />
        </StatCard>

        {/* Show All Sessions Button */}
        <TouchableOpacity
          style={styles.showAllButton}
          onPress={() => navigation.navigate("AllSessions")}
        >
          <Text style={styles.showAllText}>Show All Sessions</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>

        {/* Show All Flow Analytics */}
        <TouchableOpacity
          style={styles.showAllButton}
          onPress={() => navigation.navigate("FlowAnalytics")}
        >
          <Text style={styles.showAllText}>Flow Analytics</Text>
          <Icon name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
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
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 30,
  },
  topSection: {
    marginBottom: 20,
  },
  totalCountSection: {
    marginBottom: 20,
  },
  totalCountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  totalCountLabel: {
    fontSize: 16,
    color: "#666",
    marginRight: 5,
  },
  totalCountValue: {
    fontSize: 48,
    fontWeight: "bold",
  },
  flowsText: {
    fontSize: 24,
    fontWeight: "normal",
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 6,
  },
  selectedPeriod: {
    backgroundColor: "#555",
  },
  periodText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  selectedPeriodText: {},
  dateNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "500",
  },
  chartContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  chart: {
    borderRadius: 0,
  },
  actionButtons: {
    flexDirection: "row",
    // justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    minWidth: 100,
    marginRight: 18,
  },
  actionButtonText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: "500",
  },
  statCard: {
    // backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  showAllButton: {
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  showAllText: {
    fontSize: 16,
    fontWeight: "500",
  },
  // FLOW
   title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginVertical: 20,
    },
    adviceSection: {
        margin: 20,
        padding: 20,
        backgroundColor: '#F9FAFB',
   borderRadius: 16,
   borderLeftWidth: 4,
   borderLeftColor: '#10B981',
    },
    adviceTitle: {
   fontSize: 18,
   fontWeight: '600',
   marginBottom: 10,
   color: '#1F2937',
},
adviceText: {
   fontSize: 14,
   lineHeight: 20,
   color: '#6B7280',
   marginBottom: 16,
},
tipsTitle: {
   fontSize: 16,
   fontWeight: '600',
   marginBottom: 8,
   color: '#1F2937',
},
tipText: {
   fontSize: 14,
   lineHeight: 20,
   color: '#6B7280',
   marginBottom: 4,
   paddingLeft: 8,
},
});

export default StatisticsScreen;
