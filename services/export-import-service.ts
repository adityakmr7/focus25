import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { localDatabaseService } from '@/services/local-database-service';
import { Alert } from 'react-native';

export interface ExportData {
    todos: any[];
    sessions: any[];
    settings: any;
    exportDate: string;
    appVersion: string;
}

/**
 * Export/Import Service
 * Handles data export and import functionality for local-first app
 */
class ExportImportService {
    /**
     * Export all app data to JSON file
     */
    async exportData(): Promise<boolean> {
        try {
            console.log('Starting data export...');

            // Get all data from local database
            const exportData = await localDatabaseService.exportData();

            // Add metadata
            const fullExportData: ExportData = {
                ...exportData,
                appVersion: '1.0.0',
                exportDate: new Date().toISOString(),
            };

            // Create filename with timestamp
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `flowzy-backup-${timestamp}.json`;
            const fileUri = `/tmp/${filename}`;

            // Write file
            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(fullExportData, null, 2));

            console.log('Data exported to:', fileUri);

            // Share the file
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Export Flowzy Data',
                });
            } else {
                Alert.alert('Export Complete', `Data exported to: ${filename}`, [{ text: 'OK' }]);
            }

            return true;
        } catch (error) {
            console.error('Export failed:', error);
            Alert.alert('Export Failed', 'Failed to export data. Please try again.', [
                { text: 'OK' },
            ]);
            return false;
        }
    }

    /**
     * Import data from JSON file
     */
    async importData(): Promise<boolean> {
        try {
            console.log('Starting data import...');

            // Pick file
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                console.log('Import cancelled by user');
                return false;
            }

            const fileUri = result.assets[0].uri;
            console.log('Selected file:', fileUri);

            // Read file content
            const fileContent = await FileSystem.readAsStringAsync(fileUri);
            const importData: ExportData = JSON.parse(fileContent);

            // Validate data structure
            if (!this.validateImportData(importData)) {
                Alert.alert('Invalid File', 'The selected file is not a valid Flowzy backup.', [
                    { text: 'OK' },
                ]);
                return false;
            }

            // Show confirmation dialog
            const confirmed = await this.showImportConfirmation(importData);
            if (!confirmed) {
                console.log('Import cancelled by user');
                return false;
            }

            // Import data
            await localDatabaseService.importData({
                todos: importData.todos,
                sessions: importData.sessions,
                settings: importData.settings,
            });

            console.log('Data imported successfully');

            Alert.alert(
                'Import Complete',
                'Data imported successfully! Please restart the app to see changes.',
                [{ text: 'OK' }],
            );

            return true;
        } catch (error) {
            console.error('Import failed:', error);
            Alert.alert(
                'Import Failed',
                'Failed to import data. Please check the file format and try again.',
                [{ text: 'OK' }],
            );
            return false;
        }
    }

    /**
     * Validate import data structure
     */
    private validateImportData(data: any): boolean {
        try {
            return (
                data &&
                typeof data === 'object' &&
                Array.isArray(data.todos) &&
                Array.isArray(data.sessions) &&
                data.settings &&
                typeof data.settings === 'object' &&
                data.exportDate &&
                data.appVersion
            );
        } catch {
            return false;
        }
    }

    /**
     * Show import confirmation dialog
     */
    private async showImportConfirmation(data: ExportData): Promise<boolean> {
        return new Promise((resolve) => {
            Alert.alert(
                'Import Data',
                `This will import:
        • ${data.todos.length} todos
        • ${data.sessions.length} sessions
        • Settings from ${new Date(data.exportDate).toLocaleDateString()}
        
        This will replace your current data. Continue?`,
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(false),
                    },
                    {
                        text: 'Import',
                        style: 'destructive',
                        onPress: () => resolve(true),
                    },
                ],
            );
        });
    }

    /**
     * Export only todos
     */
    async exportTodos(): Promise<boolean> {
        try {
            const todos = await localDatabaseService.getTodos();

            const exportData = {
                todos,
                exportDate: new Date().toISOString(),
                type: 'todos-only',
            };

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `flowzy-todos-${timestamp}.json`;
            const fileUri = `/tmp/${filename}`;

            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Export Flowzy Todos',
                });
            }

            return true;
        } catch (error) {
            console.error('Todo export failed:', error);
            Alert.alert('Export Failed', 'Failed to export todos. Please try again.', [
                { text: 'OK' },
            ]);
            return false;
        }
    }

    /**
     * Export only sessions
     */
    async exportSessions(): Promise<boolean> {
        try {
            const sessions = await localDatabaseService.getSessions();

            const exportData = {
                sessions,
                exportDate: new Date().toISOString(),
                type: 'sessions-only',
            };

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `flowzy-sessions-${timestamp}.json`;
            const fileUri = `/tmp/${filename}`;

            await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Export Flowzy Sessions',
                });
            }

            return true;
        } catch (error) {
            console.error('Session export failed:', error);
            Alert.alert('Export Failed', 'Failed to export sessions. Please try again.', [
                { text: 'OK' },
            ]);
            return false;
        }
    }

    /**
     * Clear all data (with confirmation)
     */
    async clearAllData(): Promise<boolean> {
        try {
            const confirmed = await new Promise<boolean>((resolve) => {
                Alert.alert(
                    'Clear All Data',
                    'This will permanently delete all your todos, sessions, and settings. This action cannot be undone.',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => resolve(false),
                        },
                        {
                            text: 'Clear All',
                            style: 'destructive',
                            onPress: () => resolve(true),
                        },
                    ],
                );
            });

            if (!confirmed) {
                return false;
            }

            await localDatabaseService.clearAllData();

            Alert.alert('Data Cleared', 'All data has been cleared successfully.', [
                { text: 'OK' },
            ]);

            return true;
        } catch (error) {
            console.error('Clear data failed:', error);
            Alert.alert('Clear Failed', 'Failed to clear data. Please try again.', [
                { text: 'OK' },
            ]);
            return false;
        }
    }

    /**
     * Get data statistics
     */
    async getDataStats(): Promise<{
        totalTodos: number;
        completedTodos: number;
        totalSessions: number;
        totalFocusTime: number;
        lastExport?: string;
    }> {
        try {
            const todos = await localDatabaseService.getTodos();
            const sessions = await localDatabaseService.getSessions();

            const completedTodos = todos.filter((todo) => todo.isCompleted).length;
            const focusSessions = sessions.filter((session) => session.type === 'focus');
            const totalFocusTime = focusSessions.reduce(
                (total, session) => total + session.duration,
                0,
            );

            return {
                totalTodos: todos.length,
                completedTodos,
                totalSessions: sessions.length,
                totalFocusTime,
            };
        } catch (error) {
            console.error('Failed to get data stats:', error);
            return {
                totalTodos: 0,
                completedTodos: 0,
                totalSessions: 0,
                totalFocusTime: 0,
            };
        }
    }
}

// Export singleton instance
export const exportImportService = new ExportImportService();
