import type { TextStyle } from "react-native";
import type { Theme } from "react-native-heroui";
import { createStyledText } from "react-native-heroui";

export interface TypographyTextProps {
  variant?: "body" | "heading" | "title" | "caption" | "label";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "default";
}

const TypographyText = createStyledText<TypographyTextProps>(
  (theme: Theme) => ({
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSizes.md,
  }),
  (theme: Theme, props: TypographyTextProps): TextStyle => {
    const styles: TextStyle = {};

    // Handle variant
    switch (props.variant) {
      case "heading":
        styles.fontSize = theme.typography.fontSizes["2xl"];
        styles.fontWeight = "700";
        styles.lineHeight = theme.typography.fontSizes["2xl"] * 1.2;
        break;
      case "title":
        styles.fontSize = theme.typography.fontSizes.xl;
        styles.fontWeight = "600";
        styles.lineHeight = theme.typography.fontSizes.xl * 1.3;
        break;
      case "caption":
        styles.fontSize = theme.typography.fontSizes.sm;
        styles.fontWeight = "400";
        styles.opacity = 0.7;
        break;
      case "label":
        styles.fontSize = theme.typography.fontSizes.sm;
        styles.fontWeight = "500";
        break;
      case "body":
      default:
        styles.fontSize = theme.typography.fontSizes.md;
        styles.fontWeight = "400";
    }

    // Handle explicit size override
    if (props.size) {
      styles.fontSize = theme.typography.fontSizes[props.size];
    }

    // Handle weight
    if (props.weight) {
      switch (props.weight) {
        case "normal":
          styles.fontWeight = "400";
          break;
        case "medium":
          styles.fontWeight = "500";
          break;
        case "semibold":
          styles.fontWeight = "600";
          break;
        case "bold":
          styles.fontWeight = "700";
          break;
      }
    }

    // Handle color
    if (props.color) {
      switch (props.color) {
        case "primary":
          styles.color = theme.colors.primary;
          break;
        case "secondary":
          styles.color = theme.colors.secondary;
          break;
        case "success":
          styles.color = theme.colors.success;
          break;
        case "warning":
          styles.color = theme.colors.warning;
          break;
        case "danger":
          styles.color = theme.colors.danger;
          break;
        case "default":
          styles.color = theme.colors.foreground;
          break;
      }
    }

    return styles;
  }
);

export default TypographyText;
