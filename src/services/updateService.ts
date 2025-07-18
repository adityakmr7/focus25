import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorHandler } from './errorHandler';

export interface AppVersion {
    version: string;
    bundleId: string;
    releaseDate: string;
    releaseNotes: string;
    trackId: number;
    trackViewUrl: string;
    minimumOsVersion: string;
    currentVersionReleaseDate: string;
}

export interface UpdateInfo {
    isUpdateAvailable: boolean;
    currentVersion: string;
    latestVersion: string;
    releaseNotes?: string;
    storeUrl?: string;
    isForceUpdate: boolean;
    releaseDate?: string;
}

const UPDATE_CHECK_KEY = 'last_update_check';
const UPDATE_SKIP_KEY = 'skipped_version';
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export class UpdateService {
    private static instance: UpdateService;
    private isInitialized = false;
    private bundleId: string;
    private currentVersion: string;

    constructor() {
        // Get from app config
        this.bundleId = Platform.OS === 'ios' ? 'com.focus25.app' : 'com.focus25.app';
        this.currentVersion = '1.0.0'; // This should match your app.json version
    }

    static getInstance(): UpdateService {
        if (!UpdateService.instance) {
            UpdateService.instance = new UpdateService();
        }
        return UpdateService.instance;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            console.log('🔄 Initializing update service...');
            this.isInitialized = true;
            console.log('✅ Update service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize update service:', error);
            await errorHandler.logError(error as Error, {
                context: 'UpdateService.initialize',
                severity: 'medium',
            });
        }
    }

    /**
     * Check for app updates using App Store/Play Store API
     */
    async checkForUpdates(forceCheck = false): Promise<UpdateInfo> {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            // Check if we should skip this check
            if (!forceCheck && !(await this.shouldCheckForUpdates())) {
                return {
                    isUpdateAvailable: false,
                    currentVersion: this.currentVersion,
                    latestVersion: this.currentVersion,
                    isForceUpdate: false,
                };
            }

            console.log('🔍 Checking for app updates...');

            const storeInfo = await this.getStoreInfo();
            
            if (!storeInfo) {
                console.log('❌ Could not fetch store info');
                return {
                    isUpdateAvailable: false,
                    currentVersion: this.currentVersion,
                    latestVersion: this.currentVersion,
                    isForceUpdate: false,
                };
            }

            const updateInfo = this.compareVersions(storeInfo);
            
            // Update last check time
            await this.updateLastCheckTime();
            
            if (updateInfo.isUpdateAvailable) {
                console.log('📱 Update available:', updateInfo.latestVersion);
            } else {
                console.log('✅ App is up to date');
            }

            return updateInfo;
        } catch (error) {
            console.error('Failed to check for updates:', error);
            await errorHandler.logError(error as Error, {
                context: 'UpdateService.checkForUpdates',
                severity: 'low',
            });
            
            return {
                isUpdateAvailable: false,
                currentVersion: this.currentVersion,
                latestVersion: this.currentVersion,
                isForceUpdate: false,
            };
        }
    }

    /**
     * Get app information from App Store/Play Store
     */
    private async getStoreInfo(): Promise<AppVersion | null> {
        if (Platform.OS === 'ios') {
            return await this.getIOSStoreInfo();
        } else if (Platform.OS === 'android') {
            return await this.getAndroidStoreInfo();
        }
        return null;
    }

    /**
     * Get iOS App Store information
     */
    private async getIOSStoreInfo(): Promise<AppVersion | null> {
        try {
            const url = `https://itunes.apple.com/lookup?bundleId=${this.bundleId}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const app = data.results[0];
                return {
                    version: app.version,
                    bundleId: app.bundleId,
                    releaseDate: app.releaseDate,
                    releaseNotes: app.releaseNotes || '',
                    trackId: app.trackId,
                    trackViewUrl: app.trackViewUrl,
                    minimumOsVersion: app.minimumOsVersion,
                    currentVersionReleaseDate: app.currentVersionReleaseDate,
                };
            }
        } catch (error) {
            console.error('Failed to fetch iOS store info:', error);
        }
        return null;
    }

    /**
     * Get Android Play Store information
     */
    private async getAndroidStoreInfo(): Promise<AppVersion | null> {
        try {
            // Note: Google Play Store doesn't have a public API like iTunes
            // You would need to use a third-party service or scrape the Play Store
            // For now, we'll return null and handle updates differently on Android
            console.log('Android Play Store API not available');
            return null;
        } catch (error) {
            console.error('Failed to fetch Android store info:', error);
        }
        return null;
    }

    /**
     * Compare current version with store version
     */
    private compareVersions(storeInfo: AppVersion): UpdateInfo {
        const currentVersion = this.currentVersion;
        const latestVersion = storeInfo.version;
        
        const isUpdateAvailable = this.isNewerVersion(latestVersion, currentVersion);
        const isForceUpdate = this.isForceUpdateRequired(latestVersion, currentVersion);

        return {
            isUpdateAvailable,
            currentVersion,
            latestVersion,
            releaseNotes: storeInfo.releaseNotes,
            storeUrl: storeInfo.trackViewUrl,
            isForceUpdate,
            releaseDate: storeInfo.currentVersionReleaseDate,
        };
    }

    /**
     * Check if version A is newer than version B
     */
    private isNewerVersion(versionA: string, versionB: string): boolean {
        const parseVersion = (version: string) => {
            return version.split('.').map(num => parseInt(num, 10));
        };

        const vA = parseVersion(versionA);
        const vB = parseVersion(versionB);

        for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
            const a = vA[i] || 0;
            const b = vB[i] || 0;

            if (a > b) return true;
            if (a < b) return false;
        }

        return false;
    }

    /**
     * Determine if this is a force update
     * You can implement your own logic here
     */
    private isForceUpdateRequired(latestVersion: string, currentVersion: string): boolean {
        // Example: Force update if major version is different
        const latestMajor = parseInt(latestVersion.split('.')[0], 10);
        const currentMajor = parseInt(currentVersion.split('.')[0], 10);
        
        return latestMajor > currentMajor;
    }

    /**
     * Check if we should check for updates based on interval
     */
    private async shouldCheckForUpdates(): Promise<boolean> {
        try {
            const lastCheck = await AsyncStorage.getItem(UPDATE_CHECK_KEY);
            if (!lastCheck) return true;

            const lastCheckTime = parseInt(lastCheck, 10);
            const now = Date.now();

            return (now - lastCheckTime) > UPDATE_CHECK_INTERVAL;
        } catch (error) {
            console.error('Failed to check update interval:', error);
            return true;
        }
    }

    /**
     * Update the last check time
     */
    private async updateLastCheckTime(): Promise<void> {
        try {
            await AsyncStorage.setItem(UPDATE_CHECK_KEY, Date.now().toString());
        } catch (error) {
            console.error('Failed to update last check time:', error);
        }
    }

    /**
     * Show update alert to user
     */
    async showUpdateAlert(updateInfo: UpdateInfo): Promise<void> {
        if (!updateInfo.isUpdateAvailable) return;

        const title = updateInfo.isForceUpdate ? 'Update Required' : 'Update Available';
        const message = updateInfo.isForceUpdate 
            ? `A new version (${updateInfo.latestVersion}) is required to continue using the app.`
            : `A new version (${updateInfo.latestVersion}) is available. Would you like to update now?`;

        const buttons = updateInfo.isForceUpdate 
            ? [
                {
                    text: 'Update Now',
                    onPress: () => this.openStore(updateInfo.storeUrl),
                },
            ]
            : [
                {
                    text: 'Later',
                    style: 'cancel' as const,
                    onPress: () => this.skipVersion(updateInfo.latestVersion),
                },
                {
                    text: 'Update',
                    onPress: () => this.openStore(updateInfo.storeUrl),
                },
            ];

        Alert.alert(title, message, buttons);
    }

    /**
     * Open the App Store/Play Store
     */
    private async openStore(storeUrl?: string): Promise<void> {
        try {
            let url = storeUrl;
            
            if (!url) {
                if (Platform.OS === 'ios') {
                    url = `https://apps.apple.com/app/id${this.bundleId}`;
                } else {
                    url = `https://play.google.com/store/apps/details?id=${this.bundleId}`;
                }
            }

            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                console.error('Cannot open store URL:', url);
            }
        } catch (error) {
            console.error('Failed to open store:', error);
            await errorHandler.logError(error as Error, {
                context: 'UpdateService.openStore',
                severity: 'low',
            });
        }
    }

    /**
     * Skip a specific version
     */
    private async skipVersion(version: string): Promise<void> {
        try {
            await AsyncStorage.setItem(UPDATE_SKIP_KEY, version);
        } catch (error) {
            console.error('Failed to skip version:', error);
        }
    }

    /**
     * Check if a version was skipped
     */
    private async isVersionSkipped(version: string): Promise<boolean> {
        try {
            const skippedVersion = await AsyncStorage.getItem(UPDATE_SKIP_KEY);
            return skippedVersion === version;
        } catch (error) {
            console.error('Failed to check skipped version:', error);
            return false;
        }
    }

    /**
     * Clear skipped version
     */
    async clearSkippedVersion(): Promise<void> {
        try {
            await AsyncStorage.removeItem(UPDATE_SKIP_KEY);
        } catch (error) {
            console.error('Failed to clear skipped version:', error);
        }
    }

    /**
     * Get current app version
     */
    getCurrentVersion(): string {
        return this.currentVersion;
    }

    /**
     * Check for updates and show alert automatically
     */
    async checkForUpdatesAndShow(forceCheck = false): Promise<void> {
        try {
            const updateInfo = await this.checkForUpdates(forceCheck);
            
            if (updateInfo.isUpdateAvailable) {
                // Don't show alert if version was skipped (unless it's a force update)
                if (!updateInfo.isForceUpdate && await this.isVersionSkipped(updateInfo.latestVersion)) {
                    console.log('Update available but version was skipped:', updateInfo.latestVersion);
                    return;
                }
                
                await this.showUpdateAlert(updateInfo);
            }
        } catch (error) {
            console.error('Failed to check for updates and show alert:', error);
        }
    }
}

export const updateService = UpdateService.getInstance();