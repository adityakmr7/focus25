import { TimerStatus } from "@/stores/pomodoro-store";
import { Ionicons as Icon } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "react-native-heroui";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

interface PomodoroControlsProps {
  onReset: () => void;
  onPlayPause: () => void;
  onSkip: () => void;
  buttonScale: Animated.SharedValue<number>;
  timerStatus: TimerStatus;
}

export default function PomodoroControls({
  onReset,
  onPlayPause,
  onSkip,
  buttonScale,
  timerStatus,
}: PomodoroControlsProps) {
  const { theme } = useTheme();

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Determine which icon to show based on timer status
  const getPlayPauseIcon = () => {
    if (timerStatus === "running") {
      return "pause";
    }
    return "play";
  };

  return (
    <View style={styles.controlsContainer}>
      <Animated.View style={buttonAnimatedStyle}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme.colors.foreground,
            },
          ]}
          onPress={onReset}
        >
          <Icon name="refresh" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={buttonAnimatedStyle}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme.colors.foreground,
            },
          ]}
          onPress={onPlayPause}
        >
          <View style={styles.iconContainer}>
            <Icon
              name={getPlayPauseIcon()}
              size={24}
              color={theme.colors.background}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={buttonAnimatedStyle}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: theme.colors.foreground,
            },
          ]}
          onPress={onSkip}
        >
          <Icon
            name="play-skip-forward"
            size={24}
            color={theme.colors.background}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsContainer: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 120,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
