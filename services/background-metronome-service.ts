import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const METRONOME_STATE_KEY = 'metronome_background_state';

interface MetronomeState {
    isEnabled: boolean;
    isRunning: boolean;
    timerPhase: 'focus' | 'shortBreak' | 'longBreak';
    startTime: string;
    intervalSeconds: number;
}

/**
 * Background Metronome Service
 * Handles metronome sounds when app is in background using background audio
 * Note: This is a simplified implementation since iOS doesn't allow background audio for metronome
 */
class BackgroundMetronomeService {
    private isInitialized = false;
    private metronomePlayer: AudioPlayer | null = null;
    private metronomeInterval: NodeJS.Timeout | null = null;

    async initialize(): Promise<boolean> {
        try {
            if (this.isInitialized) return true;

            // Pre-load metronome sound
            try {
                this.metronomePlayer = await createAudioPlayer(
                    require('@/assets/sounds/metronome.mp3'),
                );
                console.log('Metronome sound loaded for background service');
            } catch (error) {
                console.error('Failed to load metronome sound:', error);
                return false;
            }

            this.isInitialized = true;
            console.log('Background metronome service initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize background metronome service:', error);
            return false;
        }
    }

    /**
     * Start background metronome
     * Note: This will only work when app is in foreground due to iOS limitations
     */
    async startBackgroundMetronome(
        isEnabled: boolean,
        timerPhase: 'focus' | 'shortBreak' | 'longBreak',
        intervalSeconds: number = 1,
    ): Promise<void> {
        try {
            if (!this.isInitialized) {
                const initialized = await this.initialize();
                if (!initialized) return;
            }

            if (!isEnabled) {
                await this.stopBackgroundMetronome();
                return;
            }

            // Stop any existing metronome
            await this.stopBackgroundMetronome();

            // Save metronome state
            const metronomeState: MetronomeState = {
                isEnabled: true,
                isRunning: true,
                timerPhase,
                startTime: new Date().toISOString(),
                intervalSeconds,
            };
            await AsyncStorage.setItem(METRONOME_STATE_KEY, JSON.stringify(metronomeState));

            console.log('Background metronome started (will only work in foreground)');

            // Note: Due to iOS limitations, we can't play audio in background
            // This is just for state management
        } catch (error) {
            console.error('Failed to start background metronome:', error);
        }
    }

    /**
     * Stop background metronome
     */
    async stopBackgroundMetronome(): Promise<void> {
        try {
            // Clear any existing interval
            if (this.metronomeInterval) {
                clearInterval(this.metronomeInterval);
                this.metronomeInterval = null;
            }

            // Clear metronome state
            await AsyncStorage.removeItem(METRONOME_STATE_KEY);

            console.log('Background metronome stopped');
        } catch (error) {
            console.error('Failed to stop background metronome:', error);
        }
    }

    /**
     * Play metronome tick (only works in foreground)
     */
    async playMetronomeTick(): Promise<void> {
        try {
            if (!this.metronomePlayer) return;

            // Reset to beginning and play
            this.metronomePlayer.seekTo(0);
            await this.metronomePlayer.play();
        } catch (error) {
            console.error('Failed to play metronome tick:', error);
        }
    }

    /**
     * Get current metronome state
     */
    async getMetronomeState(): Promise<MetronomeState | null> {
        try {
            const savedState = await AsyncStorage.getItem(METRONOME_STATE_KEY);
            if (!savedState) return null;

            return JSON.parse(savedState);
        } catch (error) {
            console.error('Failed to get metronome state:', error);
            return null;
        }
    }

    /**
     * Check if metronome should be running based on saved state
     */
    async shouldMetronomeBeRunning(): Promise<boolean> {
        try {
            const state = await this.getMetronomeState();
            if (!state) return false;

            const startTime = new Date(state.startTime);
            const currentTime = new Date();
            const elapsedSeconds = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);

            // Check if metronome should still be running (within 5 minutes)
            return state.isEnabled && state.isRunning && elapsedSeconds < 300;
        } catch (error) {
            console.error('Failed to check metronome state:', error);
            return false;
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        try {
            await this.stopBackgroundMetronome();

            if (this.metronomePlayer) {
                this.metronomePlayer.remove();
                this.metronomePlayer = null;
            }
        } catch (error) {
            console.error('Failed to cleanup background metronome service:', error);
        }
    }
}

// Export singleton instance
export const backgroundMetronomeService = new BackgroundMetronomeService();
