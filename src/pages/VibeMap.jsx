import { useRef, useState } from "react";
import { PRESETS, pickAlongPath } from "../lib/vibe";
import { useMusic } from "../state/useMusic";

const W = 100;
const H = 60;
const MIN_STEP = 0.01; // drawn points closer than this to the last one are skipped
const MAX_POINTS = 300;
const PAD = 3; // margin inside the frame so dots at the extremes aren't clipped

const clamp = (value) => Math.min(1, Math.max(0, value));
const sx = (x) => PAD + x * (W - 2 * PAD);
const sy = (y) => PAD + (1 - y) * (H - 2 * PAD);
const toSvg = ({ x, y }) => `${sx(x)},${sy(y)}`;

// The library as dots (tempo across, energy up). Draw a path, or pick a shape, and the songs nearest
// the path become the queue.
export const VibeMap = () => {
  const { vibeSongs, playVibe } = useMusic();
  const svgRef = useRef(null);
  const [path, setPath] = useState([]);
  const [drawing, setDrawing] = useState(false);

  const pointOf = (e) => {
    const box = svgRef.current.getBoundingClientRect();
    return {
      x: clamp((((e.clientX - box.left) / box.width) * W - PAD) / (W - 2 * PAD)),
      y: clamp(1 - (((e.clientY - box.top) / box.height) * H - PAD) / (H - 2 * PAD)),
    };
  };
  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setPath([pointOf(e)]);
    setDrawing(true);
  };
  const onMove = (e) => {
    if (!drawing) return;
    const point = pointOf(e);
    setPath((p) => (p.length >= MAX_POINTS || Math.hypot(point.x - p.at(-1).x, point.y - p.at(-1).y) < MIN_STEP ? p : [...p, point]));
  };

  if (vibeSongs.length < 3) {
    return (
      <section>
        <div className="page-header"><h1 className="page-title">Draw your vibe</h1></div>
        <p className="empty-message">Add a few more songs and wait for them to be analysed, then you can draw a vibe.</p>
      </section>
    );
  }

  const picks = !drawing && path.length >= 2 ? pickAlongPath(path, vibeSongs) : [];
  const picked = new Set(picks);

  return (
    <section>
      <div className="page-header">
        <h1 className="page-title">Draw your vibe</h1>
        <div className="import-actions" role="group" aria-label="Preset shapes">
          {PRESETS.map((preset) => (
            <button key={preset.id} type="button" className="secondary-btn" onClick={() => setPath(preset.path)}>
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <p className="vibe-help">
        Drag across the map to draw a path, or pick a shape. The player queues the songs closest to it, in order.
      </p>
      <div className="vibe-frame panel">
        <span className="vibe-axis vibe-axis-y">Energy: calm to intense, bottom to top</span>
        <svg
          ref={svgRef}
          className="vibe-map"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Map of your songs: tempo across, energy up. Draw a path with a pointer, or use the shape buttons."
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => setDrawing(false)}
          onPointerCancel={() => setDrawing(false)}
        >
          {path.length >= 2 && <polyline className="vibe-path" points={path.map(toSvg).join(" ")} />}
          {vibeSongs.map((song) => (
            <circle
              key={song.id}
              className={`vibe-dot energy-${Math.round(song.energy)}${picked.has(song.id) ? " picked" : ""}`}
              cx={sx(song.x)}
              cy={sy(song.y)}
              r={picked.has(song.id) ? 1.8 : 1.2}
            >
              <title>{`${song.title}: ~${Math.round(song.bpm)} BPM, energy ${Math.round(song.energy)}/5`}</title>
            </circle>
          ))}
        </svg>
        <span className="vibe-axis">Tempo: slower to faster</span>
      </div>
      {picks.length > 0 ? (
        <div className="vibe-result panel">
          <div className="page-header">
            <h2>{picks.length} songs along your path</h2>
            <div className="import-actions">
              <button type="button" className="secondary-btn" onClick={() => setPath([])}>Clear</button>
              <button type="button" className="primary-btn" onClick={() => playVibe(picks)}>Play this vibe</button>
            </div>
          </div>
          <ol className="vibe-list">
            {picks.map((id) => {
              const song = vibeSongs.find((s) => s.id === id);
              return (
                <li key={id}>
                  <span className={`energy-dot energy-${Math.round(song.energy)}`} aria-hidden="true" />
                  {song.title}
                  <span className="vibe-meta">~{Math.round(song.bpm)} BPM · energy {Math.round(song.energy)}/5</span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <p className="vibe-help">{vibeSongs.length} songs on the map.</p>
      )}
    </section>
  );
};
