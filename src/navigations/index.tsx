import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatisticsScreen from '../screens/StatisticsScreen';
import { Ionicons } from '@expo/vector-icons';
import FlowTimerScreen from '../screens/FlowTimerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FlowAnalyticsScreen from '../screens/FlowAnalyticsScreen';
import ThemeCustomizationScreen from '../screens/ThemeCustomizationScreen';
import { useTheme } from '../providers/ThemeProvider';

type AppTabParamList = {
    Statistics: undefined;
    FlowTimer: undefined;
    Settings: undefined;
};

type AppStackParamList = {
    Root: undefined;
    FlowAnalytics: undefined;
    ThemeCustomization: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const AppTabNavigation = () => {
    const { theme, isDark } = useTheme();

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
                    height: 80,
                },
                tabBarLabelStyle: {
                    display: 'none',
                },
            })}
            initialRouteName="FlowTimer"
        >
            <Tab.Screen name="Statistics" component={StatisticsScreen} />
            <Tab.Screen name="FlowTimer" component={FlowTimerScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

const AppStackNavigation = () => {
    const { theme } = useTheme();

    return (
        <Stack.Navigator
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
