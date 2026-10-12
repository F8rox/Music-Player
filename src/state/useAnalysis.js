import { useCallback, useEffect, useRef, useState } from "react";
import { analyseBlob } from "../audio/analysis/analyse";
import { ANALYSIS_VERSION } from "../audio/analysis/dsp";
import { getBlob, listAnalysis, putAnalysis } from "../library/db";

// { [songId]: AnalysisResult | "pending" | "failed" }. Cached results load once; missing or outdated
// songs are analysed one at a time (Invariant 10), yielding between songs so the UI stays responsive.
// An outdated result stays usable until its replacement arrives, and its tapped tempo carries over.
export const useAnalysis = (songs) => {
  const [results, setResults] = useState(null); // null until the cache is read
  const queue = useRef([]);
  const queued = useRef(new Set());
  const carried = useRef({}); // songId → bpmOverride from the outdated result being replaced
  const running = useRef(false);

  useEffect(() => {
    let live = true;
    listAnalysis().then((cached) => live && setResults(cached), () => live && setResults({}));
    return () => {
      live = false;
    };
  }, []);

  // Stable: it only touches refs and the state setter.
  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    while (queue.current.length) {
      const song = queue.current.shift();
      let result = null;
      try {
        const blob = await getBlob(song.id);
        result = blob && (await analyseBlob(song.id, blob));
        if (result) result.bpmOverride = carried.current[song.id] ?? null;
        if (result) await putAnalysis(song.id, result);
      } catch {
        result = null;
      }
      // A failed re-analysis keeps the outdated (still usable) result.
      setResults((r) => ({ ...r, [song.id]: result ?? (r[song.id]?.v ? r[song.id] : "failed") }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    running.current = false;
  }, []);

  useEffect(() => {
    if (!results) return;
    const outdated = (song) => results[song.id]?.v < ANALYSIS_VERSION;
    const missing = songs.filter((song) => (!results[song.id] || outdated(song)) && !queued.current.has(song.id));
    if (missing.length === 0) return;
    missing.forEach((song) => {
      queued.current.add(song.id);
      if (outdated(song)) carried.current[song.id] = results[song.id].bpmOverride;
    });
    queue.current.push(...missing);
    setResults((r) => ({ ...r, ...Object.fromEntries(missing.filter((song) => !outdated(song)).map((song) => [song.id, "pending"])) }));
    pump();
  }, [results, songs, pump]);

  const setTempo = async (songId, bpm) => {
    const current = results?.[songId];
    if (!current || typeof current !== "object") return;
    const updated = { ...current, bpmOverride: bpm };
    setResults((r) => ({ ...r, [songId]: updated }));
    await putAnalysis(songId, updated);
  };

  return { analysis: results ?? {}, setTempo };
};
