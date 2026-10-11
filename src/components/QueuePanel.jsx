import { useEffect, useRef } from "react";

export const QueuePanel = ({ onClose }) => {
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
        <p className="empty-message">Nothing queued</p>
      </aside>
    </>
  );
};
