import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface DynamicBackgroundProps {
    isRunning: boolean;
    isBreak: boolean;
    flowIntensity: 'low' | 'medium' | 'high';
    progress: number;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
    isRunning,
    isBreak,
    flowIntensity,
    progress,
}) => {
    const animatedValue1 = useRef(new Animated.Value(0)).current;
    const animatedValue2 = useRef(new Animated.Value(0)).current;
    const animatedValue3 = useRef(new Animated.Value(0)).current;
    const colorAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isRunning) {
            // Start flowing animations
            const createAnimation = (animatedValue: Animated.Value, duration: number) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.timing(animatedValue, {
                            toValue: 1,
                            duration,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animatedValue, {
                            toValue: 0,
                            duration,
                            useNativeDriver: true,
                        }),
                    ])
                );
            };

            const animation1 = createAnimation(animatedValue1, 8000);
            const animation2 = createAnimation(animatedValue2, 12000);
            const animation3 = createAnimation(animatedValue3, 15000);

            animation1.start();
            animation2.start();
            animation3.start();

            return () => {
                animation1.stop();
                animation2.stop();
                animation3.stop();
            };
        } else {
            // Reset animations when stopped
            animatedValue1.setValue(0);
            animatedValue2.setValue(0);
            animatedValue3.setValue(0);
        }
    }, [isRunning]);

    useEffect(() => {
        // Animate color based on flow intensity and break state
        let targetValue = 0;
        if (isBreak) {
            targetValue = 0.8; // Green for break
        } else {
            switch (flowIntensity) {
                case 'high':
                    targetValue = 0.6; // Deep blue
                    break;
                case 'medium':
                    targetValue = 0.4; // Purple
                    break;
                case 'low':
                    targetValue = 0.2; // Light blue
                    break;
            }
        }

        Animated.timing(colorAnimation, {
            toValue: targetValue,
            duration: 2000,
            useNativeDriver: false,
        }).start();
    }, [flowIntensity, isBreak]);

    const getBackgroundColor = () => {
        return colorAnimation.interpolate({
            inputRange: [0, 0.2, 0.4, 0.6, 0.8],
            outputRange: [
                'rgba(15, 23, 42, 1)',    // Dark base
                'rgba(30, 58, 138, 0.3)', // Light blue
                'rgba(91, 33, 182, 0.3)', // Purple
                'rgba(30, 64, 175, 0.4)', // Deep blue
                'rgba(34, 197, 94, 0.3)', // Green for break
            ],
        });
    };

    const blob1Transform = {
        translateX: animatedValue1.interpolate({
            inputRange: [0, 1],
            outputRange: [-100, width + 100],
        }),
        translateY: animatedValue1.interpolate({
            inputRange: [0, 1],
            outputRange: [height * 0.2, height * 0.8],
        }),
        scale: animatedValue1.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.5, 1.2, 0.5],
        }),
    };

    const blob2Transform = {
        translateX: animatedValue2.interpolate({
            inputRange: [0, 1],
            outputRange: [width + 100, -100],
        }),
        translateY: animatedValue2.interpolate({
            inputRange: [0, 1],
            outputRange: [height * 0.6, height * 0.1],
        }),
        scale: animatedValue2.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 1, 0.3],
        }),
    };

    const blob3Transform = {
        translateX: animatedValue3.interpolate({
            inputRange: [0, 1],
            outputRange: [width * 0.5, width * 0.2],
        }),
        translateY: animatedValue3.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, height + 50],
        }),
        scale: animatedValue3.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.8, 1.5, 0.8],
        }),
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.background,
                    { backgroundColor: getBackgroundColor() },
                ]}
            />
            
            {isRunning && (
                <>
                    <Animated.View
                        style={[
                            styles.blob,
                            styles.blob1,
                            { transform: [blob1Transform] },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.blob,
                            styles.blob2,
                            { transform: [blob2Transform] },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.blob,
                            styles.blob3,
                            { transform: [blob3Transform] },
                        ]}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    background: {
        flex: 1,
    },
    blob: {
        position: 'absolute',
        borderRadius: 100,
        opacity: 0.1,
    },
    blob1: {
        width: 200,
        height: 200,
        backgroundColor: '#60A5FA',
    },
    blob2: {
        width: 150,
        height: 150,
        backgroundColor: '#A78BFA',
    },
    blob3: {
        width: 180,
        height: 180,
        backgroundColor: '#34D399',
    },
});