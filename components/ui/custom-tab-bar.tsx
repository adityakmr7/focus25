import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import { Box, HStack, SPACING, useTheme } from 'react-native-heroui';
import Animated from 'react-native-reanimated';
import TypographyText from '../TypographyText';

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
                type: 'tabPress',
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
                        paddingVertical: SPACING['unit-2'],
                        paddingHorizontal: 16,
                        borderRadius: 20,
                        backgroundColor: isFocused
                            ? theme.colors.background
                            : theme.colors.foreground,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                        minHeight: 40,
                        transform: [{ scale: isFocused ? 1 : 0.95 }],
                    }}
                    activeOpacity={0.7}
                >
                    {options.tabBarIcon && (
                        <View style={{ marginBottom: 2 }}>
                            {options.tabBarIcon({
                                focused: isFocused,
                                color: isFocused ? theme.colors.foreground : 'white',
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
                                marginHorizontal: SPACING['unit-1.5'],
                                fontWeight: '500',
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
            justifyContent="space-around"
            alignItems="center"
            gap="md"
            style={{}}
        >
            <View
                style={{
                    bottom: 40,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 40,
                    width: Dimensions.get('window').width * 0.7,
                }}
            >
                {/* Main Tab Bar */}
                <View
                    style={{
                        flexDirection: 'row',
                        backgroundColor: theme.colors.foreground,
                        borderRadius: 30,
                        padding: SPACING['unit-2'],
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
                        height: 60,
                        justifyContent: 'space-around',
                        alignItems: 'center',
                    }}
                >
                    {state.routes.map((route: any, index: number) => renderTabItem(route, index))}
                </View>
            </View>
        </HStack>
    );
};

export default CustomTabBar;
