import { useEffect, useRef } from "react";
import { useMusic } from "../state/useMusic";
import { SongRow } from "./SongRow";

export const QueuePanel = ({ onClose }) => {
  const { queue, currentQid, songById, durations, playQid, removeFromQueue } = useMusic();
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current.focus();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="queue-backdrop" onClick={onClose} />
      <aside className="queue-panel" id="queue-panel" aria-label="Up next">
        <div className="queue-header">
          <h2>Up next</h2>
          <button ref={closeRef} type="button" className="control-btn" aria-label="Close Up next" onClick={onClose}>
            ✕
          </button>
        </div>
        {queue.items.length === 0 ? (
          <p className="empty-message">Nothing queued</p>
        ) : (
          <ul className="song-list">
            {queue.items.map((item, index) => {
              const song = songById(item.songId);
              const active = item.qid === currentQid;
              return (
                <li key={item.qid}>
                  <SongRow
                    song={song}
                    index={index}
                    duration={durations[song.id]}
                    active={active}
                    onPlay={() => playQid(item.qid)}
                    actions={!active && (
                      <button
                        type="button"
                        className="control-btn"
                        aria-label={`Remove ${song.title} from queue`}
                        onClick={() => removeFromQueue(item.qid)}
                      >
                        ✕
                      </button>
                    )}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </>
  );
};
