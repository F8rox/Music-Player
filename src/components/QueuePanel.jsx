import { useEffect, useRef } from "react";
import { useMusic } from "../state/useMusic";
import { SongRow } from "./SongRow";
import { SortableList } from "./SortableList";

export const QueuePanel = ({ onClose }) => {
  const { queue, currentQid, songById, durations, playQid, removeFromQueue, moveInQueue } = useMusic();
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current.focus();
    // While a keyboard drag is active its handle has aria-pressed="true"; Esc then cancels the drag.
    const onKey = (e) => e.key === "Escape" && !e.target.closest?.('[aria-pressed="true"]') && onClose();
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
          <SortableList
            items={queue.items}
            getId={(item) => item.qid}
            getLabel={(item) => songById(item.songId).title}
            onMove={moveInQueue}
            renderItem={(item, index) => {
              const song = songById(item.songId);
              const active = item.qid === currentQid;
              return (
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
              );
            }}
          />
        )}
      </aside>
    </>
  );
};
