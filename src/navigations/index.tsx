import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import StatisticsScreen from "../screens/StatisticsScreen";
import {Ionicons} from "@expo/vector-icons";
import FlowTimerScreen from "../screens/FlowTimerScreen";
import SettingsScreen from "../screens/SettingsScreen";

const AppTabNavigation = createBottomTabNavigator({
    screenOptions:({route}) => ({
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

            // You can return any component that you like here!
            return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: {
            display:'none'
        }
    }),
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
    },
});

export {AppTabNavigation, AppStackNavigation};

