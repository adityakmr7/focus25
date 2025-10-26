import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Switch, Button } from 'react-native-heroui';
import { useSettingsStore } from '@/stores/local-settings-store';
import { optionalSyncService } from '@/services/optional-sync-service';
import { exportImportService } from '@/services/export-import-service';
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
                    subtitle="Sync your data with the cloud for backup and cross-device access"
                    rightElement={
                        <Switch
                            size="md"
                            value={syncWithCloud}
                            onChange={handleSyncToggle}
                            isDisabled={isLoading}
                        />
                    }
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

            {/* Export/Import Section */}
            {/* <SettingsSection title="Export & Import"> */}
            {/* <SettingItem
                    title="Export All Data"
                    subtitle="Export todos, sessions, and settings as JSON"
                    rightElement={
                        <Button
                            size="sm"
                            variant="outline"
                            isLoading={isExporting}
                            onPress={handleExportAll}
                        >
                            Export
                        </Button>
                    }
                />
                <Divider /> */}
            {/* <SettingItem
                    title="Export Todos"
                    subtitle="Export only your todos"
                    rightElement={
                        <Button
                            size="sm"
                            variant="outline"
                            isLoading={isExporting}
                            onPress={handleExportTodos}
                        >
                            Export
                        </Button>
                    }
                />
                <Divider /> */}
            {/* <SettingItem
                    title="Export Sessions"
                    subtitle="Export only your Pomodoro sessions"
                    rightElement={
                        <Button
                            size="sm"
                            variant="outline"
                            isLoading={isExporting}
                            onPress={handleExportSessions}
                        >
                            Export
                        </Button>
                    }
                /> */}
            {/* <Divider /> */}
            {/* <SettingItem
                    title="Import Data"
                    subtitle="Import previously exported data"
                    rightElement={
                        <Button
                            size="sm"
                            variant="outline"
                            isLoading={isImporting}
                            onPress={handleImport}
                        >
                            Import
                        </Button>
                    }
                /> */}
            {/* </SettingsSection> */}

            {/* Danger Zone */}
            {/* <SettingsSection title="Danger Zone">
                <SettingItem
                    title="Clear All Data"
                    subtitle="Permanently delete all todos, sessions, and settings"
                    rightElement={
                        <Button size="sm" variant="outline" onPress={handleClearData}>
                            Clear
                        </Button>
                    }
                />
            </SettingsSection> */}
        </>
    );
}
