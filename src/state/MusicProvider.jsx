import { useEffect, useRef, useState } from "react";
import { songs } from "../data/songs";
import * as Q from "../lib/queue";
import { load, save } from "../lib/storage";
import { MusicContext } from "./useMusic";
import { useDurations } from "./useDurations";

const songIds = new Set(songs.map((song) => song.id));
const songById = (id) => songs.find((song) => song.id === id) ?? null;

export const MusicProvider = ({ children }) => {
  const [saved] = useState(() => load(songIds));
  const [queue, setQueue] = useState(saved.queue);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(saved.volume);
  const [notice, setNotice] = useState(null);
  const durations = useDurations(songs);
  const saveFailed = useRef(false);

  const notify = (text) => setNotice({ text, id: Date.now() });
  const savedSecond = Math.floor(currentTime);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (save({ queue, volume, position: savedSecond }) || saveFailed.current) return;
      saveFailed.current = true;
      setNotice({ text: "Couldn't save. Changes will be lost on refresh.", id: Date.now() });
    }, 300);
    return () => clearTimeout(timer);
  }, [queue, volume, savedSecond]);

  const item = Q.current(queue);

  const value = {
    songs,
    durations,
    songById,
    queue,
    currentQid: queue.currentQid,
    currentTrack: item && songById(item.songId),
    restorePosition: saved.position,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    notice,
    playFromList: (ids, index) => {
      setQueue(Q.fromList(ids, index));
      setIsPlaying(true);
    },
    playQid: (qid) => {
      setQueue((q) => ({ ...q, currentQid: qid }));
      setIsPlaying(true);
    },
    playNext: (songId) => {
      const qid = Q.newQid();
      setQueue((q) => Q.insertNext(q, songId, qid));
      notify("Playing next");
    },
    addToQueue: (songId) => {
      const qid = Q.newQid();
      setQueue((q) => Q.append(q, songId, qid));
      notify("Added to queue");
    },
    removeFromQueue: (qid) => setQueue((q) => Q.remove(q, qid)),
    // shortcut: always wraps (repeat "all") until Unit 06 adds the repeat toggle.
    nextTrack: () => setQueue((q) => Q.next(q, "all").queue),
    // Returns false at the first item so the player restarts the track instead.
    prevTrack: () => {
      const previous = Q.prev(queue);
      setQueue(previous);
      return previous !== queue;
    },
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};
