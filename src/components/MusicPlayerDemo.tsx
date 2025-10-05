import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeatureGate } from './FeatureGate';
import { FEATURES } from '../constants/features';

interface MusicPlayerDemoProps {
  onPress?: () => void;
}

export const MusicPlayerDemo: React.FC<MusicPlayerDemoProps> = ({
  onPress,
}) => {
  return (
    <FeatureGate
      feature={FEATURES.MUSIC_LIBRARY}
      fallback={
        <View className='bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mx-4 my-2'>
          <View className='flex-row items-center justify-between'>
            <View className='flex-row items-center flex-1'>
              <Ionicons
                name='musical-notes-outline'
                size={24}
                className='text-gray-400 mr-3'
              />
              <View className='flex-1'>
                <Text className='font-semibold text-gray-500'>Focus Music</Text>
                <Text className='text-sm text-gray-400'>
                  Unlock premium sounds
                </Text>
              </View>
            </View>
            <Ionicons name='lock-closed' size={20} className='text-gray-400' />
          </View>
        </View>
      }
    >
      <TouchableOpacity
        onPress={onPress}
        className='bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mx-4 my-2'
      >
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center flex-1'>
            <Ionicons
              name='musical-notes'
              size={24}
              className='text-blue-600 dark:text-blue-400 mr-3'
            />
            <View className='flex-1'>
              <Text className='font-semibold text-gray-800 dark:text-gray-200'>
                Focus Music
              </Text>
              <Text className='text-sm text-gray-600 dark:text-gray-400'>
                Choose from premium soundscapes
              </Text>
            </View>
          </View>
          <Ionicons
            name='chevron-forward'
            size={20}
            className='text-gray-400'
          />
        </View>
      </TouchableOpacity>
    </FeatureGate>
  );
};
