import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Vibration } from 'react-native';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { audioSource, musicTracks } from '../utils/constants';
import { errorHandler } from '../services/errorHandler';
import useCachedAudio from './useCachedAudio';

interface MusicSettings {
  volume: number;
  autoPlay: boolean;
  fadeInOut: boolean;
  lastPlayedTrack: string | null;
  favoriteTrackIds: string[];
  shuffleMode: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

interface UseAudioManagerProps {
  soundEffects: boolean;
  settings: MusicSettings;
  timerIsRunning: boolean;
  onTimerComplete: () => void;
}

export const useAudioManager = ({
  soundEffects,
  settings,
  timerIsRunning,
  onTimerComplete,
}: UseAudioManagerProps) => {
  // Alert player for completion sounds
  const alertPlayer = useAudioPlayer(audioSource);

  // Music player state
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);

  // Current track data
  const currentTrackUrl = selectedTrack
    ? musicTracks.find(t => t.id === selectedTrack)?.source || null
    : null;

  const selectedTrackData = musicTracks.find(
    track => track.id === selectedTrack
  );

  const {
    player,
    isReady,
    status,
    uri,
    isDownloading,
    downloadError,
    downloadProgress,
    usingFallback,
    isLooping,
    currentTime,
    totalPlayTime,
    startLoop,
    stopLoop,
  } = useCachedAudio(currentTrackUrl, selectedTrackData);

  // Initialize audio mode
  const initializeAudioMode = useCallback(async () => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: 'duckOthers', // Changed from 'mixWithOthers' to prevent timer conflicts
      });
    } catch (error) {
      console.error('⚠️ Failed to configure audio mode:', error);
    }
  }, []);

  // Preload alert player
  const preloadAlertPlayer = useCallback(async () => {
    try {
      if (alertPlayer) {
        console.log('🔔 Preloading alert player...');
        const alertLoadTimeout = 5000; // 5 seconds
        const alertStartTime = Date.now();

        while (
          !alertPlayer.isLoaded &&
          Date.now() - alertStartTime < alertLoadTimeout
        ) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (alertPlayer.isLoaded) {
          console.log('✅ Alert player preloaded successfully');
        } else {
          console.warn(
            '⚠️ Alert player failed to preload, will use vibration fallback'
          );
        }
      } else {
        console.warn(
          '⚠️ Alert player not available, will use vibration fallback'
        );
      }
    } catch (error) {
      console.error('⚠️ Failed to preload alert player:', error);
    }
  }, [alertPlayer]);

  // Play completion sound
  const playCompletionSound = useCallback(async () => {
    try {
      // Check if sound effects are enabled in settings
      if (!soundEffects) {
        console.log('Sound effects disabled in settings, using vibration only');
        // Use vibration as alternative feedback
        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 250, 250, 250]);
        }
        onTimerComplete();
        return;
      }

      // Validate player availability
      if (!alertPlayer) {
        console.warn('Alert player not available, using vibration fallback');
        // Use vibration as fallback
        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 250, 250, 250]);
        }
        onTimerComplete();
        return;
      }

      // Log current player status for debugging
      console.log('Alert player status:', {
        isLoaded: alertPlayer.isLoaded,
        isBuffering: alertPlayer.isBuffering,
        playing: alertPlayer.playing,
        paused: alertPlayer.paused,
      });

      // Check if audio is ready with timeout to prevent infinite waiting
      const maxWaitTime = 2000; // 2 seconds max wait
      const startTime = Date.now();

      while (!alertPlayer.isLoaded && Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (!alertPlayer.isLoaded) {
        console.warn(
          'Alert player not loaded in time, using vibration fallback'
        );
        // Use vibration as fallback
        if (Platform.OS !== 'web') {
          Vibration.vibrate([0, 250, 250, 250]);
        }
        onTimerComplete();
        return;
      }

      console.log('Playing completion sound');
      // Reset to beginning in case it was played before
      alertPlayer.seekTo(0);
      alertPlayer.play();

      // Auto-pause after 2 seconds with safety check
      setTimeout(() => {
        if (alertPlayer && alertPlayer.isLoaded) {
          try {
            alertPlayer.pause();
          } catch (pauseError) {
            console.warn('Failed to pause alert player:', pauseError);
          }
        }
      }, 2000);

      onTimerComplete();
    } catch (error) {
      errorHandler.logError(error as Error, {
        context: 'Audio Playback',
        severity: 'medium',
      });
      console.warn('Audio playback failed, using vibration fallback:', error);

      // Use vibration as fallback when audio fails
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate([0, 250, 250, 250]);
        } catch (vibrationError) {
          console.warn('Vibration fallback also failed:', vibrationError);
        }
      }

      onTimerComplete();
    }
  }, [alertPlayer, onTimerComplete, soundEffects]);

  // Handle music play/pause
  const handlePlayPause = useCallback(async () => {
    try {
      if (!player) {
        Alert.alert(
          'Audio Error',
          'Audio player not available. Please try again.'
        );
        return;
      }

      // Check if we're still downloading (but allow fallback streaming)
      if (isDownloading && downloadProgress < 1 && !usingFallback) {
        Alert.alert(
          'Loading...',
          `Please wait... ${Math.round(downloadProgress * 100)}%`
        );
        return;
      }

      // Allow playback if player is ready or if we have a URI (even if not fully loaded for streaming)
      if (!isReady && !uri) {
        Alert.alert('Loading...', 'Please wait for the track to load');
        return;
      }

      if (isPlaying) {
        await player.pause();
        stopLoop();
        setIsPlaying(false);
        console.log('🎵 Music paused - timer state should remain unchanged', {
          timestamp: Date.now(),
        });
      } else {
        console.log('🎵 About to start music - checking timer state before:', {
          timerIsRunning,
          timestamp: Date.now(),
        });
        await player.play();
        startLoop();
        setIsPlaying(true);
        console.log(
          '🎵 Music started playing - timer state should remain unchanged',
          {
            timestamp: Date.now(),
          }
        );
      }

      // Add a small delay then verify timer state hasn't changed
      setTimeout(() => {
        console.log('🔍 Post-music action timer state check (delayed):', {
          timerIsRunning,
          timestamp: Date.now(),
        });
      }, 100);
    } catch (error) {
      console.error('Failed to toggle playback:', error);
      Alert.alert(
        'Playback Error',
        'Failed to control playbook. The track may still be loading.'
      );
    }
  }, [
    player,
    isReady,
    uri,
    isDownloading,
    downloadProgress,
    usingFallback,
    isPlaying,
    startLoop,
    stopLoop,
    timerIsRunning,
  ]);

  // Handle track selection
  const handleTrackSelection = useCallback(
    async (trackId: string) => {
      try {
        // If selecting a different track
        if (selectedTrack !== trackId) {
          // Stop current playback first
          if (isPlaying && player) {
            try {
              player.pause();
              stopLoop();
              setIsPlaying(false);
            } catch (error) {
              console.warn('Failed to pause current track:', error);
            }
          }

          // Set loading state and new track
          setIsLoadingTrack(true);
          setSelectedTrack(trackId);
          return;
        }

        // Toggle play/pause for same track
        await handlePlayPause();
      } catch (error) {
        console.error('Failed to handle track selection:', error);
        Alert.alert('Track Error', 'Failed to play the selected track.');
        setIsLoadingTrack(false);
      }
    },
    [selectedTrack, isPlaying, player, handlePlayPause, stopLoop]
  );

  // Auto-play when track is ready - only trigger from track selection, not timer state
  useEffect(() => {
    if (
      player &&
      isReady &&
      status?.isLoaded &&
      selectedTrack &&
      settings.autoPlay &&
      !isPlaying &&
      isLoadingTrack
    ) {
      setIsLoadingTrack(false);
      // Small delay to avoid conflicts with timer state changes
      setTimeout(() => {
        if (player && isReady && status?.isLoaded) {
          player.volume = settings.volume;
          handlePlayPause();
        }
      }, 300);
    } else if (isReady && isLoadingTrack) {
      setIsLoadingTrack(false);
    }
  }, [
    player,
    isReady,
    status?.isLoaded,
    selectedTrack,
    settings.autoPlay,
    settings.volume,
    isPlaying,
    isLoadingTrack,
    handlePlayPause,
  ]);

  return {
    // Alert player
    playCompletionSound,
    initializeAudioMode,
    preloadAlertPlayer,

    // Music player
    selectedTrack,
    selectedTrackData,
    isPlaying,
    isLoadingTrack,
    player,
    isReady,
    status,
    uri,
    isDownloading,
    downloadError,
    downloadProgress,
    usingFallback,
    isLooping,
    currentTime,
    totalPlayTime,
    handlePlayPause,
    handleTrackSelection,
    stopLoop,
    setIsPlaying,
    setSelectedTrack,
  };
};
