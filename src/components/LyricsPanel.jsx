import { useEffect, useRef, useState } from "react";
import { engine } from "../audio/engine";
import { activeIndex } from "../lib/lrc";
import { useMusic } from "../state/useMusic";
import { useFocusTrap } from "./useFocusTrap";

// Synced lyrics for the current song: the line being sung is highlighted and centred, and clicking
// a line seeks there. The position is read from the engine every frame, but React only re-renders
// when the active line changes.
export const LyricsPanel = ({ onClose }) => {
  const { currentTrack, lyrics, seek } = useMusic();
  const [active, setActive] = useState(-1);
  const listRef = useRef(null);
  const closeRef = useRef(null);
  const panelRef = useRef(null);
  useFocusTrap(panelRef);

  useEffect(() => {
    closeRef.current.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let frame;
    const tick = () => {
      setActive(activeIndex(lyrics, engine.currentTime()));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [lyrics]);

  useEffect(() => {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.children[active]?.scrollIntoView({ block: "center", behavior: smooth ? "smooth" : "auto" });
  }, [active]);

  return (
    <>
      <div className="queue-backdrop" onClick={onClose} />
      <aside ref={panelRef} className="queue-panel" id="lyrics-panel" aria-label="Lyrics">
        <div className="queue-header">
          <h2>Lyrics</h2>
          <button ref={closeRef} type="button" className="control-btn" aria-label="Close lyrics" onClick={onClose}>
            ✕
          </button>
        </div>
        {lyrics.length === 0 ? (
          <p className="empty-message">
            No lyrics for {currentTrack?.title ?? "this song"}. Add a synced .lrc file with the same name as the song
            using “Add your music”.
          </p>
        ) : (
          <ol ref={listRef} className="lyrics-list">
            {lyrics.map((line, i) => (
              <li key={i}>
                <button
                  type="button"
                  className="lyric-line"
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => seek(line.time)}
                >
                  {line.text || "♪"}
                </button>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </>
  );
};
