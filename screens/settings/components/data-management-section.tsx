import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Switch, Button, Badge } from 'react-native-heroui';
import { useSettingsStore } from '@/stores/local-settings-store';
import { useAuthStore } from '@/stores/auth-store';
import { useSubscriptionStore } from '@/stores/subscription-store';
import { optionalSyncService } from '@/services/optional-sync-service';
import { exportImportService } from '@/services/export-import-service';
import { router } from 'expo-router';
import SettingsSection from './settings-section';
import SettingItem from './setting-item';
import Divider from './divider';

interface SyncStatus {
    enabled: boolean;
    lastSyncAt?: string;
    unsyncedChanges: number;
}

export default function DataManagementSection() {
    const { syncWithCloud, setSyncWithCloud } = useSettingsStore();
    const { user } = useAuthStore();
    const { isPro } = useSubscriptionStore();
    const [syncStatus, setSyncStatus] = useState<SyncStatus>({
        enabled: false,
        unsyncedChanges: 0,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        loadSyncStatus();
    }, []);

    const loadSyncStatus = async () => {
        try {
            const status = await optionalSyncService.getSyncStatus();
            setSyncStatus(status);
        } catch (error) {
            console.error('Failed to load sync status:', error);
        }
    };

    const handleSyncToggle = async (enabled: boolean) => {
        // Check if user is authenticated
        if (enabled && !user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in with Apple to enable cloud sync.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Sign In', 
                        onPress: async () => {
                            try {
                                await useAuthStore.getState().signInWithApple();
                                // After successful sign-in, check Pro status
                                await useSubscriptionStore.getState().checkProStatus();
                            } catch (error) {
                                Alert.alert('Sign In Failed', 'Please try again.');
                            }
                        }
                    }
                ]
            );
            return;
        }

        // Check if user is Pro
        if (enabled && !isPro) {
            Alert.alert(
                'Pro Feature',
                'Cloud sync is available for Pro users. Upgrade for $4.99/month to unlock cloud sync across all your devices.',
                [
                    { text: 'Maybe Later', style: 'cancel' },
                    { 
                        text: 'Upgrade to Pro', 
                        onPress: () => router.push('/subscription')
                    }
                ]
            );
            return;
        }

        setIsLoading(true);
        try {
            if (enabled) {
                const success = await optionalSyncService.enableSync();
                if (success) {
                    setSyncWithCloud(true);
                    await loadSyncStatus();
                    Alert.alert(
                        'Sync Enabled',
                        'Cloud sync has been enabled and your data has been synchronized.',
                        [{ text: 'OK' }],
                    );
                } else {
                    Alert.alert(
                        'Sync Failed',
                        'Failed to enable cloud sync. Please make sure you are signed in and try again.',
                        [{ text: 'OK' }],
                    );
                }
            } else {
                await optionalSyncService.disableSync();
                setSyncWithCloud(false);
                await loadSyncStatus();
                Alert.alert(
                    'Sync Disabled',
                    'Cloud sync has been disabled. Your data will remain local only.',
                    [{ text: 'OK' }],
                );
            }
        } catch (error) {
            console.error('Sync toggle failed:', error);
            Alert.alert('Error', 'Failed to update sync settings. Please try again.', [
                { text: 'OK' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSync = async () => {
        setIsLoading(true);
        try {
            const success = await optionalSyncService.performSync();
            if (success) {
                await loadSyncStatus();
                Alert.alert('Sync Complete', 'Your data has been synchronized successfully.', [
                    { text: 'OK' },
                ]);
            } else {
                Alert.alert(
                    'Sync Failed',
                    'Failed to synchronize data. Please make sure you are signed in and try again.',
                    [{ text: 'OK' }],
                );
            }
        } catch (error) {
            console.error('Manual sync failed:', error);
            Alert.alert('Sync Error', 'An error occurred during sync. Please try again.', [
                { text: 'OK' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportAll = async () => {
        setIsExporting(true);
        try {
            await exportImportService.exportData();
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportTodos = async () => {
        setIsExporting(true);
        try {
            await exportImportService.exportTodos();
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportSessions = async () => {
        setIsExporting(true);
        try {
            await exportImportService.exportSessions();
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async () => {
        setIsImporting(true);
        try {
            await exportImportService.importData();
        } finally {
            setIsImporting(false);
        }
    };

    const handleClearData = async () => {
        await exportImportService.clearAllData();
    };

    const formatLastSync = (lastSyncAt?: string) => {
        if (!lastSyncAt) return 'Never';
        const date = new Date(lastSyncAt);
        return date.toLocaleString();
    };

    return (
        <>
            {/* Cloud Sync Section */}
            <SettingsSection title="Cloud Sync">
                <SettingItem
                    title="Enable Cloud Sync"
                    subtitle={
                        isPro 
                            ? "Sync your data across all devices" 
                            : "Pro feature - Upgrade to unlock"
                    }
                    rightElement={
                        isPro ? (
                            <Switch
                                size="md"
                                value={syncWithCloud}
                                onChange={handleSyncToggle}
                                isDisabled={isLoading}
                            />
                        ) : (
                            <Badge variant="solid" content="PRO" color="primary" />
                        )
                    }
                    onPress={() => !isPro && router.push('/subscription')}
                />

                {syncWithCloud && (
                    <>
                        <Divider />
                        <SettingItem
                            title="Last Sync"
                            subtitle={formatLastSync(syncStatus.lastSyncAt)}
                        />
                        <Divider />
                        <SettingItem
                            title="Unsynced Changes"
                            subtitle={`${syncStatus.unsyncedChanges} pending changes`}
                        />
                        <Divider />
                        <SettingItem
                            title="Sync Now"
                            subtitle="Manually synchronize your data"
                            rightElement={
                                <Button size="sm" isLoading={isLoading} onPress={handleManualSync}>
                                    Sync
                                </Button>
                            }
                        />
                    </>
                )}
            </SettingsSection>
        </>
    );
}
