import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

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

    useEffect(() => {
        let active = true;
        if (sourceUrl) {
            getCachedUri(sourceUrl).then(u => {
                if (active) setUri(u);
            });
        } else {
            setUri(null);
        }
        return () => { active = false };
    }, [sourceUrl]);

    const player = useAudioPlayer(uri);
    const status = useAudioPlayerStatus(player);

    return { player, status, uri };
}

export default useCachedAudio;
