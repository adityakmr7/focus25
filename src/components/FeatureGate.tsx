import React from 'react';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { FeatureName } from '../constants/features';
import { ProUpgradePrompt } from './ProUpgradePrompt';
import { AuthPrompt } from './AuthPrompt';

interface FeatureGateProps {
  feature: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showPrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showPrompt = true,
}) => {
  const { checkFeatureAccess, getFeatureInfo } = useFeatureAccess();
  const access = checkFeatureAccess(feature);
  const featureInfo = getFeatureInfo(feature);

  // If user can access the feature, render children
  if (access.canUse) {
    return <>{children}</>;
  }

  // If user wants to hide prompts, show fallback or nothing
  if (!showPrompt) {
    return <>{fallback || null}</>;
  }

  // Show appropriate prompt based on what's needed
  // if (access.needsPro) {
  //   return (
  //     <ProUpgradePrompt
  //       feature={feature}
  //       featureInfo={featureInfo}
  //       needsAuth={access.needsAuth}
  //       fallback={fallback}
  //     />
  //   );
  // }

  // if (access.needsAuth) {
  //   return (
  //     <AuthPrompt
  //       feature={feature}
  //       featureInfo={featureInfo}
  //       fallback={fallback}
  //     />
  //   );
  // }

  // Fallback for any other case
  return <>{fallback || null}</>;
};