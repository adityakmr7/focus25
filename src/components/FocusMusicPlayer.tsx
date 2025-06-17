import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';

interface FocusMusicPlayerProps {
  onClose: () => void;
}

const musicTracks = [
  { id: 1, name: 'Forest Rain', duration: '45:00', type: 'nature' },
  { id: 2, name: 'Ocean Waves', duration: '60:00', type: 'nature' },
  { id: 3, name: 'Binaural Beats', duration: '30:00', type: 'focus' },
  { id: 4, name: 'White Noise', duration: '∞', type: 'ambient' },
  { id: 5, name: 'Cafe Ambiance', duration: '40:00', type: 'ambient' },
  { id: 6, name: 'Deep Focus', duration: '25:00', type: 'focus' },
];

export const FocusMusicPlayer: React.FC<FocusMusicPlayerProps> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
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

  const renderTrackItem = ({ item }: { item: typeof musicTracks[0] }) => (
    <TouchableOpacity
      style={[
        styles.trackItem,
        { backgroundColor: theme.surface },
        selectedTrack === item.id && { backgroundColor: theme.accent + '20' },
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
        <Text style={[styles.trackDuration, { color: theme.textSecondary }]}>{item.duration}</Text>
      </View>
      {selectedTrack === item.id && (
        <TouchableOpacity onPress={togglePlayPause}>
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={24} 
            color={getTrackColor(item.type)} 
          />
        </TouchableOpacity>
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
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Focus Music</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.background }]}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={musicTracks}
            renderItem={renderTrackItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.trackList}
            showsVerticalScrollIndicator={false}
          />

          {selectedTrack && (
            <View style={[styles.nowPlaying, { borderTopColor: theme.background }]}>
              <Text style={[styles.nowPlayingText, { color: theme.textSecondary }]}>
                {isPlaying ? '🎵 Now Playing' : '⏸️ Paused'}
              </Text>
              <View style={styles.controls}>
                <TouchableOpacity style={[styles.controlButton, { backgroundColor: theme.background }]}>
                  <Ionicons name="volume-low" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.playButton, { backgroundColor: theme.accent }]}
                  onPress={togglePlayPause}
                >
                  <Ionicons 
                    name={isPlaying ? "pause" : "play"} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.controlButton, { backgroundColor: theme.background }]}>
                  <Ionicons name="volume-high" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  playerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackList: {
    flex: 1,
    marginBottom: 20,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  trackIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
  },
  trackDuration: {
    fontSize: 14,
    marginTop: 2,
  },
  nowPlaying: {
    paddingTop: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  nowPlayingText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});