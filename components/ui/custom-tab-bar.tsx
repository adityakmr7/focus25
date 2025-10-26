import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, TouchableOpacity, View } from "react-native";
import { Box, HStack, SPACING, useTheme } from "react-native-heroui";
import Animated from "react-native-reanimated";
import TypographyText from "../TypographyText";

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onFabPress?: () => void;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  onFabPress,
}) => {
  const { theme } = useTheme();

  const renderTabItem = (route: any, index: number) => {
    const { options } = descriptors[route.key];
    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
          ? options.title
          : route.name;

    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Animated.View key={route.key}>
        <TouchableOpacity
          onPress={onPress}
          style={{
            flex: 1,
            paddingVertical: SPACING["unit-2"],
            paddingHorizontal: 16,
            borderRadius: 20,
            backgroundColor: isFocused
              ? theme.colors.background
              : theme.colors.foreground,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            minHeight: 40,
            transform: [{ scale: isFocused ? 1 : 0.95 }],
          }}
          activeOpacity={0.7}
        >
          {options.tabBarIcon && (
            <View style={{ marginBottom: 2 }}>
              {options.tabBarIcon({
                focused: isFocused,
                color: isFocused
                  ? theme.colors.foreground
                  : theme.colors.background,
                size: 20,
              })}
            </View>
          )}
          {isFocused && (
            <TypographyText
              variant="caption"
              color="default"
              style={{
                fontSize: 10,
                marginHorizontal: SPACING["unit-1.5"],
                fontWeight: "500",
                color: theme.colors.foreground,
              }}
            >
              {label}
            </TypographyText>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <HStack
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      gap="md"
      style={{
        width: Dimensions.get("window").width,
        backgroundColor: "red",
      }}
    >
      <View
        style={{
          position: "absolute",
          bottom: 40,
          left: 20,
          right: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: Dimensions.get("window").width * 0.6,
        }}
      >
        {/* Main Tab Bar */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.colors.foreground,
            borderRadius: 25,
            padding: SPACING["unit-2"],
            flex: 1,
            marginRight: 12,
            shadowColor: theme.colors.foreground,
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {state.routes.map((route: any, index: number) =>
            renderTabItem(route, index)
          )}
        </View>
      </View>

      <Box
        style={{
          backgroundColor: theme.colors.foreground,
          position: "absolute",
          bottom: 45,
          right: 20,
        }}
        borderRadius="full"
        p="md"
      >
        <TouchableOpacity onPress={onFabPress}>
          <Ionicons name="add" size={24} color={theme.colors.background} />
        </TouchableOpacity>
      </Box>
    </HStack>
  );
};

export default CustomTabBar;
