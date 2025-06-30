// hooks/useCachedAudio.ts
import { useEffect, useState } from 'react';
import { AudioStatus, useAudioPlayer } from 'expo-audio';
import { AudioCacheManager } from '../utils/audioCache';

export function useCachedAudio(sourceUrl: string | null) {
    const [uri, setUri] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!sourceUrl) {
            setUri(null);
            setDownloadError(null);
            setIsDownloading(false);
            setIsReady(false);
            return;
        }

        const checkAndDownload = async () => {
            try {
                setDownloadError(null);
                setIsReady(false);
                setIsDownloading(true);
                setDownloadProgress(0);

                const localUri = await AudioCacheManager.downloadAudioWithProgress(
                    sourceUrl,
                    (progress) => setDownloadProgress(progress),
                );
                setUri(localUri);
                setIsReady(true);
            } catch (error) {
                setDownloadError(error instanceof Error ? error.message : 'Download failed');
                setUri(null);
                setIsReady(false);
            } finally {
                setIsDownloading(false);
            }
        };

        checkAndDownload();
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
        clearCache,
    };
}

export default useCachedAudio;
