import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "react-native-heroui";
import Animated from "react-native-reanimated";

interface PomodoroTimerProps {
  timeLeft: number;
  progressValue: Animated.SharedValue<number>;
}

export default function PomodoroTimer({
  timeLeft,
  progressValue,
}: PomodoroTimerProps) {
  const { theme } = useTheme();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.timerContainer}>
      {/* Timer Text */}
      <View style={styles.timerTextContainer}>
        <Text
          style={[styles.timerText, { color: theme.colors["default-800"] }]}
        >
          {formatTime(timeLeft)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    flex: 1,
  },

  timerText: {
    fontSize: 72,
    fontWeight: "800",
    textAlign: "center",
  },
  timerTextContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
