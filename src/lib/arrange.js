// "Arrange my queue": orders upcoming queue items into an energy arc (build-up, peak at ~70%,
// cool-down), then smooths tempo jumps between neighbours. Pure; info comes from analysis.
// info: { [songId]: { energy: 1…5 | undefined, bpm: folded BPM | null } }
const PEAK_AT = 0.7;

const energyOf = (info, item) => info[item.songId]?.energy;
const bpmOf = (info, item) => info[item.songId]?.bpm ?? null;
const jump = (info, a, b) => (a && b && bpmOf(info, a) && bpmOf(info, b) ? Math.abs(bpmOf(info, a) - bpmOf(info, b)) : 0);

// Energy arc only. Highest energy at the peak; the rest alternate outward so both sides
// fall away from it, split in proportion to the space before and after the peak.
export const arc = (items, info) => {
  const sorted = [...items].sort((a, b) => energyOf(info, b) - energyOf(info, a));
  if (sorted.length < 2) return sorted;
  const peak = Math.round(PEAK_AT * (sorted.length - 1));
  const leftSize = peak;
  const rightSize = sorted.length - 1 - peak;
  const left = [];
  const right = [];
  for (const item of sorted.slice(1)) {
    const leftNeed = leftSize ? (leftSize - left.length) / leftSize : 0;
    const rightNeed = rightSize ? (rightSize - right.length) / rightSize : 0;
    (leftNeed >= rightNeed ? left : right).push(item);
  }
  return [...left.reverse(), sorted[0], ...right];
};

// One pass of neighbour swaps that lower the total tempo jump, never trading places across
// more than one energy step (so the arc's shape survives).
export const smoothTempo = (order, info) => {
  const out = [...order];
  for (let i = 0; i < out.length - 1; i++) {
    const [prev, a, b, next] = [out[i - 1], out[i], out[i + 1], out[i + 2]];
    if (Math.abs(energyOf(info, a) - energyOf(info, b)) > 1) continue;
    const before = jump(info, prev, a) + jump(info, a, b) + jump(info, b, next);
    const after = jump(info, prev, b) + jump(info, b, a) + jump(info, a, next);
    if (after < before) [out[i], out[i + 1]] = [b, a];
  }
  return out;
};

export const totalJump = (order, info) => order.slice(1).reduce((sum, item, i) => sum + jump(info, order[i], item), 0);

// Unanalysed songs keep their relative order at the end.
export const arrange = (items, info) => {
  const known = items.filter((item) => Number.isFinite(energyOf(info, item)));
  const unknown = items.filter((item) => !Number.isFinite(energyOf(info, item)));
  return [...smoothTempo(arc(known, info), info), ...unknown];
};
