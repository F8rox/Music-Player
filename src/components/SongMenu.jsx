import { useEffect, useRef, useState } from "react";
import { useMusic } from "../state/useMusic";
import { ConfirmDialog } from "./ConfirmDialog";

export const SongMenu = ({ song }) => {
  const { playNext, addToQueue, removeFromLibrary } = useMusic();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (open) menuRef.current.querySelector("[role=menuitem]").focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current.focus();
  };

  const choose = (action) => () => {
    action(song.id);
    close();
  };

  return (
    <div
      className="song-menu"
      onKeyDown={(e) => e.key === "Escape" && open && close()}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        className="control-btn"
        aria-label={`More options for ${song.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ⋯
      </button>
      {open && (
        <div ref={menuRef} role="menu" className="menu">
          <button type="button" role="menuitem" onClick={choose(playNext)}>Play next</button>
          <button type="button" role="menuitem" onClick={choose(addToQueue)}>Add to queue</button>
          {song.imported && (
            <button type="button" role="menuitem" onClick={() => { setOpen(false); setConfirming(true); }}>
              Remove from library
            </button>
          )}
        </div>
      )}
      {confirming && (
        <ConfirmDialog
          title="Remove from library?"
          message={`"${song.title}" will be deleted from this browser, your queue and your playlists.`}
          confirmLabel="Remove"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            removeFromLibrary(song.id);
          }}
        />
      )}
    </div>
  );
};
