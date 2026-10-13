import { useEffect, useMemo, useRef, useState } from "react";
import { engine } from "../audio/engine";
import * as Q from "../lib/queue";
import { energyLevels } from "../lib/energy";
import { load, save } from "../lib/storage";
import { MusicContext } from "./useMusic";
import { useAnalysis } from "./useAnalysis";
import { useAutoDj } from "./useAutoDj";
import { useCrossfade } from "./useCrossfade";
import { useLibrary } from "./useLibrary";
import { useLyrics } from "./useLyrics";
import { usePlayback } from "./usePlayback";
import { usePlaylists } from "./usePlaylists";
import { useSongUrl } from "./useSongUrl";

// The library must load before saved state is parsed, so stored ids can be checked against it.
export const MusicProvider = ({ children }) => {
  const library = useLibrary();
  if (!library.ready) return <p className="empty-message loading">Loading your library…</p>;
  return <PlayerState library={library}>{children}</PlayerState>;
};

const PlayerState = ({ library, children }) => {
  const songs = library.songs;
  const songById = (id) => songs.find((song) => song.id === id) ?? null;
  const [saved] = useState(() => load(new Set(songs.map((song) => song.id))));
  const [queue, setQueue] = useState(saved.queue);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(saved.volume);
  const [repeat, setRepeat] = useState(saved.repeat);
  const [notice, setNotice] = useState(() =>
    library.dropped ? { text: "Some saved songs were damaged and skipped.", id: 0 } : null);
  const durationOf = (song) => song.durationSec;
  const { analysis, setTempo } = useAnalysis(songs);
  const energy = useMemo(() => energyLevels(Object.fromEntries(
    songs.filter((song) => typeof analysis[song.id] === "object").map((song) => [song.id, analysis[song.id]]),
  )), [songs, analysis]);
  const notify = (text) => setNotice({ text, id: Date.now() });
  const playlistState = usePlaylists(saved.playlists, notify);
  const { playlists } = playlistState;
  const saveFailed = useRef(false);

  const item = Q.current(queue);
  const currentTrack = item && songById(item.songId);

  const advance = ({ queue: nextQueue, stopped }) => {
    setQueue(nextQueue);
    if (stopped) setIsPlaying(false);
  };

  const lyrics = useLyrics(currentTrack?.id, library.lyricsVersion);
  const positionToSave = usePlayback({
    url: useSongUrl(currentTrack),
    currentQid: queue.currentQid,
    isPlaying,
    setIsPlaying,
    volume,
    restorePosition: saved.position,
    // Repeat "one" keeps the same queue item, so nothing reloads: restart the deck here.
    onEnded: () => {
      const result = Q.afterEnded(queue, repeat);
      advance(result);
      if (result.queue.currentQid !== queue.currentQid || result.stopped) return;
      engine.seek(0);
      engine.play().catch(() => setIsPlaying(false));
    },
  });

  const { settings, setSettings } = useCrossfade({
    saved: saved.settings, queue, repeat, isPlaying, advance, songById, durationOf, notify,
    analysisOf: (songId) => analysis[songId],
  });

  const persist = useRef(null);
  useEffect(() => {
    persist.current = () => {
      if (save({ queue, volume, repeat, playlists, settings, position: positionToSave() }) || saveFailed.current) return;
      saveFailed.current = true;
      setNotice({ text: "Couldn't save. Changes will be lost on refresh.", id: Date.now() });
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => persist.current(), 300);
    return () => clearTimeout(timer);
  }, [queue, volume, repeat, playlists, settings]);

  // Position changes constantly; save it every 5 s while playing and when the page goes away.
  useEffect(() => {
    const saveNow = () => persist.current();
    window.addEventListener("pagehide", saveNow);
    const timer = isPlaying ? setInterval(saveNow, 5000) : null;
    return () => {
      window.removeEventListener("pagehide", saveNow);
      clearInterval(timer);
      saveNow();
    };
  }, [isPlaying]);

  const autoDj = useAutoDj({ songs, songById, analysis, energy, queue, setQueue, setIsPlaying, notify });

  const value = {
    songs,
    songById,
    ...playlistState,
    durationOf,
    settings,
    setSettings,
    lyrics,
    analysisOf: (songId) => analysis[songId],
    energyOf: (songId) => energy[songId],
    setTempo,
    imports: library.imports,
    importing: library.busy,
    importFiles: library.add,
    clearImports: library.clearImports,
    // ids: an array of song ids (one for the song menu, many from select mode).
    removeFromLibrary: async (ids) => {
      const nextQueue = ids.reduce(Q.removeSong, queue);
      setQueue(nextQueue);
      if (!nextQueue.currentQid) setIsPlaying(false);
      ids.forEach(playlistState.forgetSong);
      await library.remove(ids);
      notify(ids.length === 1 ? "Removed from your library" : `Removed ${ids.length} songs from your library`);
    },
    queue,
    currentQid: queue.currentQid,
    currentTrack,
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
    ...autoDj,
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
    // After 3 s, or at the first item, Previous restarts the current track.
    prevTrack: () => {
      const previous = Q.prev(queue);
      if (engine.currentTime() > 3 || previous === queue) return engine.seek(0);
      setQueue(previous);
    },
    seek: engine.seek,
  };

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
};
