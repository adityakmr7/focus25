import React, {useCallback, useEffect, useImperativeHandle, useMemo, useState} from 'react';
import {Alert, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import BottomSheet, {BottomSheetBackdrop, BottomSheetFlatList, BottomSheetView} from '@gorhom/bottom-sheet';
import {useTheme} from '../providers/ThemeProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BottomSheetMethods} from "@gorhom/bottom-sheet/lib/typescript/types";
import useCachedAudio from "../hooks/useCachedAudio";
import {MusicTrack, musicTracks} from "../utils/constants";

const MUSIC_SETTINGS_KEY = 'music_settings';

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

interface BottomSheetMusicPlayerProps {
  bottomSheetRef: React.RefObject<BottomSheetMethods>;
  autoStartTrack?: string;
  miniAudioPlayerRef:any
}

export const BottomSheetMusicPlayer: React.FC<BottomSheetMusicPlayerProps> = ({
  miniAudioPlayerRef,
                                                                                bottomSheetRef,
                                                                                autoStartTrack,
                                                                              }) => {
  const { theme } = useTheme();
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<MusicSettings>(defaultSettings);
  const [currentTime, setCurrentTime] = useState<any>(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [filteredType, setFilteredType] = useState<string>('all');
  // 🔥 NEW: Add loading state for better UX
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);

  // 🔥 CHANGED: Get additional states from the hook
  const { player, status, uri, isDownloading, downloadError, downloadProgress } = useCachedAudio(
      selectedTrack ? musicTracks.find(t => t.id === selectedTrack)?.source || null : null
  );


  const waveAnimation = useSharedValue(0);
  const volumeAnimation = useSharedValue(settings.volume);

  // Bottom sheet snap points
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  // Backdrop component
  const renderBackdrop = useCallback(
      (props: any) => (
          <BottomSheetBackdrop
              {...props}
              disappearsOnIndex={-1}
              appearsOnIndex={0}
              opacity={0.5}
          />
      ),
      []
  );

  useEffect(() => {
    loadSettings();
    if (autoStartTrack) {
      const track = musicTracks.find(t => t.id === autoStartTrack);
      if (track) {
        setSelectedTrack(autoStartTrack);
        // 🔥 CHANGED: Don't auto-play immediately, wait for loading
        // Auto-play will be handled in the status effect
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

  // 🔥 CHANGED: Improved status handling with proper loading states
  useEffect(() => {
    if (!status) return;

    setDuration(player.duration || 0);
    setCurrentTime(player.currentTime || 0);
    // Handle track finishing
    if (player.currentStatus.didJustFinish) {
      setIsPlaying(false);
      if (player && status.isLoaded) {
        player.seekTo(0);
      }
    }

    // 🔥 NEW: Handle auto-play when track is loaded
    if (player.isLoaded && selectedTrack && settings.autoPlay && !isPlaying && isLoadingTrack) {
      setIsLoadingTrack(false);
      handlePlayPause();
    } else if (player.isLoaded && isLoadingTrack) {
      setIsLoadingTrack(false);
    }

    // 🔥 NEW: Set initial volume when track loads
    if (player.isLoaded && player && settings.volume !== 1) {
      player.volume = settings.volume;
    }
  }, [ selectedTrack, settings.autoPlay, isLoadingTrack]);

  // 🔥 NEW: Handle download errors
  useEffect(() => {
    if (downloadError) {
      Alert.alert('Download Error', 'Failed to download the audio file. Please check your internet connection.');
      setIsLoadingTrack(false);
    }
  }, [downloadError]);

  // 🔥 COMPLETELY REWRITTEN: Fixed the main play function
  const handlePlay = async (trackId: string) => {
    try {
      // If selecting a different track
      if (selectedTrack !== trackId) {
        // Stop current playback first
        if (isPlaying && player && status.isLoaded) {
          player.pause();
          setIsPlaying(false);
        }

        // Set loading state and new track
        setIsLoadingTrack(true);
        setSelectedTrack(trackId);
        await saveSettings({ lastPlayedTrack: trackId });

        // The useEffect will handle auto-play when loaded
        return;
      }

      // Toggle play/pause for same track
      await handlePlayPause();
    } catch (error) {
      console.error('Failed to handle track selection:', error);
      Alert.alert('Playback Error', 'Failed to play the selected track.');
      setIsLoadingTrack(false);
    }
  };

  // 🔥 NEW: Separate function for play/pause logic
  const handlePlayPause = async () => {
    try {
      if (!player) {
        Alert.alert('Error', 'Audio player not available');
        return;
      }

      if (player.currentStatus.playbackState !== "readyToPlay") {
        Alert.alert('Loading...', 'Please wait for the track to download');
        return;
      }

      if (!player.isLoaded) {
        Alert.alert('Loading...', 'Please wait for the track to load');
        return;
      }

      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        player.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to toggle playback:', error);
      Alert.alert('Playback Error', 'Failed to control playback.');
    }
  };

  // 🔥 CHANGED: Fixed volume control method
  const handleVolumeChange = async (delta: number) => {
    const newVolume = Math.max(0, Math.min(1, settings.volume + delta));
    await saveSettings({ volume: newVolume });

    // Apply volume to player if available and loaded
    if (player && player.isLoaded) {
      player.volume = newVolume; // 🔥 CHANGED: Use direct property assignment
    }
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
    // 🔥 NEW: Show loading state for selected track
    const isCurrentlyLoading = isSelected && (isDownloading || isLoadingTrack);

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
            // 🔥 NEW: Disable interaction while loading
            disabled={isCurrentlyLoading}
        >
          <View style={[styles.trackIcon, { backgroundColor: item.color + '20' }]}>
            {/* 🔥 NEW: Show loading indicator */}
            {isCurrentlyLoading ? (
                <View style={styles.loadingContainer}>
                  <Ionicons name="cloud-download" size={20} color={item.color} />
                  {isDownloading && downloadProgress > 0 && (
                      <Text style={[styles.progressText, { color: item.color }]}>
                        {Math.round(downloadProgress * 100)}%
                      </Text>
                  )}
                </View>
            ) : (
                <Ionicons name={getTrackIcon(item.type) as any} size={20} color={item.color} />
            )}
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

  useImperativeHandle(miniAudioPlayerRef,() =>{
    return {
      handlePlayPause,
      handleVolumeChange,
      selectedTrackData,
      settings,
      player,
      volumeStyle,
      isPlaying
    }
  },[isPlaying,player,settings,selectedTrackData,player]);
  return (
      <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: theme.surface }}
          handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <BottomSheetView style={styles.contentContainer}>
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

            <TouchableOpacity
                onPress={() => setShowSettings(!showSettings)}
                style={[styles.settingsButton, { backgroundColor: theme.background }]}
            >
              <Ionicons name="settings" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
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
          <BottomSheetFlatList
              data={getFilteredTracks()}
              renderItem={renderTrackItem}
              keyExtractor={(item) => item.id}
              style={styles.trackList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.trackListContent}
          />

        </BottomSheetView>
      </BottomSheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 24,
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
  settingsButton: {
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
  // 🔥 NEW: Loading text style
  loadingText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
