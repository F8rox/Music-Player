import { useEffect, useState } from "react";
import { getBlob } from "../library/db";

// One object URL per imported song, shared and reference-counted. A deck may still be playing
// a URL after the hook that made it moves on (a crossfade hands "next" over to "current"), and
// revoking it then breaks later reads (seen as MediaError 2). Revoke only when nobody uses it.
const urls = new Map(); // songId → { url, count, timer }
const GRACE_MS = 2000; // lets a release and re-acquire in the same render settle first

const acquire = async (id) => {
  const hit = urls.get(id);
  if (hit) {
    hit.count += 1;
    clearTimeout(hit.timer);
    return hit.url;
  }
  const blob = await getBlob(id);
  if (!blob) return null;
  if (urls.has(id)) return acquire(id); // another caller created it while we were reading
  const url = URL.createObjectURL(blob);
  urls.set(id, { url, count: 1, timer: null });
  return url;
};

const release = (id) => {
  const hit = urls.get(id);
  if (!hit) return;
  hit.count -= 1;
  if (hit.count > 0) return;
  hit.timer = setTimeout(() => {
    if (hit.count > 0) return;
    URL.revokeObjectURL(hit.url);
    urls.delete(id);
  }, GRACE_MS);
};

// The song's shared object URL, null while loading.
export const useSongUrl = (song) => {
  const [loaded, setLoaded] = useState(null);

  useEffect(() => {
    if (!song) return;
    let live = true;
    let held = false;
    acquire(song.id).then((url) => {
      if (!url) return;
      held = true;
      if (live) setLoaded({ id: song.id, url });
      else release(song.id);
    });
    return () => {
      live = false;
      if (held) release(song.id);
    };
  }, [song]);

  if (!song) return null;
  return loaded?.id === song.id ? loaded.url : null;
};
