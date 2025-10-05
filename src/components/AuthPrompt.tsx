import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { FeatureName, FEATURE_DESCRIPTIONS } from '../constants/features';
import { signInWithGoogle, signInWithApple } from '../config/firebase';
import { Platform } from 'react-native';

interface AuthPromptProps {
  feature: FeatureName;
  featureInfo: (typeof FEATURE_DESCRIPTIONS)[FeatureName] | null;
  fallback?: React.ReactNode;
}

export const AuthPrompt: React.FC<AuthPromptProps> = ({
  featureInfo,
  fallback,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        setShowModal(false);
        Alert.alert(
          'Welcome!',
          "You're now signed in and can access this feature."
        );
      } else {
        Alert.alert('Sign In Failed', 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithApple();
      if (result.success) {
        setShowModal(false);
        Alert.alert(
          'Welcome!',
          "You're now signed in and can access this feature."
        );
      } else if (!result.cancelled) {
        Alert.alert('Sign In Failed', result.error || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View>
      {/* Inline prompt */}
      <View className='bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800'>
        {featureInfo && (
          <View className='flex-row items-center mb-3'>
            <Text className='text-3xl mr-3'>{featureInfo.icon}</Text>
            <View className='flex-1'>
              <Text className='font-semibold text-gray-800 dark:text-gray-200'>
                {featureInfo.title}
              </Text>
              <Text className='text-sm text-gray-600 dark:text-gray-400'>
                Sign in to access this feature
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className='bg-blue-500 rounded-lg py-3 px-4 mb-2'
        >
          <Text className='text-white font-semibold text-center'>
            Sign In to Continue
          </Text>
        </TouchableOpacity>

        {fallback && (
          <TouchableOpacity className='py-2'>
            <Text className='text-gray-500 text-center text-sm'>
              Maybe later
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sign in modal */}
      <Modal
        visible={showModal}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <View className='flex-1 bg-white dark:bg-gray-900'>
          <View className='flex-1 px-6 pt-12'>
            {/* Header */}
            <View className='items-center mb-8'>
              <Text className='text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2'>
                Sign In Required
              </Text>
              <Text className='text-gray-600 dark:text-gray-400 text-center'>
                Create a free account to access this feature
              </Text>
            </View>

            {/* Feature info */}
            {featureInfo && (
              <View className='bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8 border border-blue-200 dark:border-blue-800'>
                <View className='flex-row items-center mb-3'>
                  <Text className='text-4xl mr-4'>{featureInfo.icon}</Text>
                  <View className='flex-1'>
                    <Text className='text-xl font-semibold text-gray-800 dark:text-gray-200'>
                      {featureInfo.title}
                    </Text>
                    <Text className='text-gray-600 dark:text-gray-400'>
                      {featureInfo.benefit}
                    </Text>
                  </View>
                </View>
                <Text className='text-sm text-gray-700 dark:text-gray-300'>
                  {featureInfo.description}
                </Text>
              </View>
            )}

            {/* Benefits of signing in */}
            <View className='mb-8'>
              <Text className='text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200'>
                Why create an account?
              </Text>
              <View className='space-y-3'>
                <View className='flex-row items-center'>
                  <Text className='text-xl mr-3'>💾</Text>
                  <Text className='flex-1 text-gray-700 dark:text-gray-300'>
                    Keep your data safe and secure
                  </Text>
                </View>
                <View className='flex-row items-center'>
                  <Text className='text-xl mr-3'>🔄</Text>
                  <Text className='flex-1 text-gray-700 dark:text-gray-300'>
                    Sync across all your devices
                  </Text>
                </View>
                <View className='flex-row items-center'>
                  <Text className='text-xl mr-3'>🎯</Text>
                  <Text className='flex-1 text-gray-700 dark:text-gray-300'>
                    Personalized experience
                  </Text>
                </View>
              </View>
            </View>

            {/* Sign in buttons */}
            <View className='space-y-3 mb-6'>
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                className='bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl py-4 flex-row items-center justify-center'
              >
                <Text className='text-xl mr-3'>🔍</Text>
                <Text className='text-gray-700 dark:text-gray-300 font-medium'>
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  onPress={handleAppleSignIn}
                  disabled={isLoading}
                  className='bg-black dark:bg-white rounded-xl py-4 flex-row items-center justify-center'
                >
                  <Text className='text-xl mr-3'>🍎</Text>
                  <Text className='text-white dark:text-black font-medium'>
                    {isLoading ? 'Signing in...' : 'Continue with Apple'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Privacy note */}
            <Text className='text-xs text-gray-500 text-center mb-6'>
              We&apos;ll never share your information or send spam. Your privacy
              is important to us.
            </Text>

            {/* Close button */}
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              className='py-4'
            >
              <Text className='text-gray-500 text-center'>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
