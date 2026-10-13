import { useEffect, useState } from "react";
import { getCover } from "../library/db";

// One object URL per song's cover, shared and reference-counted; revoked when the last user lets go.
const urls = new Map(); // songId → { url, count }

const acquire = async (id) => {
  const hit = urls.get(id);
  if (hit) {
    hit.count += 1;
    return hit.url;
  }
  const blob = await getCover(id);
  if (!blob) return null;
  if (urls.has(id)) return acquire(id); // another caller created it while we were reading
  const url = URL.createObjectURL(blob);
  urls.set(id, { url, count: 1 });
  return url;
};

const release = (id) => {
  const hit = urls.get(id);
  if (!hit || --hit.count > 0) return;
  URL.revokeObjectURL(hit.url);
  urls.delete(id);
};

// The cover's URL, or null while loading or when the song has none. Reads nothing until `wanted`.
export const useCoverUrl = (songId, wanted) => {
  const [loaded, setLoaded] = useState({ id: null, url: null });

  useEffect(() => {
    if (!wanted) return;
    let live = true;
    let held = false;
    acquire(songId).then((url) => {
      if (!url) return;
      held = true;
      if (live) setLoaded({ id: songId, url });
      else release(songId);
    });
    return () => {
      live = false;
      if (held) release(songId);
    };
  }, [songId, wanted]);

  return loaded.id === songId ? loaded.url : null;
};
