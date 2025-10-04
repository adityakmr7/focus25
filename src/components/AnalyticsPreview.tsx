import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeatureGate } from './FeatureGate';
import { FEATURES } from '../constants/features';

interface AnalyticsPreviewProps {
  onPress?: () => void;
  completedSessions?: number;
  totalFocusTime?: number;
}

export const AnalyticsPreview: React.FC<AnalyticsPreviewProps> = ({ 
  onPress, 
  completedSessions = 0, 
  totalFocusTime = 0 
}) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <FeatureGate 
      feature={FEATURES.ADVANCED_ANALYTICS}
      fallback={
        <View className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 mx-4 my-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="font-semibold text-gray-800 dark:text-gray-200">
              📊 Your Progress
            </Text>
            <View className="bg-purple-100 dark:bg-purple-800 px-2 py-1 rounded-full">
              <Text className="text-xs font-medium text-purple-700 dark:text-purple-300">
                PRO
              </Text>
            </View>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {completedSessions}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Sessions today
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {formatTime(totalFocusTime)}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Focus time
              </Text>
            </View>
          </View>
          
          <View className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3">
            <View className="flex-row items-center justify-center">
              <Ionicons name="lock-closed" size={16} className="text-gray-500 mr-2" />
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Upgrade to see detailed insights
              </Text>
            </View>
          </View>
        </View>
      }
    >
      <TouchableOpacity 
        onPress={onPress}
        className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 mx-4 my-2"
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-gray-800 dark:text-gray-200">
            📊 Your Progress
          </Text>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            className="text-gray-400" 
          />
        </View>
        
        <View className="flex-row justify-between mb-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {completedSessions}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Sessions today
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {formatTime(totalFocusTime)}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              Focus time
            </Text>
          </View>
        </View>
        
        <View className="bg-blue-100 dark:bg-blue-800 rounded-lg p-3">
          <Text className="text-sm font-medium text-blue-800 dark:text-blue-200 text-center">
            View detailed analytics →
          </Text>
        </View>
      </TouchableOpacity>
    </FeatureGate>
  );
};