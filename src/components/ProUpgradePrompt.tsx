import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { FeatureName, FEATURE_DESCRIPTIONS, PRO_FEATURES } from '../constants/features';
import { useAuthStore } from '../store/authStore';
import { signInWithGoogle, signInWithApple } from '../config/firebase';
import { upgradeUserToPro } from '../config/firebase';

interface ProUpgradePromptProps {
  feature: FeatureName;
  featureInfo: typeof FEATURE_DESCRIPTIONS[FeatureName] | null;
  needsAuth: boolean;
  fallback?: React.ReactNode;
}

export const ProUpgradePrompt: React.FC<ProUpgradePromptProps> = ({
  feature,
  featureInfo,
  needsAuth,
  fallback,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, setUser } = useAuthStore();

  const handleUpgrade = async () => {
    setIsLoading(true);
    
    try {
      // If user needs to sign in first
      if (needsAuth) {
        // For now, try Google sign in. You can add platform detection here
        const result = await signInWithGoogle();
        if (!result.success) {
          Alert.alert('Sign In Failed', 'Please try again');
          setIsLoading(false);
          return;
        }
      }

      // For demo purposes, we'll simulate Pro upgrade
      // In production, integrate with your payment system (Stripe, IAP, etc.)
      if (user?.uid) {
        const success = await upgradeUserToPro(user.uid);
        if (success) {
          // Update local user state
          setUser({ ...user, isPro: true });
          Alert.alert('Welcome to Pro!', 'You now have access to all premium features.');
          setShowModal(false);
        } else {
          Alert.alert('Upgrade Failed', 'Please try again');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInOnly = async () => {
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        setShowModal(false);
      } else {
        Alert.alert('Sign In Failed', 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ProFeaturesList = () => (
    <View className="mb-6">
      <Text className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Pro Features Include:
      </Text>
      {PRO_FEATURES.map((proFeature) => {
        const info = FEATURE_DESCRIPTIONS[proFeature];
        if (!info) return null;
        
        return (
          <View key={proFeature} className="flex-row items-center mb-3">
            <Text className="text-2xl mr-3">{info.icon}</Text>
            <View className="flex-1">
              <Text className="font-medium text-gray-800 dark:text-gray-200">
                {info.title}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {info.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  return (
    <View>
      {/* Inline prompt */}
      <View className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        {featureInfo && (
          <View className="flex-row items-center mb-3">
            <Text className="text-3xl mr-3">{featureInfo.icon}</Text>
            <View className="flex-1">
              <Text className="font-semibold text-gray-800 dark:text-gray-200">
                {featureInfo.title}
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {featureInfo.benefit}
              </Text>
            </View>
          </View>
        )}
        
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg py-3 px-4 mb-2"
        >
          <Text className="text-white font-semibold text-center">
            {needsAuth ? 'Sign In & Upgrade to Pro' : 'Upgrade to Pro'}
          </Text>
        </TouchableOpacity>
        
        {fallback && (
          <TouchableOpacity className="py-2">
            <Text className="text-gray-500 text-center text-sm">Maybe later</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Full screen modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white dark:bg-gray-900">
          <ScrollView className="flex-1 px-6 pt-12">
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Unlock Pro Features
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-center">
                Take your productivity to the next level
              </Text>
            </View>

            {/* Current feature highlight */}
            {featureInfo && (
              <View className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8 border border-blue-200 dark:border-blue-800">
                <View className="flex-row items-center mb-3">
                  <Text className="text-4xl mr-4">{featureInfo.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      {featureInfo.title}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400">
                      {featureInfo.benefit}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-gray-700 dark:text-gray-300">
                  {featureInfo.description}
                </Text>
              </View>
            )}

            {/* All Pro features */}
            <ProFeaturesList />

            {/* Pricing */}
            <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6">
              <Text className="text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                $4.99/month
              </Text>
              <Text className="text-center text-gray-600 dark:text-gray-400 mb-4">
                7-day free trial • Cancel anytime
              </Text>
              <View className="items-center">
                <Text className="text-xs text-gray-500">
                  ⭐ Join 10,000+ focused professionals
                </Text>
              </View>
            </View>

            {/* Action buttons */}
            <View className="pb-8">
              <TouchableOpacity
                onPress={handleUpgrade}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl py-4 mb-3"
              >
                <Text className="text-white font-semibold text-center text-lg">
                  {isLoading ? 'Processing...' : needsAuth ? 'Sign In & Start Free Trial' : 'Start Free Trial'}
                </Text>
              </TouchableOpacity>

              {needsAuth && (
                <TouchableOpacity
                  onPress={handleSignInOnly}
                  disabled={isLoading}
                  className="border border-gray-300 dark:border-gray-600 rounded-xl py-4 mb-3"
                >
                  <Text className="text-gray-700 dark:text-gray-300 font-medium text-center">
                    Just Sign In (Free Account)
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="py-3"
              >
                <Text className="text-gray-500 text-center">Maybe later</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};