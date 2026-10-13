import { useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImportButton } from "../components/ImportButton";
import { NowPlayingHero } from "../components/NowPlayingHero";
import { SongMenu } from "../components/SongMenu";
import { SongRow } from "../components/SongRow";
import { useMusic } from "../state/useMusic";

export const AllSongs = () => {
  const { songs, durationOf, currentTrack, playFromList, removeFromLibrary } = useMusic();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [confirming, setConfirming] = useState(false);
  const ids = songs.map((song) => song.id);
  const all = selected.size === songs.length;

  const toggle = (id) => setSelected((set) => {
    const next = new Set(set);
    if (!next.delete(id)) next.add(id);
    return next;
  });
  const finish = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  return (
    <section>
      <NowPlayingHero />
      <div className="page-header">
        <h2>All Songs ({songs.length})</h2>
        {selecting ? (
          <div className="import-actions" role="group" aria-label="Selection">
            <span className="select-count" role="status">{selected.size} selected</span>
            <button type="button" className="secondary-btn" onClick={() => setSelected(all ? new Set() : new Set(ids))}>
              {all ? "Select none" : "Select all"}
            </button>
            <button type="button" className="danger-btn" disabled={selected.size === 0} onClick={() => setConfirming(true)}>
              Delete
            </button>
            <button type="button" className="secondary-btn" onClick={finish}>Done</button>
          </div>
        ) : (
          <div className="import-actions">
            <ImportButton />
            {songs.length > 0 && <button type="button" className="secondary-btn" onClick={() => setSelecting(true)}>Select</button>}
          </div>
        )}
      </div>
      <ul className="song-list panel">
        {songs.map((song, index) => (
          <li key={song.id}>
            <SongRow
              song={song}
              index={index}
              duration={durationOf(song)}
              active={song.id === currentTrack?.id}
              selected={selected.has(song.id)}
              leading={selecting && (
                <input
                  type="checkbox"
                  className="select-box"
                  checked={selected.has(song.id)}
                  onChange={() => toggle(song.id)}
                  aria-label={`Select ${song.title}`}
                />
              )}
              onPlay={selecting ? () => toggle(song.id) : () => playFromList(ids, index)}
              actions={!selecting && <SongMenu song={song} />}
            />
          </li>
        ))}
      </ul>
      {confirming && (
        <ConfirmDialog
          title={`Delete ${selected.size} ${selected.size === 1 ? "song" : "songs"}?`}
          message="They will be deleted from this browser, your queue and your playlists. This can't be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            setConfirming(false);
            await removeFromLibrary([...selected]);
            finish();
          }}
        />
      )}
    </section>
  );
};
