import { useCallback, useEffect, useRef, useState } from "react";

export function useLoopAudio(url: string | null) {
  const ref = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!url) {
      ref.current = null;
      setPlaying(false);
      return;
    }

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.6;
    audio.preload = "auto";

    ref.current = audio;

    const onPlay = () => {
      setPlaying(true);
      setBlocked(false);
    };

    const onPause = () => setPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    const timer = window.setTimeout(async () => {
      try {
        await audio.play();
        setBlocked(false);
      } catch {
        setBlocked(true);
      }
    }, 3000);

    return () => {
      window.clearTimeout(timer);

      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);

      audio.src = "";

      ref.current = null;
      setPlaying(false);
    };
  }, [url]);

  const play = useCallback(async () => {
    const audio = ref.current;
    if (!audio) return;

    try {
      await audio.play();
      setBlocked(false);
    } catch {
      setBlocked(true);
    }
  }, []);

  const pause = useCallback(() => {
    ref.current?.pause();
  }, []);

  const toggle = useCallback(async () => {
    if (ref.current?.paused) {
      await play();
    } else {
      pause();
    }
  }, [play, pause]);

  return {
    playing,
    blocked,
    available: !!url,
    play,
    pause,
    toggle,
  };
}
