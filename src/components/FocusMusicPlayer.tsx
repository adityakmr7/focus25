import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
    const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

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

    return (
        <View style={styles.overlay}>
            <View style={styles.playerContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Focus Music</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <View style={styles.trackList}>
                    {musicTracks.map((track) => (
                        <TouchableOpacity
                            key={track.id}
                            style={[
                                styles.trackItem,
                                selectedTrack === track.id && styles.selectedTrack,
                            ]}
                            onPress={() => handleTrackSelect(track.id)}
                        >
                            <View style={[
                                styles.trackIcon,
                                { backgroundColor: getTrackColor(track.type) + '20' }
                            ]}>
                                <Ionicons 
                                    name={getTrackIcon(track.type)} 
                                    size={20} 
                                    color={getTrackColor(track.type)} 
                                />
                            </View>
                            <View style={styles.trackInfo}>
                                <Text style={styles.trackName}>{track.name}</Text>
                                <Text style={styles.trackDuration}>{track.duration}</Text>
                            </View>
                            {selectedTrack === track.id && (
                                <TouchableOpacity onPress={togglePlayPause}>
                                    <Ionicons 
                                        name={isPlaying ? "pause" : "play"} 
                                        size={24} 
                                        color={getTrackColor(track.type)} 
                                    />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedTrack && (
                    <View style={styles.nowPlaying}>
                        <Text style={styles.nowPlayingText}>
                            {isPlaying ? '🎵 Now Playing' : '⏸️ Paused'}
                        </Text>
                        <View style={styles.controls}>
                            <TouchableOpacity style={styles.controlButton}>
                                <Ionicons name="volume-low" size={20} color="#6B7280" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.playButton}
                                onPress={togglePlayPause}
                            >
                                <Ionicons 
                                    name={isPlaying ? "pause" : "play"} 
                                    size={24} 
                                    color="#FFFFFF" 
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.controlButton}>
                                <Ionicons name="volume-high" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
    },
    playerContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: 400,
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
        color: '#1F2937',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackList: {
        maxHeight: 240,
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    selectedTrack: {
        backgroundColor: '#F0FDF4',
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
        color: '#1F2937',
    },
    trackDuration: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    nowPlaying: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        alignItems: 'center',
    },
    nowPlayingText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
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
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },
});