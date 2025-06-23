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
            const audioFiles = files.filter(file =>
                file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.m4a')
            );

            await Promise.all(
                audioFiles.map(file =>
                    FileSystem.deleteAsync(FileSystem.documentDirectory + file)
                )
            );

            console.log('All audio cache cleared');
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    }
}
