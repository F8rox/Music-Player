import { useEffect, useState } from "react";
import { deleteSong, listSongs, putLyrics } from "../library/db";
import { importFile, readLyrics } from "../library/importFiles";
import { isLrcName, matchSong, stemOf } from "../lib/lrc";

// Imported songs from IndexedDB. songs === null while loading.
export const useLibrary = () => {
  const [songs, setSongs] = useState(null);
  const [dropped, setDropped] = useState(0);
  const [imports, setImports] = useState([]);
  const [lyricsVersion, setLyricsVersion] = useState(0); // bumps when lyrics are attached, so the open song reloads them

  useEffect(() => {
    let live = true;
    listSongs().then(
      (result) => {
        if (!live) return;
        setSongs(result.songs);
        setDropped(result.dropped);
      },
      () => live && setSongs([]),
    );
    return () => {
      live = false;
    };
  }, []);

  const busy = imports.some((entry) => entry.status === "pending");

  // One file at a time (memory); the UI disables import while busy so batches never interleave.
  const add = async (files) => {
    if (busy || files.length === 0) return;
    navigator.storage?.persist?.();
    setImports(files.map((file, i) => ({ key: `${Date.now()}-${i}`, name: file.name, status: "pending" })));
    const setStatus = (i, status) => setImports((list) => list.map((entry, j) => (j === i ? { ...entry, status } : entry)));
    const sameBatch = []; // audio from this import, matched by file name first
    for (const [i, file] of files.entries()) {
      if (isLrcName(file.name)) continue;
      const { status, song, id } = await importFile(file);
      setStatus(i, status);
      if (song) setSongs((list) => [...list, song]);
      if (song || id) sameBatch.push({ id: song?.id ?? id, names: [stemOf(file.name)] });
    }
    // Lyrics: the audio file with the same name, else the one library song with that title.
    const library = (songs ?? []).map((s) => ({ id: s.id, names: [s.title, `${s.artist} - ${s.title}`, `${s.title} - ${s.artist}`] }));
    for (const [i, file] of files.entries()) {
      if (!isLrcName(file.name)) continue;
      const { text, status } = await readLyrics(file);
      const id = text && (matchSong(stemOf(file.name), sameBatch) ?? matchSong(stemOf(file.name), library));
      if (id) {
        await putLyrics(id, text);
        setLyricsVersion((v) => v + 1);
      }
      setStatus(i, status ?? (id ? "lyrics-added" : "no-match"));
    }
  };

  const remove = async (ids) => {
    await Promise.all(ids.map(deleteSong));
    setSongs((list) => list.filter((song) => !ids.includes(song.id)));
  };

  return {
    ready: songs !== null, songs: songs ?? [], dropped, imports, busy, add, remove, lyricsVersion,
    clearImports: () => setImports([]),
  };
};
