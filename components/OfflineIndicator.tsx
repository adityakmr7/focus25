import TypographyText from '@/components/TypographyText';
import { useNetworkStore } from '@/services/network-service';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

/**
 * Offline Indicator Component
 * Displays a banner when the device is offline
 */
export default function OfflineIndicator() {
    const { isConnected, isInternetReachable } = useNetworkStore();
    const [slideAnim] = useState(new Animated.Value(-100));
    const [isVisible, setIsVisible] = useState(false);

    const isOnline = isConnected && isInternetReachable;

    useEffect(() => {
        if (!isOnline && !isVisible) {
            // Show indicator
            setIsVisible(true);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }).start();
        } else if (isOnline && isVisible) {
            // Hide indicator
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setIsVisible(false);
            });
        }
    }, [isOnline, isVisible, slideAnim]);

    if (!isVisible) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: '#FF3B30',
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <View style={styles.content}>
                <TypographyText
                    variant="body"
                    size="sm"
                    style={[styles.text, { color: '#FFFFFF' }]}
                >
                    No internet connection
                </TypographyText>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: 50, // Safe area for status bar
        paddingBottom: 12,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '600',
        textAlign: 'center',
    },
});
