import { useCallback, useEffect, useRef, useState } from "react";
import { analyseBlob } from "../audio/analysis/analyse";
import { getBlob, listAnalysis, putAnalysis } from "../library/db";

const fetchBlob = async (song) => (song.url ? (await fetch(song.url)).blob() : getBlob(song.id));

// { [songId]: AnalysisResult | "pending" | "failed" }. Cached results load once; missing songs are
// analysed one at a time (Invariant 10), yielding between songs so the UI stays responsive.
export const useAnalysis = (songs) => {
  const [results, setResults] = useState(null); // null until the cache is read
  const queue = useRef([]);
  const queued = useRef(new Set());
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
        const blob = await fetchBlob(song);
        result = blob && (await analyseBlob(song.id, blob));
        if (result) await putAnalysis(song.id, result);
      } catch {
        result = null;
      }
      setResults((r) => ({ ...r, [song.id]: result ?? "failed" }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    running.current = false;
  }, []);

  useEffect(() => {
    if (!results) return;
    const missing = songs.filter((song) => !results[song.id] && !queued.current.has(song.id));
    if (missing.length === 0) return;
    missing.forEach((song) => queued.current.add(song.id));
    queue.current.push(...missing);
    setResults((r) => ({ ...r, ...Object.fromEntries(missing.map((song) => [song.id, "pending"])) }));
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
