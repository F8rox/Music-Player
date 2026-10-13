import { useEffect, useRef, useState } from "react";
import { useMusic } from "../state/useMusic";
import { useCoverUrl } from "../state/useCoverUrl";

// A song's cover, or a tile in its energy colour with the title's first letter. Decorative: the title is
// always shown as text beside it. The image is only read once the cover scrolls into view, except for
// covers that are always on screen (`eager`).
// shortcut: the stored full-size cover is used as the thumbnail, so a huge library of 2 MB covers
// decodes slowly; resize covers at import if that shows up.
export const Cover = ({ song, size = "sm", eager = false }) => {
  const { energyOf } = useMusic();
  const ref = useRef(null);
  const [seen, setSeen] = useState(eager);
  const url = useCoverUrl(song.id, seen && song.hasCover);

  useEffect(() => {
    const watcher = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true));
    watcher.observe(ref.current);
    return () => watcher.disconnect();
  }, []);

  return (
    <span ref={ref} className={`cover cover-${size}`} aria-hidden="true">
      {url ? (
        <img src={url} alt="" />
      ) : (
        <span className={`cover-tile energy-${Math.round(energyOf(song.id) ?? 3)}`}>
          {song.title.match(/\p{L}/u)?.[0] ?? "♪"}
        </span>
      )}
    </span>
  );
};
