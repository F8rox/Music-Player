// "Start radio": from a seed song, take the most similar songs by tempo, key and energy, then order them
// so each step stays close to the one before. Pure.
// info: { [songId]: { energy: 1…5 | undefined, bpm: folded BPM | null, camelot: "8A" | null } }
const WEIGHTS = { tempo: 0.45, key: 0.3, energy: 0.25 };
const TEMPO_FULL_DISTANCE = 0.15; // a 15% tempo gap counts as completely different
const TEMPO_CLOSE = 0.06; // beat-matching territory; beyond it a song pays an extra step
const BEYOND_CLOSE = 0.2;
const UNKNOWN = 0.5; // a missing tempo or key is neither a match nor a clash

const known = (item) => item && Number.isFinite(item.energy);

// Relative tempo gap, counting half and double time as the same tempo. null when either is unknown.
const tempoGap = (a, b) => (a.bpm && b.bpm ? Math.min(...[1, 2, 0.5].map((k) => Math.abs(a.bpm - b.bpm * k) / a.bpm)) : null);

const parseCamelot = (code) => (code ? { n: Number.parseInt(code, 10), letter: code.slice(-1) } : null);

// How far apart two Camelot codes are, 0…1: the same code and its relative key are closest, then wheel neighbours.
const keyDistance = (a, b) => {
  const [x, y] = [parseCamelot(a.camelot), parseCamelot(b.camelot)];
  if (!x || !y) return UNKNOWN;
  const steps = Math.min(Math.abs(x.n - y.n), 12 - Math.abs(x.n - y.n));
  if (x.letter === y.letter) return steps === 0 ? 0 : steps === 1 ? 0.15 : 0.3 + steps / 12 * 0.7;
  return steps === 0 ? 0.15 : 0.5 + steps / 12 * 0.5;
};

// 0 = identical, 1 = nothing alike.
export const distance = (a, b) => {
  const gap = tempoGap(a, b);
  const tempo = gap === null ? UNKNOWN : Math.min(1, gap / TEMPO_FULL_DISTANCE + (gap > TEMPO_CLOSE ? BEYOND_CLOSE : 0));
  return WEIGHTS.tempo * tempo + WEIGHTS.key * keyDistance(a, b) + WEIGHTS.energy * (Math.abs(a.energy - b.energy) / 4);
};

// Why `song` was picked for `seed`: only facts that hold, so a reason is never a guess.
export const reasonFor = (seed, song) => {
  const parts = [];
  const gap = tempoGap(seed, song);
  if (gap !== null && gap <= TEMPO_CLOSE) parts.push(`tempo within ${Math.max(1, Math.ceil(gap * 100))}%`);
  const [x, y] = [parseCamelot(seed.camelot), parseCamelot(song.camelot)];
  if (x && y && keyDistance(seed, song) <= 0.15) {
    parts.push(seed.camelot === song.camelot ? `same key (${song.camelot})`
      : x.n === y.n ? `relative key (${song.camelot})` : `key ${song.camelot} next to ${seed.camelot}`);
  }
  if (Math.abs(seed.energy - song.energy) <= 0.5) parts.push("similar energy");
  const text = parts.join(", ") || "Closest match left";
  return text[0].toUpperCase() + text.slice(1);
};

// [{ songId, reason }]: the seed first, then up to `count` of its closest matches in flow order.
// Unanalysed songs are left out; an unanalysed seed gives [].
export const radio = (seedId, info, count = 20) => {
  if (!known(info[seedId])) return [];
  const byId = (a, b) => (a < b ? -1 : 1);
  const close = Object.keys(info)
    .filter((id) => id !== seedId && known(info[id]))
    .sort((a, b) => distance(info[seedId], info[a]) - distance(info[seedId], info[b]) || byId(a, b))
    .slice(0, count);
  const order = [];
  let last = seedId;
  while (close.length) {
    const [best] = [...close].sort((a, b) => distance(info[last], info[a]) - distance(info[last], info[b]) || byId(a, b));
    order.push(best);
    close.splice(close.indexOf(best), 1);
    last = best;
  }
  return [{ songId: seedId, reason: "Radio start" }, ...order.map((songId) => ({ songId, reason: reasonFor(info[seedId], info[songId]) }))];
};
