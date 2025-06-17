import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, AudioSource } from 'expo-audio';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../providers/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get('window');
const MUSIC_SETTINGS_KEY = 'music_settings';

interface MusicTrack {
  id: string;
  name: string;
  duration: string;
  type: 'nature' | 'focus' | 'ambient' | 'binaural';
  description: string;
  source: AudioSource;
  color: string;
  isLocal: boolean;
}

interface MusicSettings {
  volume: number;
  autoPlay: boolean;
  fadeInOut: boolean;
  lastPlayedTrack: string | null;
  favoriteTrackIds: string[];
}

const defaultSettings: MusicSettings = {
  volume: 0.7,
  autoPlay: false,
  fadeInOut: true,
  lastPlayedTrack: null,
  favoriteTrackIds: [],
};

// Using the existing audio file for all tracks (in a real app, you'd have different files)
const musicTracks: MusicTrack[] = [
  {
    id: 'forest-rain',
    name: 'Forest Rain',
    duration: '45:00',
    type: 'nature',
    description: 'Gentle rainfall in a peaceful forest',
    source: require('../../assets/sounds/smooth-completed-notify-starting-alert.mp3'),
    color: '#10B981',
    isLocal: true,
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    duration: '60:00',
    type: 'nature',
    description: 'Calming ocean sounds for deep focus',
    source: require('../../assets/sounds/smooth-completed-notify-starting-alert.mp3'),
    color: '#3B82F6',
    isLocal: true,
  },
  {
    id: 'binaural-alpha',
    name: 'Alpha Waves',
    duration: '30:00',
    type: 'binaural',
    description: 'Alpha waves for enhanced concentration',
    source: require('../../assets/sounds/smooth-completed-notify-starting-alert.mp3'),
    color: '#8B5CF6',
    isLocal: true,
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    duration: '∞',
    type: 'ambient',
    description: 'Pure white noise for blocking distractions',
    source: require('../../assets/sounds/smooth-completed-notify-starting-alert.mp3'),
    color: '#6B7280',
    isLocal: true,
  },
  {
    id: 'cafe-ambiance',
    name: 'Cafe Ambiance',
    duration: '40:00',
    type: 'ambient',
    description: 'Cozy coffee shop atmosphere',
    source: require('../../assets/sounds/smooth-completed-notify-starting-alert.mp3'),
    color: '#F59E0B',
    isLocal: true,
  },
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    duration: '25:00',
    type: 'focus',
    description: 'Specially designed for Pomodoro sessions',
    source: require('../../assets/sounds/smooth-completed-notify-starting-alert.mp3'),
    color: '#EF4444',
    isLocal: true,
  },
];

interface EnhancedFocusMusicPlayerProps {
  onClose: () => void;
  autoStartTrack?: string;
}

export const EnhancedFocusMusicPlayer: React.FC<EnhancedFocusMusicPlayerProps> = ({
  onClose,
  autoStartTrack,
}) => {
  const { theme } = useTheme();
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<MusicSettings>(defaultSettings);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [filteredType, setFilteredType] = useState<string>('all');

  const player = useAudioPlayer(
    selectedTrack ? musicTracks.find(t => t.id === selectedTrack)?.source : null
  );

  const waveAnimation = useSharedValue(0);
  const volumeAnimation = useSharedValue(settings.volume);

  useEffect(() => {
    loadSettings();
    
    if (autoStartTrack) {
      const track = musicTracks.find(t => t.id === autoStartTrack);
      if (track) {
        setSelectedTrack(autoStartTrack);
        if (settings.autoPlay) {
          handlePlay(autoStartTrack);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      waveAnimation.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        false
      );
    } else {
      waveAnimation.value = withTiming(0.3, { duration: 300 });
    }
  }, [isPlaying]);

  useEffect(() => {
    volumeAnimation.value = withTiming(settings.volume, { duration: 300 });
  }, [settings.volume]);

  const loadSettings = async () => {
    try {
      const settingsString = await AsyncStorage.getItem(MUSIC_SETTINGS_KEY);
      if (settingsString) {
        const savedSettings = JSON.parse(settingsString);
        setSettings({ ...defaultSettings, ...savedSettings });
        
        if (savedSettings.lastPlayedTrack) {
          setSelectedTrack(savedSettings.lastPlayedTrack);
        }
      }
    } catch (error) {
      console.error('Failed to load music settings:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<MusicSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(MUSIC_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Failed to save music settings:', error);
    }
  };

  const handlePlay = async (trackId: string) => {
    try {
      if (selectedTrack !== trackId) {
        setSelectedTrack(trackId);
        await saveSettings({ lastPlayedTrack: trackId });
      }

      if (isPlaying && selectedTrack === trackId) {
        await player.pause();
        setIsPlaying(false);
      } else {
        await player.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play track:', error);
      Alert.alert('Playback Error', 'Failed to play the selected track.');
    }
  };

  const handleVolumeChange = (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, settings.volume + delta));
    saveSettings({ volume: newVolume });
    // Apply volume to player
    // Note: expo-audio volume control would be implemented here
  };

  const toggleFavorite = (trackId: string) => {
    const favorites = settings.favoriteTrackIds.includes(trackId)
      ? settings.favoriteTrackIds.filter(id => id !== trackId)
      : [...settings.favoriteTrackIds, trackId];
    
    saveSettings({ favoriteTrackIds: favorites });
  };

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'nature': return 'leaf';
      case 'focus': return 'radio';
      case 'ambient': return 'cafe';
      case 'binaural': return 'pulse';
      default: return 'musical-note';
    }
  };

  const getFilteredTracks = () => {
    if (filteredType === 'all') return musicTracks;
    if (filteredType === 'favorites') {
      return musicTracks.filter(track => settings.favoriteTrackIds.includes(track.id));
    }
    return musicTracks.filter(track => track.type === filteredType);
  };

  const waveStyle = useAnimatedStyle(() => ({
    opacity: waveAnimation.value,
    transform: [{ scale: interpolate(waveAnimation.value, [0, 1], [0.8, 1.2]) }],
  }));

  const volumeStyle = useAnimatedStyle(() => ({
    width: `${volumeAnimation.value * 100}%`,
  }));

  const renderTrackItem = ({ item }: { item: MusicTrack }) => {
    const isSelected = selectedTrack === item.id;
    const isFavorite = settings.favoriteTrackIds.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.trackItem,
          { backgroundColor: theme.background },
          isSelected && {
            backgroundColor: item.color + '15',
            borderColor: item.color,
            borderWidth: 1,
          },
        ]}
        onPress={() => handlePlay(item.id)}
      >
        <View style={[styles.trackIcon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={getTrackIcon(item.type) as any} size={20} color={item.color} />
        </View>

        <View style={styles.trackInfo}>
          <View style={styles.trackHeader}>
            <Text style={[styles.trackName, { color: theme.text }]}>{item.name}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? '#EF4444' : theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.trackDescription, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
          <Text style={[styles.trackDuration, { color: theme.textSecondary }]}>
            {item.duration}
          </Text>
        </View>

        {isSelected && isPlaying && (
          <Animated.View style={[styles.playingIndicator, waveStyle]}>
            <View style={[styles.waveBar, { backgroundColor: item.color }]} />
            <View style={[styles.waveBar, { backgroundColor: item.color }]} />
            <View style={[styles.waveBar, { backgroundColor: item.color }]} />
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedTrackData = musicTracks.find(track => track.id === selectedTrack);

  return (
    <Modal visible={true} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.playerContainer, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.musicIcon, { backgroundColor: theme.accent + '20' }]}>
                <Ionicons name="musical-notes" size={24} color={theme.accent} />
              </View>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>Focus Music</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Choose your perfect focus soundtrack
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setShowSettings(!showSettings)}
                style={[styles.settingsButton, { backgroundColor: theme.background }]}
              >
                <Ionicons name="settings" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: theme.background }]}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterContainer}>
            {['all', 'nature', 'focus', 'ambient', 'binaural', 'favorites'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  filteredType === filter && { backgroundColor: theme.accent + '20' }
                ]}
                onPress={() => setFilteredType(filter)}
              >
                <Ionicons
                  name={
                    filter === 'all' ? 'apps' :
                    filter === 'nature' ? 'leaf' :
                    filter === 'focus' ? 'radio' :
                    filter === 'ambient' ? 'cafe' :
                    filter === 'binaural' ? 'pulse' :
                    'heart'
                  }
                  size={16}
                  color={filteredType === filter ? theme.accent : theme.textSecondary}
                />
                <Text style={[
                  styles.filterText,
                  { color: filteredType === filter ? theme.accent : theme.textSecondary }
                ]}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Settings Panel */}
          {showSettings && (
            <Animated.View style={[styles.settingsPanel, { backgroundColor: theme.background }]}>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Auto-play</Text>
                <TouchableOpacity
                  onPress={() => saveSettings({ autoPlay: !settings.autoPlay })}
                  style={[
                    styles.toggle,
                    { backgroundColor: settings.autoPlay ? theme.accent : theme.surface }
                  ]}
                >
                  <View style={[
                    styles.toggleThumb,
                    { backgroundColor: '#fff' },
                    settings.autoPlay && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>

              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Fade in/out</Text>
                <TouchableOpacity
                  onPress={() => saveSettings({ fadeInOut: !settings.fadeInOut })}
                  style={[
                    styles.toggle,
                    { backgroundColor: settings.fadeInOut ? theme.accent : theme.surface }
                  ]}
                >
                  <View style={[
                    styles.toggleThumb,
                    { backgroundColor: '#fff' },
                    settings.fadeInOut && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Track List */}
          <FlatList
            data={getFilteredTracks()}
            renderItem={renderTrackItem}
            keyExtractor={(item) => item.id}
            style={styles.trackList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.trackListContent}
          />

          {/* Now Playing Section */}
          {selectedTrack && selectedTrackData && (
            <View style={[styles.nowPlaying, { borderTopColor: theme.background }]}>
              <View style={styles.nowPlayingHeader}>
                <Text style={[styles.nowPlayingTitle, { color: theme.text }]}>
                  Now Playing
                </Text>
                <Text style={[styles.nowPlayingTrack, { color: theme.textSecondary }]}>
                  {selectedTrackData.name}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressContainer, { backgroundColor: theme.background }]}>
                <Animated.View style={[styles.progressBar, { backgroundColor: selectedTrackData.color }, volumeStyle]} />
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.background }]}
                  onPress={() => handleVolumeChange(-0.1)}
                >
                  <Ionicons name="volume-low" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: selectedTrackData.color }]}
                  onPress={() => handlePlay(selectedTrack)}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={28}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, { backgroundColor: theme.background }]}
                  onPress={() => handleVolumeChange(0.1)}
                >
                  <Ionicons name="volume-high" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Volume Indicator */}
              <View style={styles.volumeContainer}>
                <Text style={[styles.volumeText, { color: theme.textSecondary }]}>
                  Volume: {Math.round(settings.volume * 100)}%
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  playerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: height * 0.9,
    minHeight: height * 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  musicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsPanel: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  trackList: {
    flex: 1,
    marginBottom: 20,
  },
  trackListContent: {
    gap: 8,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  trackIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  trackInfo: {
    flex: 1,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
  },
  trackDescription: {
    fontSize: 13,
    marginBottom: 4,
  },
  trackDuration: {
    fontSize: 12,
    fontWeight: '500',
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    opacity: 0.8,
  },
  nowPlaying: {
    paddingTop: 20,
    borderTopWidth: 1,
  },
  nowPlayingHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nowPlayingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  nowPlayingTrack: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  volumeContainer: {
    alignItems: 'center',
  },
  volumeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});