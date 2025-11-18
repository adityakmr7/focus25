import { usePomodoroStore } from '@/stores/pomodoro-store';
import { useSettingsStore } from '@/stores/local-settings-store';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { backgroundMetronomeService } from '@/services/background-metronome-service';
import { useEffect, useRef } from 'react';

// Ensure only one global interval runs regardless of how many hook instances mount
let globalPomodoroInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Custom hook to manage the pomodoro timer interval
 * Handles starting/stopping intervals based on timer status
 * Also handles metronome tick sounds
 */
export function usePomodoroTimer(soundEnabled: boolean) {
    const { timerStatus, tick } = usePomodoroStore();
    const { metronome, metronomeVolume, focusDuration, breakDuration, notifications } =
        useSettingsStore();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const soundEnabledRef = useRef(soundEnabled);
    const metronomeEnabledRef = useRef(metronome);
    const metronomePlayerRef = useRef<AudioPlayer | null>(null);

    // Update refs when settings change
    useEffect(() => {
        soundEnabledRef.current = soundEnabled;
    }, [soundEnabled]);

    useEffect(() => {
        metronomeEnabledRef.current = metronome;
    }, [metronome]);

    // Pre-load metronome sound for better performance
    useEffect(() => {
        const loadMetronome = async () => {
            if (metronome && !metronomePlayerRef.current) {
                try {
                    const player = await createAudioPlayer(
                        require('@/assets/sounds/metronome.mp3'),
                    );
                    // Apply current volume immediately
                    player.volume = Math.max(0, Math.min(1, metronomeVolume ?? 0.5));
                    metronomePlayerRef.current = player;
                } catch (error) {
                    console.error('Failed to load metronome sound:', error);
                }
            }
        };

        loadMetronome();

        // Cleanup metronome player when disabled
        if (!metronome && metronomePlayerRef.current) {
            metronomePlayerRef.current.remove();
            metronomePlayerRef.current = null;
        }
    }, [metronome, metronomeVolume]);

    // React to metronomeVolume changes by updating the current player volume
    useEffect(() => {
        if (metronomePlayerRef.current) {
            metronomePlayerRef.current.volume = Math.max(0, Math.min(1, metronomeVolume ?? 0.5));
        }
    }, [metronomeVolume]);

    // Play metronome tick
    const playMetronomeTick = async () => {
        if (!metronomeEnabledRef.current || !soundEnabledRef.current) return;

        try {
            if (metronomePlayerRef.current) {
                // Ensure volume is applied before each tick
                metronomePlayerRef.current.volume = Math.max(
                    0,
                    Math.min(1, metronomeVolume ?? 0.5),
                );
                // Reset to beginning and play
                metronomePlayerRef.current.seekTo(0);
                metronomePlayerRef.current.play();
            }
        } catch (error) {
            console.error('Error playing metronome tick:', error);
        }
    };

    // Stop metronome sound instantly
    const stopMetronomeSound = async () => {
        try {
            if (metronomePlayerRef.current) {
                metronomePlayerRef.current.pause();
                metronomePlayerRef.current.seekTo(0);
            }
            // Also stop background metronome
            await backgroundMetronomeService.stopBackgroundMetronome();
        } catch (error) {
            console.error('Error stopping metronome sound:', error);
        }
    };

    useEffect(() => {
        const handleTimerStatusChange = async () => {
            // Clear any existing interval
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (globalPomodoroInterval) {
                clearInterval(globalPomodoroInterval);
                globalPomodoroInterval = null;
            }

            // Stop metronome sound when timer is not running
            if (timerStatus !== 'running') {
                await stopMetronomeSound();
            }

            // Start interval if timer is running
            if (timerStatus === 'running') {
                const newInterval = setInterval(() => {
                    // Play metronome tick before calling tick
                    playMetronomeTick();
                    tick(soundEnabledRef.current, focusDuration, breakDuration, notifications);
                }, 1000);
                intervalRef.current = newInterval;
                globalPomodoroInterval = newInterval;
            }
        };

        handleTimerStatusChange();

        // Cleanup on unmount or status change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            if (globalPomodoroInterval) {
                clearInterval(globalPomodoroInterval);
                globalPomodoroInterval = null;
            }
            // Stop metronome sound on cleanup (async but no await in cleanup)
            stopMetronomeSound().catch(console.error);
        };
    }, [timerStatus, tick]);

    // Cleanup metronome player on unmount
    useEffect(() => {
        return () => {
            if (metronomePlayerRef.current) {
                metronomePlayerRef.current.remove();
                metronomePlayerRef.current = null;
            }
        };
    }, []);
}
