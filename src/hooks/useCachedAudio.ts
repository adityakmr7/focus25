// hooks/useCachedAudio.ts
import {useEffect, useState} from 'react';
import * as FileSystem from 'expo-file-system';
import {useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';

function getLocalUri(remoteUri: string) {
    const filename = remoteUri.split('/').pop() || 'audio.mp3';
    return FileSystem.documentDirectory + filename;
}

export function useCachedAudio(sourceUrl: string | null) {
    const [uri, setUri] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    useEffect(() => {
        if (!sourceUrl) {
            setUri(null);
            setDownloadError(null);
            setIsDownloading(false);
            return;
        }

        const localUri = getLocalUri(sourceUrl);

        const checkAndDownload = async () => {
            try {
                setDownloadError(null);

                // Check if file already exists
                const info = await FileSystem.getInfoAsync(localUri);

                if (info.exists) {
                    console.log('Audio already cached:', localUri);
                    setUri(localUri);
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
                        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
                        console.log('Download progress:', progress); // Debug log
                        setDownloadProgress(Math.min(progress, 1)); // Ensure it doesn't exceed 1
                    }
                );

                const downloadResult = await downloadResumable.downloadAsync();

                if (downloadResult?.uri) {
                    console.log('Audio downloaded successfully:', downloadResult.uri);
                    setUri(downloadResult.uri);
                    setDownloadProgress(1); // Ensure it shows 100%
                } else {
                    throw new Error('Download failed - no URI returned');
                }

            } catch (error) {
                console.error('Failed to download audio:', error);
                setDownloadError(error instanceof Error ? error.message : 'Download failed');
                setUri(null);
            } finally {
                setIsDownloading(false);
                setDownloadProgress(0);
            }
        };

        checkAndDownload();
    }, [sourceUrl]);

    const player = useAudioPlayer(uri);
    const status = useAudioPlayerStatus(player);

    // Clear cache function
    const clearCache = async () => {
        if (sourceUrl) {
            try {
                const localUri = getLocalUri(sourceUrl);
                const info = await FileSystem.getInfoAsync(localUri);
                if (info.exists) {
                    await FileSystem.deleteAsync(localUri);
                    setUri(null);
                    console.log('Cache cleared for:', sourceUrl);
                }
            } catch (error) {
                console.error('Failed to clear cache:', error);
            }
        }
    };

    return {
        player,
        status,
        uri,
        isDownloading,
        downloadProgress,
        downloadError,
        clearCache,
    };
}

export default useCachedAudio;
