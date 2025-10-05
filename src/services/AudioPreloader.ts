// services/AudioPreloader.ts
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MusicTrack } from '../utils/constants';
const PRELOAD_STATUS_KEY = 'audio_preload_status';

interface PreloadStatus {
  [trackId: string]: {
    downloaded: boolean;
    localUri: string | null;
    downloadedAt: number;
  };
}

export class AudioPreloader {
  private static instance: AudioPreloader;
  private preloadStatus: PreloadStatus = {};

  static getInstance(): AudioPreloader {
    if (!AudioPreloader.instance) {
      AudioPreloader.instance = new AudioPreloader();
    }
    return AudioPreloader.instance;
  }

  async loadPreloadStatus() {
    try {
      const status = await AsyncStorage.getItem(PRELOAD_STATUS_KEY);
      if (status) {
        this.preloadStatus = JSON.parse(status);
      }
    } catch (error) {
      console.error('Failed to load preload status:', error);
    }
  }

  async savePreloadStatus() {
    try {
      await AsyncStorage.setItem(
        PRELOAD_STATUS_KEY,
        JSON.stringify(this.preloadStatus)
      );
    } catch (error) {
      console.error('Failed to save preload status:', error);
    }
  }

  async preloadAllTracks(
    tracks: MusicTrack[],
    onProgress?: (progress: number) => void
  ) {
    await this.loadPreloadStatus();

    let completed = 0;
    const total = tracks.length;

    for (const track of tracks) {
      try {
        // Skip if already downloaded and file exists
        if (this.preloadStatus[track.id]?.downloaded) {
          const localUri = this.preloadStatus[track.id].localUri;
          if (localUri) {
            const info = await FileSystem.getInfoAsync(localUri);
            if (info.exists) {
              completed++;
              onProgress?.(completed / total);
              continue;
            }
          }
        }

        const localUri = await this.downloadTrack(track);
        this.preloadStatus[track.id] = {
          downloaded: true,
          localUri,
          downloadedAt: Date.now(),
        };

        completed++;
        onProgress?.(completed / total);
      } catch (error) {
        console.error(`Failed to preload track ${track.id}:`, error);
        this.preloadStatus[track.id] = {
          downloaded: false,
          localUri: null,
          downloadedAt: Date.now(),
        };
      }
    }

    await this.savePreloadStatus();
  }

  private async downloadTrack(track: MusicTrack): Promise<string> {
    const filename = track.source.split('/').pop() || `${track.id}.mp3`;
    const localUri = FileSystem.documentDirectory + filename;

    const { uri } = await FileSystem.downloadAsync(track.source, localUri);
    return uri;
  }

  getLocalUri(trackId: string): string | null {
    return this.preloadStatus[trackId]?.localUri || null;
  }

  isTrackDownloaded(trackId: string): boolean {
    return this.preloadStatus[trackId]?.downloaded || false;
  }

  async clearCache() {
    for (const trackId in this.preloadStatus) {
      const localUri = this.preloadStatus[trackId].localUri;
      if (localUri) {
        try {
          await FileSystem.deleteAsync(localUri, { idempotent: true });
        } catch (error) {
          console.error(`Failed to delete ${localUri}:`, error);
        }
      }
    }
    this.preloadStatus = {};
    await this.savePreloadStatus();
  }
}
