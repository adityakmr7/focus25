import TypographyText from "@/components/TypographyText";
import { TodoSection } from "@/utils/dateUtils";
import React from "react";
import { StyleSheet, View } from "react-native";

interface SectionHeaderProps {
  section: TodoSection;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ section }) => {
  return (
    <View style={styles.sectionHeader}>
      <TypographyText
        variant="title"
        color="default"
        style={styles.sectionTitle}
      >
        {section.title}
      </TypographyText>
      <TypographyText
        variant="caption"
        color="secondary"
        style={styles.sectionCount}
      >
        {section.todos.length} {section.todos.length === 1 ? "todo" : "todos"}
      </TypographyText>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.7,
  },
});

export default SectionHeader;
