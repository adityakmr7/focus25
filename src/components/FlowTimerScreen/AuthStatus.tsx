import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthStatusProps {
    isAuthenticated: boolean;
    syncStatus?: 'idle' | 'syncing' | 'error';
}

const AuthStatus: React.FC<AuthStatusProps> = React.memo(
    ({ isAuthenticated, syncStatus = 'idle' }) => {
        const getStatusInfo = () => {
            if (syncStatus === 'syncing') {
                return { icon: 'cloud-sync', color: '#F59E0B', text: 'Syncing...' };
            }
            if (syncStatus === 'error') {
                return { icon: 'cloud-off', color: '#EF4444', text: 'Sync Error' };
            }
            if (isAuthenticated) {
                return { icon: 'cloud-done', color: '#10B981', text: 'Synced' };
            }
            return { icon: 'cloud-offline', color: '#F59E0B', text: 'Local Only' };
        };

        const statusInfo = getStatusInfo();

        return (
            <View style={styles.centerStatus}>
                <View style={styles.authStatus}>
                    <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
                    <Text style={[styles.authStatusText, { color: statusInfo.color }]}>
                        {statusInfo.text}
                    </Text>
                </View>
            </View>
        );
    },
);

AuthStatus.displayName = 'AuthStatus';

const styles = StyleSheet.create({
    authStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        gap: 6,
    },
    authStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    centerStatus: {
        alignItems: 'center',
        marginBottom: 20,
    },
});
export default AuthStatus;
