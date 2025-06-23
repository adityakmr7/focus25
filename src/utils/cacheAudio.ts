// utils/cacheAudio.ts
import * as FileSystem from 'expo-file-system';

export async function getCachedUri(remoteUri: string): Promise<string> {
    const filename = remoteUri.split('/').pop()!;
    const localUri = FileSystem.documentDirectory + filename;
    const info = await FileSystem.getInfoAsync(localUri);
    if (!info.exists) {
        await FileSystem.downloadAsync(remoteUri, localUri);
    }
    return localUri;
}

export async function cacheAllTracks(trackUrls: string[]) {
    const results = await Promise.allSettled(
        trackUrls.map(url => getCachedUri(url))
    );
    return results;
}
