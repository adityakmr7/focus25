// hooks/useCachedAudio.ts
import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { AudioStatus, useAudioPlayer } from 'expo-audio';

function getLocalUri(remoteUri: string) {
    const filename = remoteUri.split('/').pop() || 'audio.mp3';
    return FileSystem.documentDirectory + filename;
}

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

        const localUri = getLocalUri(sourceUrl);

        const checkAndDownload = async () => {
            try {
                setDownloadError(null);
                setIsReady(false);

                // Check if file already exists
                const info = await FileSystem.getInfoAsync(localUri);

                if (info.exists) {
                    console.log('Audio already cached:', localUri);
                    setUri(localUri);
                    setIsReady(true);
                    return;
                }

                // File doesn't exist, download it
                console.log('Downloading audio:', sourceUrl);
                setIsDownloading(true);
                setDownloadProgress(0);

                const downloadResumable = FileSystem.createDownloadResumable(
                    sourceUrl,
                    localUri,
                    {},
                    (downloadProgress) => {
                        const progress =
                            downloadProgress.totalBytesWritten /
                            downloadProgress.totalBytesExpectedToWrite;
                        setDownloadProgress(Math.min(progress, 1));
                    },
                );

                const downloadResult = await downloadResumable.downloadAsync();

                if (downloadResult?.uri) {
                    console.log('Audio downloaded successfully:', downloadResult.uri);
                    setUri(downloadResult.uri);
                    setDownloadProgress(1);
                    setIsReady(true);
                } else {
                    throw new Error('Download failed - no URI returned');
                }
            } catch (error) {
                console.error('Failed to download audio:', error);
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
                const localUri = getLocalUri(sourceUrl);
                const info = await FileSystem.getInfoAsync(localUri);
                if (info.exists) {
                    await FileSystem.deleteAsync(localUri);
                    setUri(null);
                    setIsReady(false);
                    console.log('Cache cleared for:', sourceUrl);
                }
            } catch (error) {
                console.error('Failed to clear cache:', error);
            }
        }
    };

    console.log('useCachedAudio:', {
        uri,
        isReady,
        isDownloading,
        downloadProgress,
        downloadError,
        player,
    });
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
