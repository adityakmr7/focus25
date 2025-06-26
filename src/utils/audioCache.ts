// utils/audioCache.ts
import * as FileSystem from 'expo-file-system';

export class AudioCacheManager {
    static getLocalUri(remoteUri: string): string {
        const filename = remoteUri.split('/').pop() || 'audio.mp3';
        return FileSystem.documentDirectory + filename;
    }

    static async preDownloadAudio(urls: string[]): Promise<void> {
        const downloadPromises = urls.map(async (url) => {
            const localUri = this.getLocalUri(url);
            const info = await FileSystem.getInfoAsync(localUri);

            if (!info.exists) {
                try {
                    await FileSystem.downloadAsync(url, localUri);
                    console.log('Pre-downloaded:', url);
                } catch (error) {
                    console.error('Failed to pre-download:', url, error);
                }
            }
        });

        await Promise.allSettled(downloadPromises);
    }

    static async downloadAudioIfNeeded(remoteUri: string): Promise<string> {
        const localUri = this.getLocalUri(remoteUri);
        const info = await FileSystem.getInfoAsync(localUri);
        if (info.exists) {
            return localUri;
        }
        try {
            await FileSystem.downloadAsync(remoteUri, localUri);
            return localUri;
        } catch (error) {
            console.error('Failed to download audio:', remoteUri, error);
            throw error;
        }
    }

    static async downloadAudioWithProgress(remoteUri: string, onProgress: (progress: number) => void): Promise<string> {
        const localUri = this.getLocalUri(remoteUri);
        const info = await FileSystem.getInfoAsync(localUri);
        if (info.exists) {
            onProgress(1);
            return localUri;
        }
        try {
            const downloadResumable = FileSystem.createDownloadResumable(
                remoteUri,
                localUri,
                {},
                (downloadProgressEvent) => {
                    const progress =
                        downloadProgressEvent.totalBytesWritten /
                        downloadProgressEvent.totalBytesExpectedToWrite;
                    onProgress(Math.min(progress, 1));
                },
            );
            const result = await downloadResumable.downloadAsync();
            if (result?.uri) {
                onProgress(1);
                return result.uri;
            } else {
                throw new Error('Download failed - no URI returned');
            }
        } catch (error) {
            console.error('Failed to download audio with progress:', remoteUri, error);
            throw error;
        }
    }

    static async clearCacheForUri(remoteUri: string): Promise<void> {
        const localUri = this.getLocalUri(remoteUri);
        const info = await FileSystem.getInfoAsync(localUri);
        if (info.exists) {
            try {
                await FileSystem.deleteAsync(localUri);
                console.log('Cache cleared for:', remoteUri);
            } catch (error) {
                console.error('Failed to clear cache for:', remoteUri, error);
            }
        }
    }

    static async getCacheSize(): Promise<Boolean> {
        try {
            const info = await FileSystem.getInfoAsync(FileSystem.documentDirectory!);
            return info.exists || false;
        } catch {
            return false;
        }
    }

    static async clearAllCache(): Promise<void> {
        try {
            const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory!);
            const audioFiles = files.filter(
                (file) => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a'),
            );

            await Promise.all(
                audioFiles.map((file) =>
                    FileSystem.deleteAsync(FileSystem.documentDirectory + file),
                ),
            );

            console.log('All audio cache cleared');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }
}

// Export getLocalUri as a standalone function for convenience
export const getLocalUri = AudioCacheManager.getLocalUri;
