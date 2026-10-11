import { useEffect, useState } from "react";
import { getBlob } from "../library/db";

// Bundled songs have a static URL. Imported songs get an object URL for as long as
// they're loaded in the player, revoked on change (Invariant 9). null while loading.
export const useSongUrl = (song) => {
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    if (!song || song.url) return;
    let live = true;
    let objectUrl = null;
    getBlob(song.id).then((blob) => {
      if (!live || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setLoaded({ id: song.id, url: objectUrl });
    });
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [song]);

  if (!song) return null;
  if (song.url) return song.url;
  return loaded?.id === song.id ? loaded.url : null;
};
