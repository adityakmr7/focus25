// hooks/useCachedAudio.ts
import { useEffect, useState, useRef } from 'react';
import { AudioStatus, useAudioPlayer } from 'expo-audio';
import { AudioCacheManager } from '../utils/audioCache';
import * as Network from 'expo-network';
import { MusicTrack, parseDurationToSeconds } from '../utils/constants';

const DOWNLOAD_TIMEOUT = 15000; // 15 seconds (faster timeout)
const MAX_RETRIES = 1; // Fewer retries for faster fallback
const FALLBACK_DELAY = 3000; // Start fallback after 3 seconds

export function useCachedAudio(sourceUrl: string | null, track?: MusicTrack) {
  const [uri, setUri] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalPlayTime, setTotalPlayTime] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);
  const loopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  useEffect(() => {
    if (!sourceUrl) {
      // Reset all states when no source
      setUri(null);
      setDownloadError(null);
      setIsDownloading(false);
      setDownloadProgress(0);
      setIsReady(false);
      setUsingFallback(false);
      return;
    }

    const checkAndDownload = async () => {
      // Cancel any ongoing download
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setDownloadError(null);
        setIsReady(false);
        setIsDownloading(true);
        setDownloadProgress(0);
        setUsingFallback(false);

        // Check network connectivity
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected) {
          throw new Error('No network connection');
        }

        // Start with fallback immediately for faster playback
        setTimeout(() => {
          if (!abortControllerRef.current?.signal.aborted && !uri) {
            console.log('Starting fallback streaming while downloading...');
            setUsingFallback(true);
            setUri(sourceUrl);
            setIsReady(true);
            setDownloadError('Streaming while downloading...');
          }
        }, FALLBACK_DELAY);

        // Try downloading with retries in background
        let downloadSuccess = false;

        for (
          let attempt = 0;
          attempt <= MAX_RETRIES && !abortControllerRef.current.signal.aborted;
          attempt++
        ) {
          try {
            console.log(`Download attempt ${attempt + 1} for: ${sourceUrl}`);

            const localUri = await Promise.race([
              AudioCacheManager.downloadAudioWithProgress(
                sourceUrl,
                progress => {
                  if (!abortControllerRef.current?.signal.aborted) {
                    setDownloadProgress(progress);
                  }
                }
              ),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () => reject(new Error('Download timeout')),
                  DOWNLOAD_TIMEOUT
                )
              ),
            ]);

            if (!abortControllerRef.current.signal.aborted) {
              // Switch to downloaded file if successful
              setUri(localUri);
              setIsReady(true);
              setUsingFallback(false);
              setDownloadError(null);
              downloadSuccess = true;
              console.log(
                `Successfully downloaded and switched to local file: ${sourceUrl}`
              );
              break;
            }
          } catch (error) {
            console.warn(`Download attempt ${attempt + 1} failed:`, error);

            if (attempt < MAX_RETRIES) {
              // Wait before retry (exponential backoff)
              await new Promise(resolve =>
                setTimeout(resolve, 1000 * Math.pow(2, attempt))
              );
            }
          }
        }

        // If download failed and we haven't set fallback yet
        if (
          !downloadSuccess &&
          !uri &&
          !abortControllerRef.current.signal.aborted
        ) {
          console.log(
            'Download failed completely, using direct streaming fallback'
          );
          setUsingFallback(true);
          setUri(sourceUrl);
          setIsReady(true);
          setDownloadError('Using direct streaming (may be slower)');
        }
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          const errorMessage =
            error instanceof Error ? error.message : 'Download failed';
          console.error('Audio download failed completely:', errorMessage);
          setDownloadError(errorMessage);
          setUri(null);
          setIsReady(false);

          // Last resort: try direct URL
          if (sourceUrl.startsWith('http')) {
            console.log('Last resort: using direct URL');
            setUri(sourceUrl);
            setIsReady(true);
            setUsingFallback(true);
            setDownloadError('Using direct streaming (may be slower)');
          }
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsDownloading(false);
        }
      }
    };

    checkAndDownload();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sourceUrl]);

  const player = useAudioPlayer(uri);

  // Monitor player status and handle looping
  useEffect(() => {
    if (!player || !track) return;

    const handleStatusChange = () => {
      const status = player.currentStatus;

      if (status.isLoaded) {
        setCurrentTime(status.currentTime || 0);

        // Check if track has finished playing
        if (status.didJustFinish) {
          const targetDurationSeconds = parseDurationToSeconds(track.duration);

          // If we haven't reached the target duration, loop
          if (totalPlayTime < targetDurationSeconds) {
            setIsLooping(true);
            player.seekTo(0);
            player.play();
            console.log(
              `🔄 Looping ${track.name} - ${Math.floor(totalPlayTime / 60)}:${Math.floor(totalPlayTime % 60)} / ${track.duration}`
            );
          } else {
            // Target duration reached, stop looping
            setIsLooping(false);
            setTotalPlayTime(0);
            player.pause();
            console.log(
              `✅ Finished playing ${track.name} for ${track.duration}`
            );
          }
        }
      }
    };

    // Set up status monitoring
    const interval = setInterval(handleStatusChange, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [player, track, totalPlayTime]);

  // Track total play time
  useEffect(() => {
    if (!player || !isLooping) return;

    trackingIntervalRef.current = setInterval(() => {
      const status = player.currentStatus;
      if (status.isLoaded && status.playing) {
        setTotalPlayTime(prev => prev + 1);
      }
    }, 1000);

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [player, isLooping]);

  // Enhanced startLoop function
  const startLoop = () => {
    if (!player || !track) return;

    const targetDurationSeconds = parseDurationToSeconds(track.duration);
    setIsLooping(true);
    setTotalPlayTime(0);

    console.log(
      `🎵 Starting loop for ${track.name} - Target duration: ${track.duration}`
    );

    // Start the loop timer for the total duration
    loopTimerRef.current = setTimeout(() => {
      setIsLooping(false);
      setTotalPlayTime(0);
      player.pause();
      console.log(`⏰ Loop timer finished for ${track.name}`);
    }, targetDurationSeconds * 1000);
  };

  // Stop loop function
  const stopLoop = () => {
    setIsLooping(false);
    setTotalPlayTime(0);

    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  // Clear cache function
  const clearCache = async () => {
    if (sourceUrl) {
      try {
        await AudioCacheManager.clearCacheForUri(sourceUrl);
        setUri(null);
        setIsReady(false);
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, []);

  const status: AudioStatus = player.currentStatus;
  return {
    player,
    status,
    uri,
    isDownloading,
    downloadProgress,
    downloadError,
    isReady,
    usingFallback,
    clearCache,
    isLooping,
    currentTime,
    totalPlayTime,
    startLoop,
    stopLoop,
  };
}

export default useCachedAudio;
