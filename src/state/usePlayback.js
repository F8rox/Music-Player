import { useEffect, useRef } from "react";
import { engine } from "../audio/engine";

// Keeps the engine in step with React state. The provider owns the state; the engine owns audio.
export const usePlayback = ({ url, currentQid, isPlaying, setIsPlaying, volume, restorePosition, onEnded }) => {
  const pendingSeek = useRef(restorePosition);
  const latestOnEnded = useRef(onEnded);

  useEffect(() => {
    latestOnEnded.current = onEnded;
  });

  // currentQid is a dependency so a duplicate song (same url, new queue item) reloads from 0.
  useEffect(() => {
    engine.load(url);
  }, [url, currentQid]);

  useEffect(() => {
    // An imported song's object URL arrives async; play() before that would reject.
    if (!url) return;
    if (!isPlaying) {
      engine.pause();
      return;
    }
    // AbortError just means a newer src replaced this play() call; that one is still playing.
    engine.play().catch((error) => error.name !== "AbortError" && setIsPlaying(false));
  }, [isPlaying, url, currentQid, setIsPlaying]);

  useEffect(() => {
    engine.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    const offs = [
      engine.on("loadedmetadata", (e) => {
        // Restore the saved position once, after a reload.
        if (pendingSeek.current > 0) engine.seek(Math.min(pendingSeek.current, e.target.duration));
        pendingSeek.current = 0;
      }),
      engine.on("ended", () => latestOnEnded.current()),
      engine.on("error", () => setIsPlaying(false)),
    ];
    return () => offs.forEach((off) => off());
  }, [setIsPlaying]);

  // Position to save: the not-yet-applied restore point wins, so reloading twice keeps it.
  return () => Math.floor(pendingSeek.current || engine.currentTime());
};
