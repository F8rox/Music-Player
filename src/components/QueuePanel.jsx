import { useEffect, useRef } from "react";
import { useMusic } from "../state/useMusic";
import { useFocusTrap } from "./useFocusTrap";
import { LiveSeekBar, RepeatButton, ShuffleButton, VolumeSlider } from "./PlayerControls";
import { SettingsPopover } from "./SettingsPopover";
import { SongRow } from "./SongRow";
import { SortableList } from "./SortableList";

export const QueuePanel = ({ onClose }) => {
  const {
    queue, currentQid, songById, durationOf, playQid, removeFromQueue, moveInQueue,
    arrangeQueue, undoArrange, canUndoArrange,
  } = useMusic();
  const closeRef = useRef(null);
  const panelRef = useRef(null);
  useFocusTrap(panelRef);

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
      <aside ref={panelRef} className="queue-panel" id="queue-panel" aria-label="Up next">
        <div className="queue-header">
          <h2>Up next</h2>
          <button
            type="button"
            className="secondary-btn"
            disabled={queue.items.length === 0}
            onClick={canUndoArrange ? undoArrange : arrangeQueue}
          >
            {canUndoArrange ? "Undo arrange" : "Arrange"}
          </button>
          <button ref={closeRef} type="button" className="control-btn" aria-label="Close Up next" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="drawer-controls">
          <div className="drawer-row">
            <ShuffleButton />
            <RepeatButton />
            <SettingsPopover />
            <VolumeSlider />
          </div>
          <LiveSeekBar />
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
                  duration={durationOf(song)}
                  active={active}
                  note={item.reason}
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
