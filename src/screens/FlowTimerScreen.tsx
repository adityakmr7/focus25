import React, { useCallback, useEffect, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import { BottomSheetMusicPlayer } from '../components/BottomSheetMusicPlayer';
import Header from '../components/FlowTimerScreen/Header';
import TimerContainer from '../components/FlowTimerScreen/TimerContainer';
import { useTheme } from '../hooks/useTheme';
import { useTimerLogic } from '../hooks/useTimerLogic';
import { useAudioManager } from '../hooks/useAudioManager';
import { useBackgroundTimer } from '../hooks/useBackgroundTimer';
import { useAppStateHandler } from '../hooks/useAppStateHandler';
import { useMusicSettings } from '../hooks/useMusicSettings';
import { useDeviceOrientation } from '../hooks/useDeviceOrientation';

interface FlowTimerScreenProps {
    navigation?: {
        goBack: () => void;
        navigate: (screen: string) => void;
    };
}

const FlowTimerScreen: React.FC<FlowTimerScreenProps> = () => {
    const { theme, isDark } = useTheme();
    const { isLandscape, isTablet } = useDeviceOrientation();
    
    // Refs and local state
    const bottomSheetRef = useRef<BottomSheetMethods>(null);
    const [showSettings, setShowSettings] = React.useState(false);
    
    // Music settings
    const { settings, loadSettings, saveSettings, handleVolumeChange } = useMusicSettings();
    
    // Create a ref to store the audio completion function
    const audioCompletionRef = useRef<(() => Promise<void>) | null>(null);

    // Timer logic hook 
    const {
        timer,
        timerState,
        flowMetrics,
        soundEffects,
        handleToggleTimer: baseHandleToggleTimer,
        handleReset: baseHandleReset,
        initializeTimer,
        handleTimerComplete: storeHandleTimerComplete,
        setTimer,
    } = useTimerLogic({
        onTimerComplete: async () => {
            // Play completion sound when timer completes
            if (audioCompletionRef.current) {
                await audioCompletionRef.current();
            }
        },
    });

    // Audio manager hook
    const audioManager = useAudioManager({
        soundEffects,
        settings,
        timerIsRunning: timer.isRunning,
        onTimerComplete: storeHandleTimerComplete,
    });

    // Set the audio completion function to play sound AND handle timer completion
    audioCompletionRef.current = async () => {
        // First play the completion sound (which includes sound effects check and fallbacks)
        await audioManager.playCompletionSound();
    };

    // Background timer hook
    const {
        stopBackgroundTimer,
        handleTimerToggleWithBackground,
        syncWithBackgroundTimer,
    } = useBackgroundTimer({
        timer,
        setTimer,
        isInitialized: timerState.isInitialized,
    });

    // App state handler
    useAppStateHandler({
        onAppBackground: () => {
            // Save timer state when going to background
            console.log('App going to background');
        },
        onAppForeground: async () => {
            // Sync with background timer when returning to foreground
            const syncResult = await syncWithBackgroundTimer();
            if (syncResult === 'completed') {
                // Play completion sound if timer completed in background
                if (audioCompletionRef.current) {
                    await audioCompletionRef.current();
                }
            }
        },
    });

    // Animations
    const pulseAnimation = useSharedValue(1);
    const progressAnimation = useSharedValue(0);
    const containerAnimation = useSharedValue(0);
    const volumeAnimation = useSharedValue(settings.volume);

    // Enhanced timer toggle with background support
    const handleToggleTimer = useCallback(async () => {
        const wasRunning = timer.isRunning;
        const wasPaused = timer.isPaused;

        // Handle timer toggle with background support
        await handleTimerToggleWithBackground(wasRunning, wasPaused, baseHandleToggleTimer);

        // Auto-play music if enabled and track is ready
        if (!wasRunning && settings.autoPlay && audioManager.player && audioManager.status?.isLoaded && !audioManager.isPlaying) {
            await audioManager.handlePlayPause();
        }

        // Trigger pulse animation
        if (!wasRunning) {
            pulseAnimation.value = withSequence(
                withTiming(1.1, { duration: 200 }),
                withTiming(1, { duration: 200 }),
            );
        }
    }, [
        timer.isRunning,
        timer.isPaused,
        handleTimerToggleWithBackground,
        baseHandleToggleTimer,
        settings.autoPlay,
        audioManager.player,
        audioManager.status?.isLoaded,
        audioManager.isPlaying,
        audioManager.handlePlayPause,
        pulseAnimation,
    ]);

    // Enhanced reset with background support
    const handleReset = useCallback(async () => {
        // Stop background timer
        await stopBackgroundTimer();
        
        // Pause music on reset
        if (audioManager.isPlaying && audioManager.player && audioManager.status?.isLoaded) {
            audioManager.player.pause();
            audioManager.stopLoop();
            audioManager.setIsPlaying(false);
        }

        // Reset timer state
        await baseHandleReset();

        // Reset pulse animation
        pulseAnimation.value = withTiming(1, { duration: 300 });
    }, [
        stopBackgroundTimer,
        audioManager.isPlaying,
        audioManager.player,
        audioManager.status?.isLoaded,
        audioManager.stopLoop,
        audioManager.setIsPlaying,
        baseHandleReset,
        pulseAnimation,
    ]);

    // Handle music player opening
    const handleOpenMusicPlayer = useCallback(() => {
        bottomSheetRef.current?.expand();
    }, []);

    // Enhanced volume change with audio player sync
    const handleVolumeChangeWithSync = useCallback(
        async (delta: number) => {
            const updatedSettings = await handleVolumeChange(delta);

            // Apply volume to player if available and ready
            if (audioManager.player && audioManager.isReady && audioManager.status?.isLoaded) {
                try {
                    audioManager.player.volume = updatedSettings.volume;
                    volumeAnimation.value = withTiming(updatedSettings.volume, { duration: 200 });
                } catch (error) {
                    console.error('Failed to set volume:', error);
                }
            }
        },
        [handleVolumeChange, audioManager.player, audioManager.isReady, audioManager.status?.isLoaded, volumeAnimation],
    );

    // Handle track selection with settings save
    const handleTrackSelection = useCallback(
        async (trackId: string) => {
            await audioManager.handleTrackSelection(trackId);
            await saveSettings({ lastPlayedTrack: trackId });
        },
        [audioManager.handleTrackSelection, saveSettings],
    );

    // Initialization
    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('🚀 Initializing FlowTimer...');

                // Initialize audio mode
                await audioManager.initializeAudioMode();

                // Preload alert player
                await audioManager.preloadAlertPlayer();

                // Initialize timer
                await initializeTimer();

                // Load music settings
                const loadedSettings = await loadSettings();
                
                // Set last played track if available
                if (loadedSettings.lastPlayedTrack) {
                    audioManager.setSelectedTrack(loadedSettings.lastPlayedTrack);
                }

                console.log('✅ FlowTimer initialized');

                // Start container animation
                containerAnimation.value = withTiming(1, { duration: 1000 });
            } catch (error) {
                console.error('❌ Failed to initialize FlowTimer:', error);
            }
        };

        initializeApp();
    }, [
        audioManager.initializeAudioMode,
        audioManager.preloadAlertPlayer,
        audioManager.setSelectedTrack,
        initializeTimer,
        loadSettings,
        containerAnimation,
    ]);

    // Progress animation
    useEffect(() => {
        if (timer.initialSeconds > 0) {
            const progress = 1 - timer.totalSeconds / timer.initialSeconds;
            progressAnimation.value = withTiming(progress, { duration: 300 });
        }
    }, [timer.totalSeconds, timer.initialSeconds, progressAnimation]);

    // Reset animation when timer stops
    useEffect(() => {
        if (!timer.isRunning || timer.isPaused) {
            pulseAnimation.value = withTiming(1, { duration: 300 });
        }
    }, [timer.isRunning, timer.isPaused, pulseAnimation]);

    // Volume animation
    useEffect(() => {
        volumeAnimation.value = withTiming(settings.volume, { duration: 200 });
    }, [settings.volume, volumeAnimation]);

    // Animation styles
    const containerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(containerAnimation.value, [0, 1], [0, 1]),
            transform: [
                {
                    translateY: interpolate(containerAnimation.value, [0, 1], [50, 0]),
                },
            ],
        };
    });

    const volumeStyle = useAnimatedStyle(() => ({
        width: `${volumeAnimation.value * 100}%`,
    }));

    // Loading state
    if (timerState.isLoading || !timerState.isInitialized) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: theme.text }]}>
                        Initializing Timer...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isTablet && styles.tabletScrollContent,
                    isLandscape && !isTablet && styles.phoneScrollContentLandscape
                ]}
                showsVerticalScrollIndicator={false}
                bounces={true}
                keyboardShouldPersistTaps="handled"
                automaticallyAdjustKeyboardInsets={true}
                contentInsetAdjustmentBehavior="automatic"
            >
                <Animated.View style={[styles.content, containerAnimatedStyle]}>
                    <Header
                        theme={theme}
                        flowMetrics={flowMetrics}
                        onOpenMusicPlayer={handleOpenMusicPlayer}
                        onReset={handleReset}
                        isLoading={timerState.isLoading}
                    />

                    <TimerContainer
                        volumeStyle={volumeStyle}
                        player={audioManager.player}
                        settings={settings}
                        theme={theme}
                        timer={timer}
                        flowMetrics={flowMetrics}
                        pulseAnimation={pulseAnimation}
                        onToggleTimer={handleToggleTimer}
                        isAuthenticated={false} // Placeholder
                        isPlaying={audioManager.isPlaying}
                        handlePlayPause={audioManager.handlePlayPause}
                        handleVolumeChange={handleVolumeChangeWithSync}
                        selectedTrackData={audioManager.selectedTrackData}
                        isLoading={timerState.isLoading}
                        currentTime={audioManager.currentTime}
                        totalPlayTime={audioManager.totalPlayTime}
                        isLooping={audioManager.isLooping}
                    />
                </Animated.View>
            </ScrollView>

            {/* Bottom Sheet Music Player */}
            <BottomSheetMusicPlayer
                isPlaying={audioManager.isPlaying}
                settings={settings}
                setShowSettings={setShowSettings}
                showSettings={showSettings}
                setSettings={saveSettings}
                player={audioManager.player}
                downloadProgress={audioManager.downloadProgress}
                handleTrackSelection={handleTrackSelection}
                bottomSheetRef={bottomSheetRef}
                autoStartTrack={timer.isRunning ? 'deep-focus' : undefined}
                selectedTrack={audioManager.selectedTrack}
                downloadError={audioManager.downloadError}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
    },
    tabletScrollContent: {
        paddingHorizontal: 40,
    },
    phoneScrollContentLandscape: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    content: {
        flex: 1,
        paddingVertical: 28,
    },
});

export default FlowTimerScreen;