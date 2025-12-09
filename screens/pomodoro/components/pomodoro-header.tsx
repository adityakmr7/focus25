import TypographyText from "@/components/TypographyText";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SPACING } from "@/constants/spacing";

export default function PomodoroHeader() {
  return (
    <View style={styles.header}>
      <TypographyText variant="heading" color="default" style={styles.title}>
        TRACK YOUR{"\n"}FOCUS TIME
      </TypographyText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: SPACING["unit-10"],
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
});
