import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../providers/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  icon: string;
  color: string;
  features: string[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Flow Focus',
    subtitle: 'Your Journey to Deep Work Begins',
    description: 'Transform your productivity with scientifically-backed focus techniques and personalized insights.',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: 'rocket',
    color: '#4299E1',
    features: [
      'Pomodoro Timer with Smart Adaptation',
      'Real-time Flow State Tracking',
      'Personalized Analytics & Insights',
      'Goal Setting & Achievement System'
    ]
  },
  {
    id: 'timer',
    title: 'Smart Focus Timer',
    subtitle: 'Adaptive Pomodoro Technique',
    description: 'Our intelligent timer adapts to your flow state, extending sessions when you\'re in deep focus and suggesting breaks when needed.',
    image: 'https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: 'timer',
    color: '#48BB78',
    features: [
      'Dynamic session length adjustment',
      'Flow intensity detection',
      'Background timer support',
      'Smart break recommendations'
    ]
  },
  {
    id: 'analytics',
    title: 'Powerful Analytics',
    subtitle: 'Understand Your Productivity',
    description: 'Get detailed insights into your focus patterns, peak performance times, and productivity trends.',
    image: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpg?auto=compress&cs=tinysrgb&w=800',
    icon: 'analytics',
    color: '#9F7AEA',
    features: [
      'Daily, weekly, monthly reports',
      'Flow state analysis',
      'Productivity heatmaps',
      'Goal progress tracking'
    ]
  },
  {
    id: 'goals',
    title: 'Goal Achievement',
    subtitle: 'Turn Dreams into Reality',
    description: 'Set meaningful goals, track your progress, and celebrate achievements with our comprehensive goal system.',
    image: 'https://images.pexels.com/photos/1552617/pexels-photo-1552617.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: 'flag',
    color: '#ED8936',
    features: [
      'SMART goal framework',
      'Progress visualization',
      'Achievement celebrations',
      'Habit formation tracking'
    ]
  },
  {
    id: 'ready',
    title: 'Ready to Focus?',
    subtitle: 'Your Productivity Journey Starts Now',
    description: 'You\'re all set! Let\'s begin your first focus session and start building incredible productivity habits.',
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    icon: 'checkmark-circle',
    color: '#10B981',
    features: [
      'Start your first session',
      'Explore all features',
      'Join the community',
      'Achieve your goals'
    ]
  }
];

interface OnboardingFlowProps {
  visible: boolean;
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ visible, onComplete }) => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const slideAnimation = useSharedValue(0);
  const fadeAnimation = useSharedValue(1);
  const scaleAnimation = useSharedValue(1);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          slideAnimation.value,
          [0, 1],
          [0, -width]
        )
      }
    ]
  }));

  const animatedFadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnimation.value,
    transform: [{ scale: scaleAnimation.value }]
  }));

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      fadeAnimation.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setCurrentStep)(currentStep + 1);
        fadeAnimation.value = withTiming(1, { duration: 300 });
        scaleAnimation.value = withSpring(1, { damping: 15, stiffness: 150 });
      });
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      fadeAnimation.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setCurrentStep)(currentStep - 1);
        fadeAnimation.value = withTiming(1, { duration: 300 });
        scaleAnimation.value = withSpring(1, { damping: 15, stiffness: 150 });
      });
    }
  };

  const skipOnboarding = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding completion:', error);
      onComplete(); // Complete anyway
    }
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: index <= currentStep ? currentStepData.color : theme.surface,
                    width: index === currentStep ? 24 : 8,
                  }
                ]}
              />
            ))}
          </View>
          
          {!isLastStep && (
            <TouchableOpacity onPress={skipOnboarding} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <Animated.ScrollView
          ref={scrollViewRef}
          style={[styles.content, animatedFadeStyle]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: currentStepData.image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={[styles.imageOverlay, { backgroundColor: currentStepData.color + '20' }]}>
              <View style={[styles.iconContainer, { backgroundColor: currentStepData.color }]}>
                <Ionicons name={currentStepData.icon as any} size={32} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>
              {currentStepData.title}
            </Text>
            <Text style={[styles.stepSubtitle, { color: currentStepData.color }]}>
              {currentStepData.subtitle}
            </Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              {currentStepData.description}
            </Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              {currentStepData.features.map((feature, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.featureItem,
                    {
                      opacity: fadeAnimation,
                      transform: [
                        {
                          translateY: interpolate(
                            fadeAnimation.value,
                            [0, 1],
                            [20, 0]
                          )
                        }
                      ]
                    }
                  ]}
                >
                  <View style={[styles.featureBullet, { backgroundColor: currentStepData.color }]} />
                  <Text style={[styles.featureText, { color: theme.text }]}>
                    {feature}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.ScrollView>

        {/* Navigation */}
        <View style={[styles.navigation, { borderTopColor: theme.surface }]}>
          <TouchableOpacity
            onPress={prevStep}
            style={[
              styles.navButton,
              styles.backButton,
              { backgroundColor: theme.surface },
              currentStep === 0 && styles.disabledButton
            ]}
            disabled={currentStep === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={currentStep === 0 ? theme.textSecondary : theme.text} 
            />
            <Text style={[
              styles.navButtonText, 
              { color: currentStep === 0 ? theme.textSecondary : theme.text }
            ]}>
              Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={nextStep}
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: currentStepData.color }
            ]}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={isLastStep ? 'checkmark' : 'chevron-forward'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Utility function to check if onboarding should be shown
export const shouldShowOnboarding = async (): Promise<boolean> => {
  try {
    const completed = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return completed !== 'true';
  } catch (error) {
    console.error('Failed to check onboarding status:', error);
    return true; // Show onboarding if we can't determine status
  }
};

// Utility function to reset onboarding (for testing)
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch (error) {
    console.error('Failed to reset onboarding:', error);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    transition: 'all 0.3s ease',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    height: height * 0.4,
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  textContent: {
    paddingHorizontal: 24,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresContainer: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    gap: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  backButton: {
    flex: 0.4,
  },
  nextButton: {
    flex: 0.6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});