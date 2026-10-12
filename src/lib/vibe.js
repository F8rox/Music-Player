// "Draw your vibe": a path across the library map becomes a queue. Pure.
// Map coordinates are 0…1 on both axes: x = folded tempo (80–160 BPM), y = energy (1–5, up).
export const MIN_BPM = 80;
export const MAX_BPM = 160;
export const PATH_SONGS = 12;

const clamp = (value) => Math.min(1, Math.max(0, value));

// Where a song sits on the map. bpm must be folded into 80–160.
export const toPoint = ({ bpm, energy }) => ({ x: clamp((bpm - MIN_BPM) / (MAX_BPM - MIN_BPM)), y: clamp((energy - 1) / 4) });

const length = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Energy is what people draw for, so it counts double when finding the nearest song.
const ENERGY_WEIGHT = 2;
const reach = (a, b) => Math.hypot(a.x - b.x, ENERGY_WEIGHT * (a.y - b.y));

// `n` points spaced evenly along the polyline, first and last included. A one-point or zero-length
// path gives that point n times.
export const resample = (path, n) => {
  if (path.length === 0 || n < 1) return [];
  const total = path.slice(1).reduce((sum, p, i) => sum + length(path[i], p), 0);
  if (n === 1 || total === 0) return Array.from({ length: n }, () => path[0]);
  const out = [];
  let segment = 0;
  let walked = 0;
  for (let i = 0; i < n; i++) {
    const target = (total * i) / (n - 1);
    while (segment < path.length - 2 && walked + length(path[segment], path[segment + 1]) < target) {
      walked += length(path[segment], path[segment + 1]);
      segment += 1;
    }
    const span = length(path[segment], path[segment + 1]) || 1;
    const t = clamp((target - walked) / span);
    out.push({
      x: path[segment].x + (path[segment + 1].x - path[segment].x) * t,
      y: path[segment].y + (path[segment + 1].y - path[segment].y) * t,
    });
  }
  return out;
};

// The nearest song to each point along the path, in path order, never the same song twice.
// songs: [{ id, bpm, energy }]. Returns song ids (fewer than `count` when the library is smaller).
export const pickAlongPath = (path, songs, count = PATH_SONGS) => {
  const free = songs.map((song) => ({ id: song.id, ...toPoint(song) }));
  return resample(path, Math.min(count, free.length)).map((point) => {
    const [best] = free.sort((a, b) => reach(a, point) - reach(b, point) || (a.id < b.id ? -1 : 1));
    free.splice(free.indexOf(best), 1);
    return best.id;
  });
};

// Shapes for people who can't or don't want to draw.
export const PRESETS = [
  { id: "build-up", label: "Build-up", path: [{ x: 0.25, y: 0.1 }, { x: 0.5, y: 0.5 }, { x: 0.75, y: 0.95 }] },
  { id: "peak", label: "Peak", path: [{ x: 0.25, y: 0.9 }, { x: 0.5, y: 1 }, { x: 0.75, y: 0.9 }] },
  { id: "cool-down", label: "Cool-down", path: [{ x: 0.75, y: 0.9 }, { x: 0.5, y: 0.5 }, { x: 0.25, y: 0.1 }] },
];
