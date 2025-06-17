import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';

const { height } = Dimensions.get('window');

interface FocusMusicPlayerProps {
  onClose: () => void;
}

const musicTracks = [
  { id: 1, name: 'Forest Rain', duration: '45:00', type: 'nature', description: 'Gentle rainfall in a peaceful forest' },
  { id: 2, name: 'Ocean Waves', duration: '60:00', type: 'nature', description: 'Calming ocean sounds for deep focus' },
  { id: 3, name: 'Binaural Beats', duration: '30:00', type: 'focus', description: 'Alpha waves for enhanced concentration' },
  { id: 4, name: 'White Noise', duration: '∞', type: 'ambient', description: 'Pure white noise for blocking distractions' },
  { id: 5, name: 'Cafe Ambiance', duration: '40:00', type: 'ambient', description: 'Cozy coffee shop atmosphere' },
  { id: 6, name: 'Deep Focus', duration: '25:00', type: 'focus', description: 'Specially designed for Pomodoro sessions' },
  { id: 7, name: 'Mountain Stream', duration: '50:00', type: 'nature', description: 'Flowing water in mountain valleys' },
  { id: 8, name: 'Thunderstorm', duration: '35:00', type: 'nature', description: 'Distant thunder with gentle rain' },
];

export const FocusMusicPlayer: React.FC<FocusMusicPlayerProps> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [volume, setVolume] = useState(0.7);
  const { theme } = useTheme();

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'nature': return 'leaf';
      case 'focus': return 'radio';
      case 'ambient': return 'cafe';
      default: return 'musical-note';
    }
  };

  const getTrackColor = (type: string) => {
    switch (type) {
      case 'nature': return '#10B981';
      case 'focus': return '#3B82F6';
      case 'ambient': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleTrackSelect = (trackId: number) => {
    setSelectedTrack(trackId);
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const adjustVolume = (delta: number) => {
    setVolume(prev => Math.max(0, Math.min(1, prev + delta)));
  };

  const selectedTrackData = musicTracks.find(track => track.id === selectedTrack);

  const renderTrackItem = ({ item }: { item: typeof musicTracks[0] }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        { backgroundColor: theme.background },
        selectedTrack === item.id && { 
          backgroundColor: getTrackColor(item.type) + '15',
          borderColor: getTrackColor(item.type),
          borderWidth: 1,
        },
      ]}
      onPress={() => handleTrackSelect(item.id)}
    >
      <View style={[
        styles.trackIcon,
        { backgroundColor: getTrackColor(item.type) + '20' }
      ]}>
        <Ionicons 
          name={getTrackIcon(item.type) as any} 
          size={20} 
          color={getTrackColor(item.type)} 
        />
      </View>
      <View style={styles.trackInfo}>
        <Text style={[styles.trackName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.trackDescription, { color: theme.textSecondary }]}>
          {item.description}
        </Text>
        <Text style={[styles.trackDuration, { color: theme.textSecondary }]}>
          {item.duration}
        </Text>
      </View>
      {selectedTrack === item.id && (
        <View style={styles.playingIndicator}>
          <View style={[styles.waveBar, { backgroundColor: getTrackColor(item.type) }]} />
          <View style={[styles.waveBar, { backgroundColor: getTrackColor(item.type) }]} />
          <View style={[styles.waveBar, { backgroundColor: getTrackColor(item.type) }]} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
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
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.closeButton, { backgroundColor: theme.background }]}
            >
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Track Categories */}
          <View style={styles.categoriesContainer}>
            <View style={styles.categoryChip}>
              <Ionicons name="leaf" size={16} color="#10B981" />
              <Text style={[styles.categoryText, { color: '#10B981' }]}>Nature</Text>
            </View>
            <View style={styles.categoryChip}>
              <Ionicons name="radio" size={16} color="#3B82F6" />
              <Text style={[styles.categoryText, { color: '#3B82F6' }]}>Focus</Text>
            </View>
            <View style={styles.categoryChip}>
              <Ionicons name="cafe" size={16} color="#F59E0B" />
              <Text style={[styles.categoryText, { color: '#F59E0B' }]}>Ambient</Text>
            </View>
          </View>

          {/* Track List */}
          <FlatList
            data={musicTracks}
            renderItem={renderTrackItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.trackList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.trackListContent}
          />

          {/* Now Playing Section */}
          {selectedTrack && (
            <View style={[styles.nowPlaying, { borderTopColor: theme.background }]}>
              <View style={styles.nowPlayingHeader}>
                <Text style={[styles.nowPlayingTitle, { color: theme.text }]}>
                  Now Playing
                </Text>
                <Text style={[styles.nowPlayingTrack, { color: theme.textSecondary }]}>
                  {selectedTrackData?.name}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={[styles.progressContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.progressBar, { backgroundColor: theme.accent }]} />
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <TouchableOpacity 
                  style={[styles.controlButton, { backgroundColor: theme.background }]}
                  onPress={() => adjustVolume(-0.1)}
                >
                  <Ionicons name="volume-low" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.playButton, { backgroundColor: theme.accent }]}
                  onPress={togglePlayPause}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={28} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.controlButton, { backgroundColor: theme.background }]}
                  onPress={() => adjustVolume(0.1)}
                >
                  <Ionicons name="volume-high" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Volume Indicator */}
              <View style={styles.volumeContainer}>
                <Text style={[styles.volumeText, { color: theme.textSecondary }]}>
                  Volume: {Math.round(volume * 100)}%
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
    maxHeight: height * 0.85,
    minHeight: height * 0.6,
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
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
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
    width: '45%',
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