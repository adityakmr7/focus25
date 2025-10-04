import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatisticsScreen from '../screens/StatisticsScreen';
import { Ionicons } from '@expo/vector-icons';
import FlowTimerScreen from '../screens/FlowTimerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FlowAnalyticsScreen from '../screens/FlowAnalyticsScreen';
import ThemeCustomizationScreen from '../screens/ThemeCustomizationScreen';
import MinimalistTodoScreen from '../screens/MinimalistTodoScreen';
import { useThemeStore } from '../store/themeStore';
import { useSettingsStore } from '../store/settingsStore';
import { Text, useColorScheme, View } from 'react-native';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';
import OnboardingScreen from '../screens/OnboardingScreen';

type AppTabParamList = {
    Statistics: undefined;
    FlowTimer: undefined;
    Settings: undefined;
    Todo: undefined;
};

type AppStackParamList = {
    Root: undefined;
    FlowAnalytics: undefined;
    ThemeCustomization: undefined;
    Onboarding: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const AppTabNavigation = () => {
    const { mode, getCurrentTheme } = useThemeStore();
    const { showStatistics } = useSettingsStore();
    const systemColorScheme = useColorScheme();
    const theme = getCurrentTheme();
    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';
    const { isTablet, isLandscape } = useDeviceOrientation();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'bar-chart-outline';

                    if (route.name === 'Statistics') {
                        iconName = 'bar-chart-outline';
                    } else if (route.name === 'FlowTimer') {
                        iconName = 'timer-outline';
                    } else if (route.name === 'Settings') {
                        iconName = 'person-outline';
                    } else if (route.name === 'Todo') {
                        const today = new Date().getDate();
                        return (
                            <View
                                style={{
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minWidth: size,
                                    minHeight: size,
                                    borderRadius: 4,
                                    borderColor: color,
                                    borderWidth: 2,
                                    padding: 1,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        fontWeight: '600',
                                        color: color,
                                    }}
                                >
                                    {today}
                                </Text>
                            </View>
                        );
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.accent,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.surface,
                    borderTopColor: theme.surface,
                    borderTopWidth: 1,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: isTablet ? (isLandscape ? 100 : 90) : 80,
                    paddingHorizontal: isTablet ? (isLandscape ? 60 : 40) : 0,
                },
                tabBarLabelStyle: {
                    display: 'none',
                },
            })}
            initialRouteName="FlowTimer"
        >
            {showStatistics && <Tab.Screen name="Statistics" component={StatisticsScreen} />}
            <Tab.Screen name="Todo" component={MinimalistTodoScreen} />
            <Tab.Screen name="FlowTimer" component={FlowTimerScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

const AppStackNavigation = () => {
    const { mode, getCurrentTheme } = useThemeStore();
    const systemColorScheme = useColorScheme();
    const theme = getCurrentTheme();
    const isDark = mode === 'auto' ? systemColorScheme === 'dark' : mode === 'dark';

    return (
        <Stack.Navigator
            initialRouteName={'Root'}
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.text,
                headerTitleStyle: {
                    fontWeight: '600',
                },
            }}
        >

            <Stack.Screen
                name="Root"
                component={AppTabNavigation}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="FlowAnalytics"
                component={FlowAnalyticsScreen}
                options={{
                    title: 'Focus Analytics',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="ThemeCustomization"
                component={ThemeCustomizationScreen}
                options={{
                    title: 'Theme Customization',
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

export { AppTabNavigation, AppStackNavigation };
