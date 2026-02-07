/**
 * Audio playback hook (native)
 *
 * Uses expo-audio's AudioPlayer API for playback.
 * A shared singleton player ensures only one recording plays at a time.
 */
import { useState, useCallback, useEffect } from "react";
import {
  createAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";

// Shared singleton player — ensures only one recording plays at a time
let sharedPlayer: ReturnType<typeof createAudioPlayer> | null = null;
let activeUri: string | null = null;

function getPlayer() {
  if (!sharedPlayer) {
    sharedPlayer = createAudioPlayer(null, 250);
  }
  return sharedPlayer;
}

export function useAudioPlayer() {
  const player = getPlayer();
  const status = useAudioPlayerStatus(player);
  const [currentUri, setCurrentUri] = useState<string | null>(activeUri);

  // Sync currentUri when playback finishes
  useEffect(() => {
    if (status.didJustFinish) {
      activeUri = null;
      setCurrentUri(null);
    }
  }, [status.didJustFinish]);

  const play = useCallback(
    async (uri: string) => {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });

      if (activeUri !== uri) {
        player.replace({ uri });
        activeUri = uri;
      }
      setCurrentUri(uri);
      player.play();
    },
    [player],
  );

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  return {
    play,
    pause,
    isPlaying: status.playing,
    progress: status.currentTime,
    duration: status.duration,
    currentUri,
  };
}
