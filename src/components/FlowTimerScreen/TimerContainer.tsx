import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { TimerDisplay } from '../TimerDisplay';
import { PlayPauseButton } from '../PlayPauseButton';
import { MusicSettings } from '../BottomSheetMusicPlayer';
import { AudioPlayer } from 'expo-audio';

interface TimerContainerProps {
    theme: any;
    timer: any;
    flowMetrics: any;
    pulseAnimation: any;
    onToggleTimer: () => void;
    isAuthenticated: boolean;
    handlePlayPause: () => void;
    handleVolumeChange: (delta: number) => void;
    selectedTrackData: any;
    settings: MusicSettings;
    player: AudioPlayer;
    volumeStyle: ViewStyle;
    isPlaying: boolean;
    isLoading?: boolean;
    currentTime?: number;
    totalPlayTime?: number;
    isLooping?: boolean;
}
const TimerContainer: React.FC<TimerContainerProps> = React.memo(
    ({
        theme,
        timer,
        flowMetrics,
        pulseAnimation,
        onToggleTimer,
        isAuthenticated,
        handlePlayPause,
        handleVolumeChange,
        selectedTrackData,
        settings,
        player,
        volumeStyle,
        isPlaying,
        isLoading = false,
        currentTime = 0,
        totalPlayTime = 0,
        isLooping = false,
    }) => {
        const containerAnimatedStyle = useAnimatedStyle(() => {
            return {
                transform: [{ scale: pulseAnimation.value }],
            };
        });

        return (
            <Animated.View style={[styles.timerContainer, containerAnimatedStyle]}>
                {/*<AuthStatus isAuthenticated={isAuthenticated} />*/}

                {/* Removed session counting and softened focus label */}

                {/* Removed breathing animation */}

                {/* Timer Display */}
                <View style={styles.timerDisplayWrapper}>
                    <TimerDisplay
                        minutes={timer.minutes}
                        seconds={timer.seconds}
                        progress={1 - timer.totalSeconds / timer.initialSeconds}
                        isRunning={timer.isRunning}
                        pulseAnimation={pulseAnimation}
                    />
                </View>

                {/* Removed session dots for cleaner interface */}

                {/* Play/Pause Button */}
                <View style={styles.playPauseWrapper}>
                    <PlayPauseButton
                        isRunning={timer.isRunning}
                        isPaused={timer.isPaused}
                        onPress={onToggleTimer}
                        disabled={isLoading}
                    />
                </View>

                {/* Minimalist music controls - only show when timer is running and music is playing */}
                {timer.isRunning && isPlaying && selectedTrackData && (
                    <View style={styles.musicIconWrapper}>
                        <Text style={[styles.musicIcon, { color: theme.textSecondary }]}>♪</Text>
                    </View>
                )}
            </Animated.View>
        );
    },
);

TimerContainer.displayName = 'TimerContainer';
const styles = StyleSheet.create({
    timerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    timerDisplayWrapper: {
        marginBottom: 60,
    },
    playPauseWrapper: {
        marginBottom: 40,
    },
    musicIconWrapper: {
        marginTop: 20,
        opacity: 0.6,
    },
    musicIcon: {
        fontSize: 16,
        textAlign: 'center',
    },
});
export default TimerContainer;
