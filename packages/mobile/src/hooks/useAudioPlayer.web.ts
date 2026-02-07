/**
 * Audio playback hook (web)
 *
 * Uses the HTML5 Audio API for playback.
 * A shared singleton Audio element ensures only one recording plays at a time.
 */
import { useState, useCallback, useEffect, useRef } from "react";

// Shared singleton Audio element — ensures only one recording plays at a time
let sharedAudio: HTMLAudioElement | null = null;
let activeUri: string | null = null;

function getAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
  }
  return sharedAudio;
}

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentUri, setCurrentUri] = useState<string | null>(activeUri);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const audio = getAudio();

    const tick = () => {
      if (!audio.paused) {
        setProgress(audio.currentTime);
        setDuration(isFinite(audio.duration) ? audio.duration : 0);
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      setCurrentUri(activeUri);
      tick();
    };

    const onPause = () => {
      setIsPlaying(false);
      cancelAnimationFrame(rafRef.current);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      activeUri = null;
      setCurrentUri(null);
      cancelAnimationFrame(rafRef.current);
    };

    const onLoadedMetadata = () => {
      setDuration(isFinite(audio.duration) ? audio.duration : 0);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    // Sync initial state in case something is already playing
    setIsPlaying(!audio.paused && !!audio.src);
    setCurrentUri(activeUri);
    if (isFinite(audio.duration)) setDuration(audio.duration);
    setProgress(audio.currentTime);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const play = useCallback(async (uri: string) => {
    const audio = getAudio();

    if (activeUri !== uri) {
      audio.src = uri;
      activeUri = uri;
      setCurrentUri(uri);
    }

    await audio.play();
  }, []);

  const pause = useCallback(() => {
    getAudio().pause();
  }, []);

  return {
    play,
    pause,
    isPlaying,
    progress,
    duration,
    currentUri,
  };
}
