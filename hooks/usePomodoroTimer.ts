import { usePomodoroStore } from "@/stores/pomodoro-store";
import { useSettingsStore } from "@/stores/setting-store";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { useEffect, useRef } from "react";

/**
 * Custom hook to manage the pomodoro timer interval
 * Handles starting/stopping intervals based on timer status
 * Also handles metronome tick sounds
 */
export function usePomodoroTimer(soundEnabled: boolean) {
  const { timerStatus, tick } = usePomodoroStore();
  const { metronome, focusDuration, breakDuration, notifications } =
    useSettingsStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const metronomeEnabledRef = useRef(metronome);
  const metronomePlayerRef = useRef<AudioPlayer | null>(null);

  // Update refs when settings change
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    metronomeEnabledRef.current = metronome;
  }, [metronome]);

  // Pre-load metronome sound for better performance
  useEffect(() => {
    const loadMetronome = async () => {
      if (metronome && !metronomePlayerRef.current) {
        try {
          const player = await createAudioPlayer(
            require("@/assets/sounds/metronome.mp3")
          );
          metronomePlayerRef.current = player;
        } catch (error) {
          console.error("Failed to load metronome sound:", error);
        }
      }
    };

    loadMetronome();

    // Cleanup metronome player when disabled
    if (!metronome && metronomePlayerRef.current) {
      metronomePlayerRef.current.remove();
      metronomePlayerRef.current = null;
    }
  }, [metronome]);

  // Play metronome tick
  const playMetronomeTick = async () => {
    if (!metronomeEnabledRef.current || !soundEnabledRef.current) return;

    try {
      if (metronomePlayerRef.current) {
        // Reset to beginning and play
        metronomePlayerRef.current.seekTo(0);
        metronomePlayerRef.current.play();
      }
    } catch (error) {
      console.error("Error playing metronome tick:", error);
    }
  };

  // Stop metronome sound instantly
  const stopMetronomeSound = () => {
    try {
      if (metronomePlayerRef.current) {
        metronomePlayerRef.current.pause();
        metronomePlayerRef.current.seekTo(0);
      }
    } catch (error) {
      console.error("Error stopping metronome sound:", error);
    }
  };

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop metronome sound when timer is not running
    if (timerStatus !== "running") {
      stopMetronomeSound();
    }

    // Start interval if timer is running
    if (timerStatus === "running") {
      intervalRef.current = setInterval(() => {
        // Play metronome tick before calling tick
        playMetronomeTick();
        tick(
          soundEnabledRef.current,
          focusDuration,
          breakDuration,
          notifications
        );
      }, 1000);
    }

    // Cleanup on unmount or status change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Stop metronome sound on cleanup
      stopMetronomeSound();
    };
  }, [timerStatus, tick]);

  // Cleanup metronome player on unmount
  useEffect(() => {
    return () => {
      if (metronomePlayerRef.current) {
        metronomePlayerRef.current.remove();
        metronomePlayerRef.current = null;
      }
    };
  }, []);
}
