import auth from '@react-native-firebase/auth';
import { getUserProfile, checkUserProStatus, upgradeUserToPro } from '../config/firebase';

export interface ProFeature {
    id: string;
    name: string;
    description: string;
    category: 'sync' | 'analytics' | 'customization' | 'productivity';
    isPro: boolean;
}

export const PRO_FEATURES: ProFeature[] = [
    {
        id: 'cloud_sync',
        name: 'Cloud Sync',
        description: 'Sync your data across all devices',
        category: 'sync',
        isPro: true,
    },
    {
        id: 'advanced_analytics',
        name: 'Advanced Analytics',
        description: 'Detailed productivity insights and reports',
        category: 'analytics',
        isPro: true,
    },
    {
        id: 'unlimited_themes',
        name: 'Unlimited Themes',
        description: 'Access to all premium themes and customizations',
        category: 'customization',
        isPro: true,
    },
    {
        id: 'extended_history',
        name: 'Extended History',
        description: 'Access to unlimited historical data',
        category: 'analytics',
        isPro: true,
    },
    {
        id: 'export_data',
        name: 'Export Data',
        description: 'Export your data in various formats',
        category: 'productivity',
        isPro: true,
    },
    {
        id: 'priority_support',
        name: 'Priority Support',
        description: 'Get priority customer support',
        category: 'productivity',
        isPro: true,
    },
];

class ProFeatureService {
    private userProStatus: boolean = false;
    private proStatusChecked: boolean = false;

    constructor() {
        this.initialize();
    }

    private async initialize() {
        // Listen to auth state changes
        auth().onAuthStateChanged(async (user) => {
            if (user) {
                await this.checkProStatus();
            } else {
                this.userProStatus = false;
                this.proStatusChecked = false;
            }
        });
    }

    async checkProStatus(): Promise<boolean> {
        try {
            const user = auth().currentUser;
            if (!user) {
                this.userProStatus = false;
                this.proStatusChecked = true;
                return false;
            }

            const isProUser = await checkUserProStatus(user.uid);
            this.userProStatus = isProUser;
            this.proStatusChecked = true;
            
            return isProUser;
        } catch (error) {
            console.error('Error checking Pro status:', error);
            this.userProStatus = false;
            this.proStatusChecked = true;
            return false;
        }
    }

    isProUser(): boolean {
        return this.userProStatus;
    }

    isFeatureAvailable(featureId: string): boolean {
        const feature = PRO_FEATURES.find(f => f.id === featureId);
        if (!feature) {
            return true; // If feature not found, assume it's available
        }

        if (!feature.isPro) {
            return true; // Free feature
        }

        return this.isProUser(); // Pro feature requires pro status
    }

    async upgradeUserToPro(): Promise<{ success: boolean; message: string }> {
        try {
            const user = auth().currentUser;
            if (!user) {
                return {
                    success: false,
                    message: 'Please sign in to upgrade to Pro',
                };
            }

            const success = await upgradeUserToPro(user.uid);
            if (success) {
                this.userProStatus = true;
                return {
                    success: true,
                    message: 'Congratulations! You are now a Pro user!',
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to upgrade to Pro. Please try again.',
                };
            }
        } catch (error) {
            console.error('Error upgrading to Pro:', error);
            return {
                success: false,
                message: 'An error occurred while upgrading to Pro.',
            };
        }
    }

    getProFeatures(): ProFeature[] {
        return PRO_FEATURES.filter(f => f.isPro);
    }

    getFreeFeatures(): ProFeature[] {
        return PRO_FEATURES.filter(f => !f.isPro);
    }

    getFeaturesByCategory(category: ProFeature['category']): ProFeature[] {
        return PRO_FEATURES.filter(f => f.category === category);
    }

    getUnavailableFeatures(): ProFeature[] {
        if (this.isProUser()) {
            return []; // All features available for Pro users
        }
        return this.getProFeatures();
    }

    showProUpgradePrompt(featureId: string): {
        title: string;
        message: string;
        feature: ProFeature | null;
    } {
        const feature = PRO_FEATURES.find(f => f.id === featureId);
        
        if (!feature) {
            return {
                title: 'Feature Not Available',
                message: 'This feature is not available.',
                feature: null,
            };
        }

        return {
            title: 'Pro Feature',
            message: `${feature.name} is a Pro feature. ${feature.description}\n\nUpgrade to Pro to unlock this and other premium features!`,
            feature,
        };
    }

    // Helper method to check if pro status has been loaded
    isProStatusLoaded(): boolean {
        return this.proStatusChecked;
    }

    // Force refresh pro status
    async refreshProStatus(): Promise<boolean> {
        this.proStatusChecked = false;
        return await this.checkProStatus();
    }
}

export const proFeatureService = new ProFeatureService();

// Helper functions for common feature checks
export const canUseCloudSync = (): boolean => {
    return proFeatureService.isFeatureAvailable('cloud_sync');
};

export const canUseAdvancedAnalytics = (): boolean => {
    return proFeatureService.isFeatureAvailable('advanced_analytics');
};

export const canUseUnlimitedThemes = (): boolean => {
    return proFeatureService.isFeatureAvailable('unlimited_themes');
};

export const canExportData = (): boolean => {
    return proFeatureService.isFeatureAvailable('export_data');
};

export const canUseExtendedHistory = (): boolean => {
    return proFeatureService.isFeatureAvailable('extended_history');
};