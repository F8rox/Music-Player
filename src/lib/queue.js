// Pure queue rules (YT Music model). Items: { qid, songId, order }.
// `order` mirrors position while unshuffled; Unit 06 uses it to undo a shuffle.

export const newQid = () => crypto.randomUUID();

export const emptyQueue = { items: [], currentQid: null };

const renumber = (items) => items.map((item, order) => ({ ...item, order }));

const currentIndex = (queue) => queue.items.findIndex((item) => item.qid === queue.currentQid);

export const fromList = (songIds, startIndex, makeId = newQid) => {
  const items = renumber(songIds.map((songId) => ({ qid: makeId(), songId })));
  return { items, currentQid: items[startIndex]?.qid ?? null };
};

export const current = (queue) => queue.items[currentIndex(queue)] ?? null;

// Returns { queue, stopped }. stopped = reached the end with nothing to wrap to.
export const next = (queue, repeat) => {
  const index = currentIndex(queue);
  const target = queue.items[index + 1] ?? (repeat === "all" ? queue.items[0] : null);
  if (index < 0 || !target) return { queue, stopped: true };
  return { queue: { ...queue, currentQid: target.qid }, stopped: false };
};

// Returns the same object when already at the first item (caller restarts the track).
export const prev = (queue) => {
  const index = currentIndex(queue);
  if (index <= 0) return queue;
  return { ...queue, currentQid: queue.items[index - 1].qid };
};

const insertAt = (queue, at, songId, qid) => {
  const items = renumber([...queue.items.slice(0, at), { qid, songId }, ...queue.items.slice(at)]);
  return { items, currentQid: queue.currentQid ?? qid };
};

export const insertNext = (queue, songId, qid = newQid()) =>
  insertAt(queue, currentIndex(queue) + 1, songId, qid);

export const append = (queue, songId, qid = newQid()) =>
  insertAt(queue, queue.items.length, songId, qid);

// The current item may move too: currentQid is unchanged, so playback carries on.
export const move = (queue, fromQid, toIndex) => {
  const from = queue.items.findIndex((item) => item.qid === fromQid);
  const to = Math.max(0, Math.min(toIndex, queue.items.length - 1));
  if (from < 0 || from === to) return queue;
  const items = [...queue.items];
  items.splice(to, 0, ...items.splice(from, 1));
  return { ...queue, items: renumber(items) };
};

// The current item can't be removed; that would silently change what's playing.
export const remove = (queue, qid) => {
  if (qid === queue.currentQid) return queue;
  return { ...queue, items: renumber(queue.items.filter((item) => item.qid !== qid)) };
};
