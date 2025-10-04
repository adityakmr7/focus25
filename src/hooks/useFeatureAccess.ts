import { useAuthStore } from '../store/authStore';
import { 
  FeatureName, 
  PRO_FEATURES, 
  AUTH_REQUIRED_FEATURES,
  FEATURE_DESCRIPTIONS 
} from '../constants/features';

export interface FeatureAccess {
  canUse: boolean;
  needsAuth: boolean;
  needsPro: boolean;
  reason?: string;
}

export const useFeatureAccess = () => {
  const { user } = useAuthStore();
  
  const isAuthenticated = !!user;
  const isPro = user?.isPro || false;

  const checkFeatureAccess = (feature: FeatureName): FeatureAccess => {
    const needsAuth = AUTH_REQUIRED_FEATURES.includes(feature);
    const needsPro = PRO_FEATURES.includes(feature);

    // Free features - always accessible
    if (!needsAuth && !needsPro) {
      return { canUse: true, needsAuth: false, needsPro: false };
    }

    // Auth required but not Pro
    if (needsAuth && !needsPro) {
      if (!isAuthenticated) {
        return {
          canUse: false,
          needsAuth: true,
          needsPro: false,
          reason: 'Sign in required to access this feature',
        };
      }
      return { canUse: true, needsAuth: false, needsPro: false };
    }

    // Pro features
    if (needsPro) {
      if (!isAuthenticated) {
        return {
          canUse: false,
          needsAuth: true,
          needsPro: true,
          reason: 'Sign in and upgrade to Pro to access this feature',
        };
      }
      
      if (!isPro) {
        return {
          canUse: false,
          needsAuth: false,
          needsPro: true,
          reason: 'Upgrade to Pro to access this feature',
        };
      }
      
      return { canUse: true, needsAuth: false, needsPro: false };
    }

    return { canUse: true, needsAuth: false, needsPro: false };
  };

  const getFeatureInfo = (feature: FeatureName) => {
    return FEATURE_DESCRIPTIONS[feature] || null;
  };

  return {
    // User status
    isAuthenticated,
    isPro,
    user,
    
    // Feature checking
    checkFeatureAccess,
    getFeatureInfo,
    
    // Quick access helpers
    canUseCloudSync: checkFeatureAccess('cloud_sync').canUse,
    canUseMusicLibrary: checkFeatureAccess('music_library').canUse,
    canUseAdvancedAnalytics: checkFeatureAccess('advanced_analytics').canUse,
    canUseAdvancedThemes: checkFeatureAccess('advanced_themes').canUse,
  };
};