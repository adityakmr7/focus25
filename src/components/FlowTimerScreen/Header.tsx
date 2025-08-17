import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDeviceOrientation } from '../../hooks/useDeviceOrientation';

interface HeaderProps {
    theme: any;
    flowMetrics: any;
    onOpenMusicPlayer: () => void;
    onReset: () => void;
    isLoading?: boolean;
}
const Header: React.FC<HeaderProps> = React.memo(
    ({ theme, flowMetrics, onOpenMusicPlayer, onReset, isLoading = false }) => {
        const { isLandscape, isTablet } = useDeviceOrientation();

        const getHeaderStyle = () => {
            if (isTablet) {
                return isLandscape
                    ? [styles.header, styles.tabletLandscapeHeader]
                    : [styles.header, styles.tabletPortraitHeader];
            }
            return isLandscape ? [styles.header, styles.phoneLandscapeHeader] : styles.header;
        };

        return (
            <View style={getHeaderStyle()}>
                {/* <TouchableOpacity
                    onPress={onShowAchievements}
                    style={[styles.headerButton, { backgroundColor: theme.surface }]}
                    disabled={isLoading}
                    accessible={true}
                    accessibilityLabel="View achievements"
                    accessibilityRole="button"
                >
                    <Ionicons name="trophy" size={20} color="#FFD700" />
                    {flowMetrics.currentStreak > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{flowMetrics.currentStreak}</Text>
                        </View>
                    )}
                </TouchableOpacity> */}

                <TouchableOpacity
                    onPress={onOpenMusicPlayer}
                    style={[styles.musicButton, { backgroundColor: theme.surface }]}
                    disabled={isLoading}
                    accessible={true}
                    accessibilityLabel="Open music player"
                    accessibilityRole="button"
                >
                    <Ionicons name="musical-notes" size={20} color={theme.accent} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onReset}
                    style={[styles.headerButton, { backgroundColor: theme.surface }]}
                    disabled={isLoading}
                    accessible={true}
                    accessibilityLabel="Reset timer"
                    accessibilityRole="button"
                >
                    <Ionicons name="refresh" size={20} color={theme.accent} />
                </TouchableOpacity>
            </View>
        );
    },
);

Header.displayName = 'Header';

const styles = StyleSheet.create({
    // Base header styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
        paddingBottom: 10,
    },

    // Responsive header styles
    phoneLandscapeHeader: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 0 : 10,
        paddingBottom: 5,
    },
    tabletPortraitHeader: {
        paddingHorizontal: 40,
        paddingTop: Platform.OS === 'ios' ? 10 : 30,
        paddingBottom: 15,
    },
    tabletLandscapeHeader: {
        paddingHorizontal: 60,
        paddingTop: Platform.OS === 'ios' ? 5 : 15,
        paddingBottom: 10,
    },

    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    musicButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
});

export default Header;
