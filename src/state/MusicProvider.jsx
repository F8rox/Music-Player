import { useEffect, useMemo, useRef, useState } from "react";
import { engine } from "../audio/engine";
import { songs as bundled } from "../data/songs";
import * as Q from "../lib/queue";
import { foldBpm } from "../audio/analysis/dsp";
import { arrange } from "../lib/arrange";
import { energyLevels } from "../lib/energy";
import { keyOf } from "../lib/key";
import { radio } from "../lib/radio";
import { toPoint } from "../lib/vibe";
import { load, save } from "../lib/storage";
import { tempoOf } from "../lib/tempo";
import { MusicContext } from "./useMusic";
import { useAnalysis } from "./useAnalysis";
import { useCrossfade } from "./useCrossfade";
import { useDurations } from "./useDurations";
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
  const songs = useMemo(() => [...bundled, ...library.songs], [library.songs]);
  const songById = (id) => songs.find((song) => song.id === id) ?? null;
  const [saved] = useState(() => load(new Set(songs.map((song) => song.id))));
  const [queue, setQueue] = useState(saved.queue);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(saved.volume);
  const [repeat, setRepeat] = useState(saved.repeat);
  // shortcut: undo lives in memory only (lost on refresh); persist it if users ask.
  const [arrangeUndo, setArrangeUndo] = useState(null); // { before, after } item arrays
  const [notice, setNotice] = useState(() =>
    library.dropped ? { text: "Some saved songs were damaged and skipped.", id: 0 } : null);
  const probed = useDurations(bundled);
  const durationOf = (song) => probed[song.id] ?? song.durationSec;
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
    removeFromLibrary: async (songId) => {
      const nextQueue = Q.removeSong(queue, songId);
      setQueue(nextQueue);
      if (!nextQueue.currentQid) setIsPlaying(false);
      playlistState.forgetSong(songId);
      await library.remove(songId);
      notify("Removed from your library");
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
    // Undo stays offered until the items change (playing on doesn't count; a drag/add/remove does).
    canUndoArrange: arrangeUndo?.after === queue.items,
    arrangeQueue: () => {
      const upcoming = Q.upcomingItems(queue);
      if (upcoming.length < 4) return notify("Add a few more songs to arrange");
      const info = Object.fromEntries(upcoming.map(({ songId }) => {
        const bpm = tempoOf(analysis[songId]);
        return [songId, { energy: energy[songId], bpm: bpm && foldBpm(bpm) }];
      }));
      const arranged = Q.replaceUpcoming(queue, arrange(upcoming, info));
      setQueue(arranged);
      setArrangeUndo({ before: queue.items, after: arranged.items });
      notify(`Arranged ${upcoming.length} songs: build-up, peak, cool-down`);
    },
    undoArrange: () => {
      setQueue({ ...queue, items: arrangeUndo.before });
      setArrangeUndo(null);
    },
    // Analysed songs with a tempo, placed on the vibe map (x = tempo, y = energy).
    vibeSongs: songs.flatMap((song) => {
      const bpm = tempoOf(analysis[song.id]);
      if (!bpm || !Number.isFinite(energy[song.id])) return [];
      const folded = foldBpm(bpm);
      return [{ id: song.id, title: song.title, bpm: folded, energy: energy[song.id], ...toPoint({ bpm: folded, energy: energy[song.id] }) }];
    }),
    playVibe: (ids) => {
      setQueue(Q.fromList(ids, 0));
      setIsPlaying(true);
      notify(`Playing your vibe: ${ids.length} songs`);
    },
    // Radio replaces the whole queue (like playing a list), so the seed starts playing at once.
    startRadio: (seedId) => {
      const info = Object.fromEntries(songs.map(({ id }) => {
        const bpm = tempoOf(analysis[id]);
        return [id, { energy: energy[id], bpm: bpm && foldBpm(bpm), camelot: keyOf(analysis[id])?.camelot ?? null }];
      }));
      const picks = radio(seedId, info);
      if (picks.length < 2) return notify("Radio needs at least one other analysed song");
      setQueue(Q.fromRadio(picks));
      setIsPlaying(true);
      notify(`Radio: ${picks.length - 1} songs like ${songById(seedId).title}`);
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
