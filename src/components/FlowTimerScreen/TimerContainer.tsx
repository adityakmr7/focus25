import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { TimerDisplay } from '../TimerDisplay';
import { PlayPauseButton } from '../PlayPauseButton';
import { MusicSettings } from '../BottomSheetMusicPlayer';
import { LiquidDropAnimation } from '../LiquidDropAnimation';
import { AudioPlayer } from 'expo-audio';
import { useDeviceOrientation } from '../../hooks/useDeviceOrientation';

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
        const { isLandscape, isTablet } = useDeviceOrientation();

        const containerAnimatedStyle = useAnimatedStyle(() => {
            return {
                transform: [{ scale: pulseAnimation.value }],
            };
        });

        const getContainerStyle = () => {
            if (isTablet) {
                return isLandscape
                    ? [styles.timerContainer, styles.tabletLandscape]
                    : [styles.timerContainer, styles.tabletPortrait];
            }
            return isLandscape
                ? [styles.timerContainer, styles.phoneLandscape]
                : styles.timerContainer;
        };

        const getLayoutStyle = () => {
            if (isLandscape && !isTablet) {
                return styles.landscapeLayout;
            }
            return null;
        };

        if (isLandscape) {
            // Horizontal layout for landscape (both phone and tablet)
            return (
                <ScrollView contentContainerStyle={styles.landscapeScrollContainer}>
                    <Animated.View style={[getContainerStyle(), containerAnimatedStyle]}>
                        <View style={[styles.landscapeLayout, getLayoutStyle()]}>
                            <View style={styles.landscapeLeft}>
                                <TimerDisplay
                                    minutes={timer.minutes}
                                    seconds={timer.seconds}
                                    progress={1 - timer.totalSeconds / timer.initialSeconds}
                                    isRunning={timer.isRunning}
                                    pulseAnimation={pulseAnimation}
                                    onToggleTimer={onToggleTimer}
                                />
                                <Text style={[styles.flowLabel, { color: theme.text }]}>
                                    {timer.isBreak ? 'Break' : 'Focus'}
                                </Text>
                            </View>
                            <View style={styles.landscapeRight}>
                                <View style={styles.landscapeControls}>
                                    <LiquidDropAnimation
                                        currentSession={timer.currentSession}
                                        totalSessions={timer.totalSessions}
                                        isRunning={timer.isRunning}
                                        isBreak={timer.isBreak}
                                    />
                                    <PlayPauseButton
                                        isRunning={timer.isRunning}
                                        isPaused={timer.isPaused}
                                        onPress={onToggleTimer}
                                        disabled={isLoading}
                                    />
                                    {timer.isRunning && isPlaying && selectedTrackData && (
                                        <View style={styles.musicIconWrapper}>
                                            <Text
                                                style={[
                                                    styles.musicIcon,
                                                    { color: theme.textSecondary },
                                                ]}
                                            >
                                                ♪
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </ScrollView>
            );
        }

        // Standard vertical layout for portrait or tablet
        return (
            <Animated.View style={[getContainerStyle(), containerAnimatedStyle]}>
                {/*<AuthStatus isAuthenticated={isAuthenticated} />*/}

                {/* Timer Display */}
                <View style={[styles.timerDisplayWrapper, isTablet && styles.tabletTimerWrapper]}>
                    <TimerDisplay
                        minutes={timer.minutes}
                        seconds={timer.seconds}
                        progress={1 - timer.totalSeconds / timer.initialSeconds}
                        isRunning={timer.isRunning}
                        pulseAnimation={pulseAnimation}
                    />
                    <Text style={[styles.flowLabel, { color: theme.text }]}>
                        {timer.isBreak ? 'Break' : 'Focus'}
                    </Text>
                    {/* Liquid Drop Animation for session progress */}
                    <LiquidDropAnimation
                        currentSession={timer.currentSession}
                        totalSessions={timer.totalSessions}
                        isRunning={timer.isRunning}
                        isBreak={timer.isBreak}
                    />
                </View>

                {/* Play/Pause Button */}
                <View style={[styles.playPauseWrapper, isTablet && styles.tabletPlayPauseWrapper]}>
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
    // Tablet styles
    tabletPortrait: {
        paddingHorizontal: 80,
    },
    tabletLandscape: {
        paddingHorizontal: 60,
        paddingVertical: 40,
    },
    tabletTimerWrapper: {
        marginBottom: 80,
    },
    tabletPlayPauseWrapper: {
        marginBottom: 60,
    },
    // Phone landscape styles
    phoneLandscape: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    landscapeScrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    landscapeLayout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        flex: 1,
    },
    landscapeLeft: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 20,
    },
    landscapeRight: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 20,
    },
    landscapeControls: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 30,
    },
    // Standard styles
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
    flowLabel: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'SF-Pro-Display-Thin',
        textAlign: 'center',
    },
});
export default TimerContainer;
