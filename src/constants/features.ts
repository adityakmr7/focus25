export const FEATURES = {
  // Free features (no restrictions)
  BASIC_TIMER: 'basic_timer',
  LOCAL_TODOS: 'local_todos',
  BASIC_STATS: 'basic_stats',
  BASIC_THEMES: 'basic_themes',
  LOCAL_STORAGE: 'local_storage',
  BASIC_NOTIFICATIONS: 'basic_notifications',
  
  // Pro features (requires payment)
  CLOUD_SYNC: 'cloud_sync',
  MUSIC_LIBRARY: 'music_library',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  ADVANCED_THEMES: 'advanced_themes',
  PRIORITY_SUPPORT: 'priority_support',
  CROSS_DEVICE_CONTINUITY: 'cross_device_continuity',
  
  // Auth-required features (requires account but not necessarily Pro)
  ACCOUNT_MANAGEMENT: 'account_management',
  DATA_BACKUP: 'data_backup',
} as const;

export type FeatureName = typeof FEATURES[keyof typeof FEATURES];

export const PRO_FEATURES: FeatureName[] = [
  FEATURES.CLOUD_SYNC,
  FEATURES.MUSIC_LIBRARY,
  FEATURES.ADVANCED_ANALYTICS,
  FEATURES.ADVANCED_THEMES,
  FEATURES.PRIORITY_SUPPORT,
  FEATURES.CROSS_DEVICE_CONTINUITY,
];

export const AUTH_REQUIRED_FEATURES: FeatureName[] = [
  FEATURES.ACCOUNT_MANAGEMENT,
  FEATURES.DATA_BACKUP,
  ...PRO_FEATURES,
];

export const FEATURE_DESCRIPTIONS = {
  [FEATURES.CLOUD_SYNC]: {
    title: 'Cloud Sync',
    description: 'Sync your data across all devices automatically',
    icon: '☁️',
    benefit: 'Never lose your progress again',
  },
  [FEATURES.MUSIC_LIBRARY]: {
    title: 'Focus Music Library',
    description: 'Access premium ambient sounds and focus music',
    icon: '🎵',
    benefit: 'Enhanced focus with curated soundscapes',
  },
  [FEATURES.ADVANCED_ANALYTICS]: {
    title: 'Advanced Analytics',
    description: 'Detailed insights into your productivity patterns',
    icon: '📊',
    benefit: 'Understand and optimize your focus habits',
  },
  [FEATURES.ADVANCED_THEMES]: {
    title: 'Premium Themes',
    description: 'Unlock beautiful custom themes and timer styles',
    icon: '🎨',
    benefit: 'Personalize your focus environment',
  },
  [FEATURES.CROSS_DEVICE_CONTINUITY]: {
    title: 'Cross-Device Sessions',
    description: 'Start on phone, continue on tablet seamlessly',
    icon: '🔄',
    benefit: 'Focus anywhere, anytime',
  },
} as const;