import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BreathingAnimation } from '../BreathingAnimation';
import { TimerDisplay } from '../TimerDisplay';
import { SessionDots } from '../SessionDots';
import { PlayPauseButton } from '../PlayPauseButton';
import MiniAudioPlayer from '../MiniAudioPlayer';
import { MusicSettings } from '../BottomSheetMusicPlayer';
import { AudioPlayer } from 'expo-audio';

interface TimerContainerProps {
    theme: any;
    timer: any;
    flowMetrics: any;
    showBreathingAnimation: boolean;
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
    focusModeActive: boolean;
}
const TimerContainer: React.FC<TimerContainerProps> = React.memo(
    ({
        theme,
        timer,
        flowMetrics,
        showBreathingAnimation,
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
        focusModeActive,
    }) => {
        const containerAnimatedStyle = useAnimatedStyle(() => {
            return {
                transform: [{ scale: pulseAnimation.value }],
                opacity: focusModeActive ? 0.8 : 1,
            };
        });

        return (
            <Animated.View style={[styles.timerContainer, containerAnimatedStyle]}>
                {/*<AuthStatus isAuthenticated={isAuthenticated} />*/}

                <Text style={[styles.flowLabel, { color: theme.text }]}>
                    {timer.isBreak ? 'Break Time' : 'Focus Time'}
                </Text>

                {/* Session Info */}
                <Text style={[styles.sessionInfo, { color: theme.textSecondary }]}>
                    Session {timer.currentSession} of {timer.totalSessions}
                </Text>

                {/* Breathing Animation - only when running and enabled */}
                {showBreathingAnimation && timer.isRunning && (
                    <View style={styles.breathingContainer}>
                        <BreathingAnimation />
                    </View>
                )}

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

                {/* Session Dots */}
                <View style={styles.sessionDotsWrapper}>
                    <SessionDots
                        currentSession={timer.currentSession}
                        totalSessions={timer.totalSessions}
                    />
                </View>

                {/* Play/Pause Button */}
                <View style={styles.playPauseWrapper}>
                    <PlayPauseButton
                        isRunning={timer.isRunning}
                        isPaused={timer.isPaused}
                        onPress={onToggleTimer}
                        disabled={isLoading}
                    />
                </View>

                {/* Mini Audio Player - Only show when music is actually playing */}
                {isPlaying && selectedTrackData && !focusModeActive && (
                    <View style={styles.miniPlayerWrapper}>
                        <MiniAudioPlayer
                            isPlaying={isPlaying}
                            handlePlayPause={handlePlayPause}
                            handleVolumeChange={handleVolumeChange}
                            selectedTrackData={selectedTrackData}
                            settings={settings}
                            player={player}
                            volumeStyle={volumeStyle}
                        />
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
        paddingHorizontal: 40,
        // marginTop: 60,
        flex: 1,
    },
    flowLabel: {
        fontSize: 28,
        fontWeight: '300',
        marginBottom: 8,
        letterSpacing: 1,
        textAlign: 'center',
    },
    sessionInfo: {
        fontSize: 16,
        marginBottom: 40,
        textAlign: 'center',
        opacity: 0.7,
    },
    timerDisplayWrapper: {
        marginBottom: 40,
    },
    sessionDotsWrapper: {
        marginBottom: 40,
    },
    playPauseWrapper: {
        marginBottom: 20,
    },
    miniPlayerWrapper: {
        width: '100%',
        marginTop: 20,
    },
    breathingContainer: {
        position: 'absolute',
        top: '30%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: -1,
    },
});
export default TimerContainer;
