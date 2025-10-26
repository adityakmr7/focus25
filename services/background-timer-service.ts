import { notificationService } from './notification-service';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

/**
 * Background Timer Service
 * Handles timer persistence and completion when app is in background
 */
class BackgroundTimerService {
    private completionSoundPlayer: AudioPlayer | null = null;

    /**
     * Initialize the background timer service
     */
    async initialize(): Promise<boolean> {
        try {
            // Pre-load completion sound for better performance
            await this.loadCompletionSound();
            return true;
        } catch (error) {
            console.error('Failed to initialize background timer service:', error);
            return false;
        }
    }

    /**
     * Pre-load completion sound
     */
    private async loadCompletionSound(): Promise<void> {
        try {
            this.completionSoundPlayer = await createAudioPlayer(
                require('@/assets/sounds/notify-alert.mp3'),
            );
            console.log('Background timer service: Completion sound loaded');
        } catch (error) {
            console.error('Failed to load completion sound:', error);
        }
    }

    /**
     * Schedule precise notification for timer completion
     */
    async scheduleBackgroundTimer(endTime: Date): Promise<string | null> {
        try {
            console.log('Background timer service: Scheduling timer for', endTime.toISOString());
            return await notificationService.schedulePreciseTimerNotification(endTime);
        } catch (error) {
            console.error('Failed to schedule background timer:', error);
            return null;
        }
    }

    /**
     * Play completion sound (works in background on iOS with audio background mode)
     */
    async playCompletionSound(soundEnabled: boolean): Promise<void> {
        if (!soundEnabled) {
            console.log('Background timer service: Sound disabled, skipping');
            return;
        }

        try {
            if (this.completionSoundPlayer) {
                console.log('Background timer service: Playing completion sound');
                // Reset to beginning and play
                this.completionSoundPlayer.seekTo(0);
                await this.completionSoundPlayer.play();
            } else {
                // Fallback: create new player if pre-loaded one is not available
                console.log('Background timer service: Creating new audio player');
                const player = await createAudioPlayer(require('@/assets/sounds/notify-alert.mp3'));
                await player.play();

                // Clean up after playing
                setTimeout(() => {
                    try {
                        player.remove();
                    } catch (error) {
                        console.error('Error cleaning up audio player:', error);
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('Background timer service: Error playing completion sound:', error);
        }
    }

    /**
     * Cancel all scheduled background timers
     */
    async cancelBackgroundTimer(): Promise<void> {
        try {
            await notificationService.cancelTimerNotifications();
            console.log('Background timer service: Cancelled all scheduled timers');
        } catch (error) {
            console.error('Failed to cancel background timer:', error);
        }
    }

    /**
     * Handle timer completion in background
     */
    async handleBackgroundTimerCompletion(
        soundEnabled: boolean,
        onComplete: () => void,
    ): Promise<void> {
        try {
            console.log('Background timer service: Handling timer completion');

            // Play completion sound
            await this.playCompletionSound(soundEnabled);

            // Call completion callback
            onComplete();
        } catch (error) {
            console.error('Background timer service: Error handling completion:', error);
        }
    }

    /**
     * Check if app supports background audio
     */
    supportsBackgroundAudio(): boolean {
        return Platform.OS === 'ios'; // iOS supports background audio with proper configuration
    }

    /**
     * Cleanup resources
     */
    cleanup(): void {
        try {
            if (this.completionSoundPlayer) {
                this.completionSoundPlayer.remove();
                this.completionSoundPlayer = null;
            }
            console.log('Background timer service: Cleaned up resources');
        } catch (error) {
            console.error('Error cleaning up background timer service:', error);
        }
    }
}

// Export singleton instance
export const backgroundTimerService = new BackgroundTimerService();
