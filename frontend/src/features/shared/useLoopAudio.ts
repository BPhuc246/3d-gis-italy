import { useEffect, useRef, useState } from "react";

// play() chỉ được gọi từ sự kiện click do trình duyệt chặn autoplay
export function useLoopAudio(url: string | null) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!url) return;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.6;
    ref.current = audio;
    return () => {
      audio.pause();
      ref.current = null;
      setPlaying(false);
    };
  }, [url]);

  const toggle = async () => {
    const audio = ref.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return { playing, toggle, available: !!url };
}
