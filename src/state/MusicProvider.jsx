import { useEffect, useMemo, useRef, useState } from "react";
import { songs as bundled } from "../data/songs";
import * as Q from "../lib/queue";
import { load, save } from "../lib/storage";
import { MusicContext } from "./useMusic";
import { useDurations } from "./useDurations";
import { useLibrary } from "./useLibrary";

// The library must load before saved state is parsed, so stored ids can be checked against it.
export const MusicProvider = ({ children }) => {
  const library = useLibrary();
  if (!library.ready) return <p className="empty-message loading">Loading your library…</p>;
  return <PlayerState library={library}>{children}</PlayerState>;
};

const PlayerState = ({ library, children }) => {
  const songs = useMemo(() => [...bundled, ...library.songs], [library.songs]);
  const songById = (id) => songs.find((song) => song.id === id) ?? null;
  const [saved] = useState(() => load(new Set(songs.map((song) => song.id))));
  const [queue, setQueue] = useState(saved.queue);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(saved.volume);
  const [repeat, setRepeat] = useState(saved.repeat);
  const [notice, setNotice] = useState(() =>
    library.dropped ? { text: "Some saved songs were damaged and skipped.", id: 0 } : null);
  const probed = useDurations(bundled);
  const saveFailed = useRef(false);

  const notify = (text) => setNotice({ text, id: Date.now() });
  const savedSecond = Math.floor(currentTime);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (save({ queue, volume, repeat, position: savedSecond }) || saveFailed.current) return;
      saveFailed.current = true;
      setNotice({ text: "Couldn't save. Changes will be lost on refresh.", id: Date.now() });
    }, 300);
    return () => clearTimeout(timer);
  }, [queue, volume, repeat, savedSecond]);

  const item = Q.current(queue);

  const advance = ({ queue: nextQueue, stopped }) => {
    setQueue(nextQueue);
    if (stopped) setIsPlaying(false);
  };

  const value = {
    songs,
    songById,
    durationOf: (song) => probed[song.id] ?? song.durationSec,
    imports: library.imports,
    importing: library.busy,
    importFiles: library.add,
    clearImports: library.clearImports,
    removeFromLibrary: async (songId) => {
      const nextQueue = Q.removeSong(queue, songId);
      setQueue(nextQueue);
      if (!nextQueue.currentQid) setIsPlaying(false);
      await library.remove(songId);
      notify("Removed from your library");
    },
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
    repeat,
    shuffled: queue.shuffled,
    playFromList: (ids, index) => {
      const fresh = Q.fromList(ids, index);
      // Shuffle on: the clicked song plays first, the rest of the list is shuffled behind it.
      setQueue(queue.shuffled ? Q.shuffle(Q.move(fresh, fresh.currentQid, 0)) : fresh);
      setIsPlaying(true);
    },
    toggleShuffle: () => setQueue(queue.shuffled ? Q.unshuffle(queue) : Q.shuffle(queue)),
    cycleRepeat: () => setRepeat({ off: "all", all: "one", one: "off" }[repeat]),
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
    moveInQueue: (qid, toIndex) => setQueue((q) => Q.move(q, qid, toIndex)),
    // The Next button skips even with repeat "one"; only repeat "off" stops at the end.
    nextTrack: () => advance(Q.next(queue, repeat === "off" ? "off" : "all")),
    // Returns true when the same item should replay (repeat "one").
    trackEnded: () => {
      const result = Q.afterEnded(queue, repeat);
      advance(result);
      return result.queue.currentQid === queue.currentQid && !result.stopped;
    },
    // Returns false at the first item so the player restarts the track instead.
    prevTrack: () => {
      const previous = Q.prev(queue);
      setQueue(previous);
      return previous !== queue;
    },
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};
