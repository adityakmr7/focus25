// hooks/useCachedAudio.ts
import { useEffect, useState, useRef } from 'react';
import { AudioStatus, useAudioPlayer } from 'expo-audio';
import { AudioCacheManager } from '../utils/audioCache';
import * as Network from 'expo-network';

const DOWNLOAD_TIMEOUT = 15000; // 15 seconds (faster timeout)
const MAX_RETRIES = 1; // Fewer retries for faster fallback
const FALLBACK_DELAY = 3000; // Start fallback after 3 seconds

export function useCachedAudio(sourceUrl: string | null) {
    const [uri, setUri] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [usingFallback, setUsingFallback] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

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
                
                for (let attempt = 0; attempt <= MAX_RETRIES && !abortControllerRef.current.signal.aborted; attempt++) {
                    try {
                        console.log(`Download attempt ${attempt + 1} for: ${sourceUrl}`);
                        
                        const localUri = await Promise.race([
                            AudioCacheManager.downloadAudioWithProgress(
                                sourceUrl,
                                (progress) => {
                                    if (!abortControllerRef.current?.signal.aborted) {
                                        setDownloadProgress(progress);
                                    }
                                },
                            ),
                            new Promise<never>((_, reject) => 
                                setTimeout(() => reject(new Error('Download timeout')), DOWNLOAD_TIMEOUT)
                            ),
                        ]);
                        
                        if (!abortControllerRef.current.signal.aborted) {
                            // Switch to downloaded file if successful
                            setUri(localUri);
                            setIsReady(true);
                            setUsingFallback(false);
                            setDownloadError(null);
                            downloadSuccess = true;
                            console.log(`Successfully downloaded and switched to local file: ${sourceUrl}`);
                            break;
                        }
                    } catch (error) {
                        console.warn(`Download attempt ${attempt + 1} failed:`, error);
                        
                        if (attempt < MAX_RETRIES) {
                            // Wait before retry (exponential backoff)
                            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                        }
                    }
                }

                // If download failed and we haven't set fallback yet
                if (!downloadSuccess && !uri && !abortControllerRef.current.signal.aborted) {
                    console.log('Download failed completely, using direct streaming fallback');
                    setUsingFallback(true);
                    setUri(sourceUrl);
                    setIsReady(true);
                    setDownloadError('Using direct streaming (may be slower)');
                }
                
            } catch (error) {
                if (!abortControllerRef.current?.signal.aborted) {
                    const errorMessage = error instanceof Error ? error.message : 'Download failed';
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
    };
}

export default useCachedAudio;
