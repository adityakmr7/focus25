import {useEffect, useState} from 'react';
import * as FileSystem from 'expo-file-system';
import {useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';

async function getCachedUri(remoteUri: string) {
    const filename = remoteUri.split('/').pop()!;
    const localUri = FileSystem.documentDirectory + filename;
    const info = await FileSystem.getInfoAsync(localUri);
    if (!info.exists) {
        const { uri } = await FileSystem.downloadAsync(remoteUri, localUri);
        return uri;
    }
    return localUri;
}

export function useCachedAudio(sourceUrl: string | null) {
    const [uri, setUri] = useState<string | null>(null);
    // 🔥 NEW: Add loading state to track download progress
    const [isDownloading, setIsDownloading] = useState(false);
    // 🔥 NEW: Add error state
    const [downloadError, setDownloadError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        if (sourceUrl) {
            // 🔥 CHANGED: Add proper loading and error handling
            setIsDownloading(true);
            setDownloadError(null);
            getCachedUri(sourceUrl)
                .then(u => {
                    if (active) {
                        setUri(u);
                        setIsDownloading(false);
                    }
                })
                .catch(error => {
                    if (active) {
                        console.error('Failed to cache audio:', error);
                        setDownloadError(error.message);
                        setIsDownloading(false);
                    }
                });
        } else {
            setUri(null);
            setIsDownloading(false);
            setDownloadError(null);
        }
        return () => { active = false };
    }, [sourceUrl]);

    const player = useAudioPlayer(uri);
    const status = useAudioPlayerStatus(player);

    // 🔥 NEW: Return additional states
    return {
        player,
        status,
        uri,
        isDownloading,
        downloadError
    };
}

export default useCachedAudio;
