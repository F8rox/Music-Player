import { useEffect, useState } from "react";
import { getLyrics } from "../library/db";

// Parsed lyrics for one song ([] when it has none). `version` changes when lyrics are attached.
export const useLyrics = (songId, version) => {
  const [loaded, setLoaded] = useState({ id: null, lines: [] });

  useEffect(() => {
    let live = true;
    if (songId) getLyrics(songId).then((lines) => live && setLoaded({ id: songId, lines }), () => live && setLoaded({ id: songId, lines: [] }));
    return () => {
      live = false;
    };
  }, [songId, version]);

  return loaded.id === songId ? loaded.lines : [];
};
