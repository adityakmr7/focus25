import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../hooks/useTheme';
import {
  Button,
  BottomSheet,
  BottomSheetHeader,
  BottomSheetContent,
  BottomSheetFooter,
} from '../design-system';
import { signInWithGoogle, signInWithApple } from '../config/firebase';
import { proFeatureService } from '../services/proFeatureService';
import { useAuthStore } from '../store/authStore';

interface ProUpgradeBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ProUpgradeBottomSheet: React.FC<ProUpgradeBottomSheetProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const { updateUserProfile } = useAuthStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const bottomSheetRef = useRef(null);

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signInWithGoogle();
      if (result.success && result.user) {
        // After successful sign-in, upgrade to Pro
        const upgradeResult = await proFeatureService.upgradeUserToPro();
        if (upgradeResult.success) {
          updateUserProfile({ isPro: true });
          Alert.alert(
            'Upgrade Successful',
            'Welcome to Pro! All premium features are now unlocked.'
          );
          onSuccess?.();
          onClose();
        } else {
          Alert.alert('Upgrade Failed', upgradeResult.message);
        }
      } else {
        Alert.alert(
          'Sign In Failed',
          'Failed to sign in with Google. Please try again.'
        );
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert(
        'Sign In Error',
        'An error occurred during sign in. Please try again.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAuthenticating(true);
    try {
      const result = await signInWithApple();
      if (result.success && result.user) {
        // After successful sign-in, upgrade to Pro
        const upgradeResult = await proFeatureService.upgradeUserToPro();
        if (upgradeResult.success) {
          updateUserProfile({ isPro: true });
          Alert.alert(
            'Upgrade Successful',
            'Welcome to Pro! All premium features are now unlocked.'
          );
          onSuccess?.();
          onClose();
        } else {
          Alert.alert('Upgrade Failed', upgradeResult.message);
        }
      } else if (result.cancelled) {
        // User cancelled, don't show error
        return;
      } else {
        Alert.alert(
          'Sign In Failed',
          result.error || 'Failed to sign in with Apple. Please try again.'
        );
      }
    } catch (error) {
      console.error('Apple sign-in error:', error);
      Alert.alert(
        'Sign In Error',
        'An error occurred during Apple sign in. Please try again.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleClose = () => {
    if (!isAuthenticating) {
      onClose();
    }
  };

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={['50%', '90%']}
      index={0}
      enablePanDownToClose={true}
      onChange={handleSheetChanges}
      onClose={handleClose}
      style={{
        flex: 1,
      }}
    >
      <BottomSheetHeader
        title='Upgrade to Pro'
        subtitle='Unlock all premium features and enhance your productivity'
        leftIcon='diamond'
        showCloseButton={true}
        onClose={handleClose}
      />

      <BottomSheetContent
        style={{
          flex: 1,
        }}
      >
        {/* Features List */}

        {/* Authentication Options */}
        <View style={styles.authContainer}>
          {/* Google Sign In */}
          <Button
            variant='outline'
            size='lg'
            fullWidth
            onPress={handleGoogleSignIn}
            disabled={isAuthenticating}
            leftIcon='logo-google'
            style={styles.authButton}
          >
            {isAuthenticating ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {/* Apple Sign In */}
          {Platform.OS === 'ios' && (
            <View style={styles.appleContainer}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={8}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            </View>
          )}
        </View>
      </BottomSheetContent>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  featuresContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  authContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 100,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  authButton: {
    marginBottom: 12,
  },
  appleContainer: {
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
