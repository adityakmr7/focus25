import React, {useEffect} from 'react'
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native'
import {Ionicons} from "@expo/vector-icons";
import {useTheme} from "../providers/ThemeProvider";
import {AudioPlayer} from "expo-audio";
import {MusicTrack} from "../utils/constants";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface MiniAudioPlayerProps {
    isPlaying: boolean;
    handlePlayPause: () => void;
    handleVolumeChange: (delta: number) => void;
    selectedTrackData: MusicTrack;
    settings: {
        volume: number;
    };
    player: AudioPlayer;
    volumeStyle: ViewStyle;
    currentTime?: number;
    duration?: number;
}

const MiniAudioPlayer = ({
                             isPlaying,
                             selectedTrackData,
                             handleVolumeChange,
                             handlePlayPause,
                             settings,
                             player,
                             volumeStyle,
                             currentTime = 0,
                             duration = 0
                         }: MiniAudioPlayerProps) => {
    const { theme } = useTheme();

    // Animations
    const slideAnimation = useSharedValue(0);
    const pulseAnimation = useSharedValue(1);
    const waveAnimation = useSharedValue(0);
    const progressAnimation = useSharedValue(0);

    // Mount animation
    useEffect(() => {
        slideAnimation.value = withTiming(1, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, []);

    // Playing animations
    useEffect(() => {
        if (isPlaying) {
            // Pulse animation for play button
            pulseAnimation.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                false
            );

            // Wave animation for visualizer
            waveAnimation.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 800 }),
                    withTiming(0.3, { duration: 800 })
                ),
                -1,
                false
            );
        } else {
            pulseAnimation.value = withTiming(1, { duration: 300 });
            waveAnimation.value = withTiming(0.3, { duration: 300 });
        }
    }, [isPlaying]);

    // Progress animation
    useEffect(() => {
        if (duration > 0) {
            const progress = currentTime / duration;
            progressAnimation.value = withTiming(progress, { duration: 300 });
        }
    }, [currentTime, duration]);

    const containerAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{
            translateY: interpolate(slideAnimation.value, [0, 1], [100, 0])
        }],
        opacity: slideAnimation.value,
    }));

    const playButtonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseAnimation.value }],
    }));

    const waveAnimatedStyle = useAnimatedStyle(() => ({
        opacity: waveAnimation.value,
        transform: [{
            scaleY: interpolate(waveAnimation.value, [0, 1], [0.5, 1.5])
        }],
    }));

    const progressAnimatedStyle = useAnimatedStyle(() => ({
        width: `${progressAnimation.value * 100}%`,
    }));

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: theme.surface,
                    borderColor: selectedTrackData.color + '30',
                },
                containerAnimatedStyle
            ]}
        >
            {/* Progress Bar */}
            <View style={[styles.progressContainer, { backgroundColor: theme.background }]}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        { backgroundColor: selectedTrackData.color },
                        progressAnimatedStyle
                    ]}
                />
            </View>

            <View style={styles.content}>
                {/* Track Info */}
                <View style={styles.trackInfo}>
                    <View style={[styles.trackIcon, { backgroundColor: selectedTrackData.color + '20' }]}>
                        <Ionicons
                            name="musical-note"
                            size={16}
                            color={selectedTrackData.color}
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Text
                            style={[styles.trackName, { color: theme.text }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {selectedTrackData.name}
                        </Text>
                        <Text
                            style={[styles.trackDescription, { color: theme.textSecondary }]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {selectedTrackData.description}
                        </Text>
                    </View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    {/* Volume Down */}
                    <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: theme.background }]}
                        onPress={() => handleVolumeChange(-0.1)}
                    >
                        <Ionicons name="volume-low" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {/* Play/Pause Button */}
                    <Animated.View style={playButtonAnimatedStyle}>
                        <TouchableOpacity
                            style={[
                                styles.playButton,
                                {
                                    backgroundColor: selectedTrackData.color,
                                    shadowColor: selectedTrackData.color,
                                }
                            ]}
                            onPress={handlePlayPause}
                            disabled={!player?.isLoaded}
                        >
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={18}
                                color="#FFFFFF"
                                style={!isPlaying && { marginLeft: 2 }} // Optical alignment for play icon
                            />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Volume Up */}
                    <TouchableOpacity
                        style={[styles.controlButton, { backgroundColor: theme.background }]}
                        onPress={() => handleVolumeChange(0.1)}
                    >
                        <Ionicons name="volume-high" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Visualizer & Time */}
                <View style={styles.rightSection}>
                    {/* Mini Visualizer */}
                    {isPlaying && (
                        <View style={styles.visualizer}>
                            {[...Array(3)].map((_, index) => (
                                <Animated.View
                                    key={index}
                                    style={[
                                        styles.waveBar,
                                        { backgroundColor: selectedTrackData.color },
                                        waveAnimatedStyle,
                                        {
                                            animationDelay: `${index * 100}ms`,
                                            height: 12 + (index % 2) * 4,
                                        }
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    {/* Time Display */}
                    {duration > 0 && (
                        <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </Text>
                    )}
                </View>
            </View>

            {/* Volume Indicator */}
            <View style={styles.volumeIndicator}>
                <View style={[styles.volumeTrack, { backgroundColor: theme.background }]}>
                    <Animated.View
                        style={[
                            styles.volumeFill,
                            { backgroundColor: selectedTrackData.color },
                            volumeStyle
                        ]}
                    />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: -40,
        left: 16,
        right: 16,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    progressContainer: {
        height: 3,
        width: '100%',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    trackInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    trackIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    trackName: {
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 18,
    },
    trackDescription: {
        fontSize: 11,
        lineHeight: 14,
        marginTop: 2,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    controlButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    rightSection: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 60,
    },
    visualizer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height: 20,
        marginBottom: 4,
    },
    waveBar: {
        width: 2.5,
        borderRadius: 1.25,
        minHeight: 8,
    },
    timeText: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    volumeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
    },
    volumeTrack: {
        flex: 1,
        height: '100%',
    },
    volumeFill: {
        height: '100%',
        borderRadius: 1,
    },
});

export default MiniAudioPlayer;
