import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import StatisticsScreen from "../screens/StatisticsScreen";
import {Ionicons} from "@expo/vector-icons";
import FlowTimerScreen from "../screens/FlowTimerScreen";
import SettingsScreen from "../screens/SettingsScreen";
import FlowAnalyticsScreen from "../screens/FlowAnalyticsScreen";
import ThemeCustomizationScreen from "../screens/ThemeCustomizationScreen";
import { useTheme } from "../providers/ThemeProvider";

const AppTabNavigation = createBottomTabNavigator({
    screenOptions:({route}) => {
        const { theme, isDark } = useTheme();
        
        return {
            headerShown:false,
            tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap = 'bar-chart-outline';

                if(route.name ==='StatisticsScreen')  {
                   iconName = 'bar-chart-outline'
                }else if(route.name === 'FlowTimerScreen') {
                    iconName = 'timer-outline'
                }else if(route.name === "SettingsScreen") {
                    iconName = 'person-outline'
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
                display:'none'
            }
        }
    },
    initialRouteName:'FlowTimerScreen',
    screens: {
        StatisticsScreen: StatisticsScreen,
        FlowTimerScreen: FlowTimerScreen,
        SettingsScreen:SettingsScreen,
    },
});

const AppStackNavigation = createNativeStackNavigator({
    screens: {
        Root: {
            screen: AppTabNavigation,
            options:{
                headerShown:false
            }
        },
        FlowAnalytics: {
            screen: FlowAnalyticsScreen,
            options: {
                title:'Focus session'
            }
        },
        ThemeCustomization: {
            screen: ThemeCustomizationScreen,
            options: {
                title: 'Theme Customization',
                headerShown: false
            }
        }
    },
});

export {AppTabNavigation, AppStackNavigation};