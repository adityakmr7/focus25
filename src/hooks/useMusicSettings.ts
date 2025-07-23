import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MUSIC_SETTINGS_KEY = 'music_settings';

interface MusicSettings {
    volume: number;
    autoPlay: boolean;
    fadeInOut: boolean;
    lastPlayedTrack: string | null;
    favoriteTrackIds: string[];
    shuffleMode: boolean;
    repeatMode: 'none' | 'one' | 'all';
}

const defaultSettings: MusicSettings = {
    volume: 0.7,
    autoPlay: false,
    fadeInOut: true,
    lastPlayedTrack: null,
    favoriteTrackIds: [],
    shuffleMode: false,
    repeatMode: 'none',
};

export const useMusicSettings = () => {
    const [settings, setSettings] = useState<MusicSettings>(defaultSettings);

    // Load settings from storage
    const loadSettings = useCallback(async () => {
        try {
            const saved = await AsyncStorage.getItem(MUSIC_SETTINGS_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setSettings({ ...defaultSettings, ...parsed });
                return { ...defaultSettings, ...parsed };
            }
            return defaultSettings;
        } catch (error) {
            console.error('Failed to load music settings:', error);
            return defaultSettings;
        }
    }, []);

    // Save settings to storage
    const saveSettings = useCallback(
        async (newSettings: Partial<MusicSettings>) => {
            try {
                const updatedSettings = { ...settings, ...newSettings };
                setSettings(updatedSettings);
                await AsyncStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify(updatedSettings));
                return updatedSettings;
            } catch (error) {
                console.error('Failed to save music settings:', error);
                return settings;
            }
        },
        [settings],
    );

    // Handle volume change
    const handleVolumeChange = useCallback(
        async (delta: number) => {
            const newVolume = Math.max(0, Math.min(1, settings.volume + delta));
            return await saveSettings({ volume: newVolume });
        },
        [settings.volume, saveSettings],
    );

    return {
        settings,
        loadSettings,
        saveSettings,
        handleVolumeChange,
    };
};