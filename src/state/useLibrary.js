import { useEffect, useState } from "react";
import { deleteSong, listSongs } from "../library/db";
import { importFile } from "../library/importFiles";

// Imported songs from IndexedDB. songs === null while loading.
export const useLibrary = () => {
  const [songs, setSongs] = useState(null);
  const [dropped, setDropped] = useState(0);
  const [imports, setImports] = useState([]);

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
    for (const [i, file] of files.entries()) {
      const { status, song } = await importFile(file);
      setImports((list) => list.map((entry, j) => (j === i ? { ...entry, status } : entry)));
      if (song) setSongs((list) => [...list, song]);
    }
  };

  const remove = async (id) => {
    await deleteSong(id);
    setSongs((list) => list.filter((song) => song.id !== id));
  };

  return {
    ready: songs !== null, songs: songs ?? [], dropped, imports, busy, add, remove,
    clearImports: () => setImports([]),
  };
};
