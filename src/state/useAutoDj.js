import { useState } from "react";
import { foldBpm } from "../audio/analysis/dsp";
import { arrange } from "../lib/arrange";
import { keyOf } from "../lib/key";
import * as Q from "../lib/queue";
import { radio } from "../lib/radio";
import { tempoOf } from "../lib/tempo";
import { toPoint } from "../lib/vibe";

// The Auto-DJ actions: Arrange (with undo), Start radio and Draw your vibe. They read analysis and
// energy, and only change the queue through the setters the provider passes in.
export const useAutoDj = ({ songs, songById, analysis, energy, queue, setQueue, setIsPlaying, notify }) => {
  // shortcut: undo lives in memory only (lost on refresh); persist it if users ask.
  const [arrangeUndo, setArrangeUndo] = useState(null); // { before, after } item arrays

  return {
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
  };
};
