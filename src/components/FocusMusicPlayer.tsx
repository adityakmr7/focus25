import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FocusMusicPlayerProps {
  onClose: () => void;
}

export const FocusMusicPlayer: React.FC<FocusMusicPlayerProps> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState('Nature Sounds');

  const tracks = [
    'Nature Sounds',
    'White Noise',
    'Rain Sounds',
    'Ocean Waves',
    'Forest Ambience'
  ];

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const selectTrack = (track: string) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus Music</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#48BB78" />
        </TouchableOpacity>
      </View>

      <View style={styles.currentTrack}>
        <Text style={styles.trackName}>{currentTrack}</Text>
        <TouchableOpacity onPress={togglePlayback} style={styles.playButton}>
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={32} 
            color="#48BB78" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.trackList}>
        {tracks.map((track, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => selectTrack(track)}
            style={[
              styles.trackItem,
              currentTrack === track && styles.activeTrack
            ]}
          >
            <Text style={[
              styles.trackText,
              currentTrack === track && styles.activeTrackText
            ]}>
              {track}
            </Text>
            {currentTrack === track && isPlaying && (
              <Ionicons name="volume-high" size={16} color="#48BB78" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentTrack: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
    borderRadius: 12,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 12,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(72, 187, 120, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackList: {
    gap: 8,
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  activeTrack: {
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
  },
  trackText: {
    fontSize: 14,
    color: '#4A5568',
  },
  activeTrackText: {
    color: '#48BB78',
    fontWeight: '600',
  },
});