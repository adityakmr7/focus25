import React from 'react'
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native'
import Animated from "react-native-reanimated";
import {Ionicons} from "@expo/vector-icons";
import {useTheme} from "../providers/ThemeProvider";
import {AudioPlayer} from "expo-audio";
import {MusicTrack} from "../utils/constants";


interface MiniAudioPlayerProps {
    isPlaying: boolean;
    isDownloading: boolean;
    isLoadingTrack: boolean;
    handlePlayPause: () => void;
    handleVolumeChange: (delta: number) => void;
    selectedTrackData: MusicTrack,
    settings: {
        volume: number;
    };
    player: AudioPlayer,
    volumeStyle:ViewStyle
}

const MiniAudioPlayer = ({
    isPlaying,
    isDownloading,
    isLoadingTrack, selectedTrackData,
    handleVolumeChange,
    handlePlayPause,
    settings,
    player,
    volumeStyle
                         }: MiniAudioPlayerProps) => {
    const { theme } = useTheme();
   return (
       <View style={[styles.nowPlaying, { borderTopColor: theme.background }]}>
           <View style={styles.nowPlayingHeader}>
               <Text style={[styles.nowPlayingTitle, { color: theme.text }]}>
                   Now Playing
               </Text>
               <Text style={[styles.nowPlayingTrack, { color: theme.textSecondary }]}>
                   {selectedTrackData.name}
               </Text>
               {/* 🔥 NEW: Show loading/downloading status */}
               {(isDownloading || isLoadingTrack) && (
                   <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                       {isDownloading ? 'Downloading...' : 'Loading...'}
                   </Text>
               )}
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
                   onPress={handlePlayPause} // 🔥 CHANGED: Use new function
                   disabled={isDownloading || !player.isLoaded} // 🔥 NEW: Disable when not ready
               >
                   <Ionicons
                       name={
                           isDownloading || isLoadingTrack ? "hourglass" : // 🔥 NEW: Show loading
                               isPlaying ? "pause" : "play"
                       }
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
   )
}


const styles = StyleSheet.create({

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

export default MiniAudioPlayer
