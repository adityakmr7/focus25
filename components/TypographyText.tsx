import React from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useColorTheme } from '@/hooks/useColorTheme';

export interface TypographyTextProps extends TextProps {
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

const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
};

const TypographyText: React.FC<TypographyTextProps> = ({
  variant = "body",
  size,
  weight,
  color = "default",
  style,
  children,
  ...props
}) => {
  const colors = useColorTheme();
  
  const textStyle: TextStyle = {
    color: colors.contentPrimary,
  };

  // Handle variant
  switch (variant) {
    case "heading":
      textStyle.fontSize = FONT_SIZES["2xl"];
      textStyle.fontWeight = "700";
      textStyle.lineHeight = FONT_SIZES["2xl"] * 1.2;
      break;
    case "title":
      textStyle.fontSize = FONT_SIZES.xl;
      textStyle.fontWeight = "600";
      textStyle.lineHeight = FONT_SIZES.xl * 1.3;
      break;
    case "caption":
      textStyle.fontSize = FONT_SIZES.sm;
      textStyle.fontWeight = "400";
      textStyle.opacity = 0.7;
      break;
    case "label":
      textStyle.fontSize = FONT_SIZES.sm;
      textStyle.fontWeight = "500";
      break;
    case "body":
    default:
      textStyle.fontSize = FONT_SIZES.md;
      textStyle.fontWeight = "400";
  }

  // Handle explicit size override
  if (size) {
    textStyle.fontSize = FONT_SIZES[size];
  }

  // Handle weight
  if (weight) {
    switch (weight) {
      case "normal":
        textStyle.fontWeight = "400";
        break;
      case "medium":
        textStyle.fontWeight = "500";
        break;
      case "semibold":
        textStyle.fontWeight = "600";
        break;
      case "bold":
        textStyle.fontWeight = "700";
        break;
    }
  }

  // Handle color
  if (color) {
    switch (color) {
      case "primary":
        textStyle.color = colors.secondary;
        break;
      case "secondary":
        textStyle.color = colors.contentSecondary;
        break;
      case "success":
        textStyle.color = colors.secondary;
        break;
      case "warning":
        textStyle.color = "#FFA500";
        break;
      case "danger":
        textStyle.color = colors.danger;
        break;
      case "default":
        textStyle.color = colors.contentPrimary;
        break;
    }
  }

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};

export default TypographyText;
