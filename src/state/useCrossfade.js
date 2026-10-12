import { useEffect, useRef, useState } from "react";
import { engine } from "../audio/engine";
import * as Q from "../lib/queue";
import { canBeatMatch, planBeatMatch } from "../lib/beatmatch";
import { tempoOf } from "../lib/tempo";
import { planTransition } from "../lib/transition";
import { useSongUrl } from "./useSongUrl";

// Smart crossfade: when the current song reaches its outro, blend into the song that would
// play next. The queue advances as the fade starts (the incoming song is current from then on).
export const useCrossfade = ({ saved, queue, repeat, isPlaying, analysisOf, songById, durationOf, advance, notify }) => {
  const [settings, setSettings] = useState(saved);
  const ended = Q.afterEnded(queue, repeat);
  const currentItem = Q.current(queue);
  const nextItem = !ended.stopped && ended.queue.currentQid !== queue.currentQid ? Q.current(ended.queue) : null;
  const nextUrl = useSongUrl(nextItem ? songById(nextItem.songId) : null);
  const plan = currentItem && nextItem
    ? planTransition({
      current: analysisOf(currentItem.songId),
      next: analysisOf(nextItem.songId),
      duration: durationOf(songById(currentItem.songId)),
      settings,
      repeat,
    })
    : null;

  // Experimental: only when switched on and both tempos are trustworthy (Invariant 11).
  const a = currentItem && analysisOf(currentItem.songId);
  const b = nextItem && analysisOf(nextItem.songId);
  const beat = plan && settings.beatMatch && canBeatMatch(a, b) ? planBeatMatch(a, b, plan) : null;

  const latest = useRef(null);
  useEffect(() => {
    latest.current = { plan, beat, bpm: b && tempoOf(b), nextUrl, nextItem, ended, isPlaying, advance, notify };
  });

  useEffect(() => {
    if (beat && nextUrl && isPlaying) engine.prepareBeat(nextUrl, beat).catch(() => {});
  }, [beat?.offset, beat?.rate, nextUrl, isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (plan && nextUrl) engine.prepare(nextUrl, plan.nextOffset);
  }, [plan?.nextOffset, nextUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => engine.on("timeupdate", (e) => {
    const s = latest.current;
    if (!s?.plan || !s.nextUrl || !s.isPlaying || engine.transitioning()) return;
    // A beat-match is scheduled ~0.5 s ahead so it can start exactly on the beat.
    if (s.beat && e.target.currentTime >= s.beat.at - 0.5) {
      if (engine.beatMatchTo(s.nextUrl, { ...s.beat, key: s.nextItem.qid })) {
        s.notify(`Beat-matched (~${Math.round(s.bpm)} BPM)`);
        s.advance(s.ended);
        return;
      }
    }
    if (e.target.currentTime < s.plan.startAt) return;
    engine.crossfadeTo(s.nextUrl, { ...s.plan, key: s.nextItem.qid }).catch(() => engine.cancelTransition());
    s.advance(s.ended);
  }), []);

  // shortcut: any change to the queue's items mid-fade cancels it (even ones not touching the
  // incoming song); refine to "touches the incoming item" if that ever feels abrupt.
  useEffect(() => {
    engine.cancelTransition();
  }, [queue.items]);

  return { settings, setSettings };
};
