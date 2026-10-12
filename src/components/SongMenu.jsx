import { useEffect, useRef, useState } from "react";
import { useMusic } from "../state/useMusic";
import { ConfirmDialog } from "./ConfirmDialog";
import { TempoDialog } from "./TempoDialog";

export const SongMenu = ({ song }) => {
  const { playNext, addToQueue, startRadio, removeFromLibrary, playlists, addToPlaylist, analysisOf } = useMusic();
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [fixingTempo, setFixingTempo] = useState(false);
  const analysed = typeof analysisOf(song.id) === "object";
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (open) menuRef.current.querySelector("[role=menuitem]").focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    setPicking(false);
    buttonRef.current.focus();
  };

  const choose = (action) => () => {
    action(song.id);
    close();
  };

  return (
    <div
      className="song-menu"
      onKeyDown={(e) => {
        if (!open) return;
        if (e.key === "Escape") return close();
        // Arrow keys, Home and End move between the menu items.
        const items = [...menuRef.current.querySelectorAll("[role=menuitem]")];
        const at = items.indexOf(document.activeElement);
        const target = { ArrowDown: items[(at + 1) % items.length], ArrowUp: items[(at - 1 + items.length) % items.length], Home: items[0], End: items.at(-1) }[e.key];
        if (target) {
          e.preventDefault();
          target.focus();
        }
      }}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && (setOpen(false), setPicking(false))}
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
          <button type="button" role="menuitem" aria-expanded={picking} onClick={() => setPicking(!picking)}>
            Add to playlist {picking ? "▾" : "▸"}
          </button>
          {picking && (playlists.length === 0 ? (
            <span className="menu-note">No playlists yet</span>
          ) : playlists.map((playlist) => (
            <button
              key={playlist.id}
              type="button"
              role="menuitem"
              className="submenu-item"
              onClick={choose((songId) => addToPlaylist(playlist.id, songId))}
            >
              {playlist.name}
            </button>
          )))}
          {analysed && <button type="button" role="menuitem" onClick={choose(startRadio)}>Start radio</button>}
          {analysed && (
            <button type="button" role="menuitem" onClick={() => { setOpen(false); setFixingTempo(true); }}>
              Fix tempo…
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => { setOpen(false); setConfirming(true); }}>
            Remove from library
          </button>
        </div>
      )}
      {fixingTempo && <TempoDialog song={song} onClose={() => setFixingTempo(false)} />}
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
