import { useEffect, useRef, useState } from "react";
import { tapBpm, tempoOf } from "../lib/tempo";
import { useMusic } from "../state/useMusic";

// Fix a song's tempo: halve, double, or tap along. The saved value overrides detection.
export const TempoDialog = ({ song, onClose }) => {
  const { analysisOf, setTempo } = useMusic();
  const [bpm, setBpm] = useState(tempoOf(analysisOf(song.id)));
  const [taps, setTaps] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const tap = () => {
    const next = [...taps, performance.now()];
    setTaps(next);
    const tapped = tapBpm(next);
    if (tapped) setBpm(tapped);
  };

  // Overrides are kept within 30–300, the range storage accepts.
  const scale = (factor) => setBpm((value) => Math.min(300, Math.max(30, Math.round(value * factor * 10) / 10)));

  return (
    <dialog ref={ref} className="confirm-dialog" onCancel={onClose} aria-labelledby="tempo-title">
      <h2 id="tempo-title">Fix tempo</h2>
      <p>{song.title}</p>
      <p className="tempo-value" aria-live="polite">{bpm ? `~${bpm} BPM` : "No tempo yet"}</p>
      <div className="dialog-actions">
        <button type="button" className="secondary-btn" disabled={!bpm} onClick={() => scale(0.5)}>½×</button>
        <button type="button" className="secondary-btn" disabled={!bpm} onClick={() => scale(2)}>2×</button>
        <button type="button" className="secondary-btn" onClick={tap}>Tap ({taps.length})</button>
      </div>
      <p className="song-artist">Tap at least 4 times along with the beat.</p>
      <div className="dialog-actions">
        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="primary-btn"
          disabled={!bpm}
          onClick={() => {
            setTempo(song.id, bpm);
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </dialog>
  );
};
