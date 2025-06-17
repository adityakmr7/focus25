import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';

export const BreathingAnimation: React.FC = () => {
    const breatheAnimation = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const breathingCycle = () => {
            return Animated.loop(
                Animated.sequence([
                    // Inhale
                    Animated.parallel([
                        Animated.timing(breatheAnimation, {
                            toValue: 1,
                            duration: 4000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(textOpacity, {
                            toValue: 1,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Hold
                    Animated.delay(1000),
                    // Exhale
                    Animated.parallel([
                        Animated.timing(breatheAnimation, {
                            toValue: 0,
                            duration: 4000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(textOpacity, {
                            toValue: 0.5,
                            duration: 500,
                            useNativeDriver: true,
                        }),
                    ]),
                    // Hold
                    Animated.delay(1000),
                ])
            );
        };

        const animation = breathingCycle();
        animation.start();

        return () => animation.stop();
    }, []);

    const scale = breatheAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.3],
    });

    const innerScale = breatheAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1.1],
    });

    const opacity = breatheAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.outerCircle,
                    {
                        transform: [{ scale }],
                        opacity,
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.innerCircle,
                    {
                        transform: [{ scale: innerScale }],
                        opacity: opacity,
                    },
                ]}
            />
            <Animated.Text
                style={[
                    styles.breatheText,
                    { opacity: textOpacity },
                ]}
            >
                Breathe
            </Animated.Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        width: 120,
        height: 120,
        marginBottom: 40,
    },
    outerCircle: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(72, 187, 120, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(72, 187, 120, 0.4)',
    },
    innerCircle: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(72, 187, 120, 0.3)',
    },
    breatheText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#48BB78',
        letterSpacing: 1,
    },
});