import TypographyText from "@/components/TypographyText";
import { usePomodoroStore } from "@/stores/pomodoro-store";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-heroui";

const SessionCounter: React.FC = () => {
  const { theme } = useTheme();
  const { currentSession, totalSessions, timerPhase } = usePomodoroStore();

  // Show "Break" during break phases, session counter during focus
  const isBreakPhase =
    timerPhase === "shortBreak" || timerPhase === "longBreak";

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <TypographyText variant="label" color="secondary" style={styles.label}>
        {isBreakPhase ? "Break" : "Session"}
      </TypographyText>
      <TypographyText variant="heading" color="default" style={styles.counter}>
        {isBreakPhase ? "Time" : `${currentSession} of ${totalSessions}`}
      </TypographyText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  counter: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
  },
});

export default SessionCounter;
