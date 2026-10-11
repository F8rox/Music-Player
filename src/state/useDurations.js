import { useEffect, useState } from "react";

// Probes each song's real duration once: { [songId]: seconds | null (failed) }.
export const useDurations = (songs) => {
  const [durations, setDurations] = useState({});

  useEffect(() => {
    let cancelled = false;
    const probe = new Audio();
    probe.preload = "metadata";
    const release = () => {
      probe.onloadedmetadata = probe.onerror = null;
      probe.removeAttribute("src");
      probe.load();
    };
    const run = async () => {
      // One file at a time so startup doesn't open five parallel downloads.
      for (const song of songs) {
        const duration = await new Promise((resolve) => {
          probe.onloadedmetadata = () => resolve(probe.duration);
          probe.onerror = () => resolve(null);
          probe.src = song.url;
        });
        if (cancelled) return;
        setDurations((prev) => ({ ...prev, [song.id]: duration }));
      }
      release();
    };
    run();
    return () => {
      cancelled = true;
      release();
    };
  }, [songs]);

  return durations;
};
