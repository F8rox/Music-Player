// Pure queue rules (YT Music model). Items: { qid, songId, order }.
// While unshuffled, `order` mirrors position. While shuffled, existing orders are frozen
// (new items get max + 1) so unshuffle can restore the original sequence.

export const newQid = () => crypto.randomUUID();

export const emptyQueue = { items: [], currentQid: null, shuffled: false };

const renumber = (items) => items.map((item, order) => ({ ...item, order }));

const settle = (queue, items) => ({ ...queue, items: queue.shuffled ? items : renumber(items) });

const nextOrder = (queue) => Math.max(-1, ...queue.items.map((item) => item.order)) + 1;

const currentIndex = (queue) => queue.items.findIndex((item) => item.qid === queue.currentQid);

export const fromList = (songIds, startIndex, makeId = newQid) => {
  const items = renumber(songIds.map((songId) => ({ qid: makeId(), songId })));
  return { items, currentQid: items[startIndex]?.qid ?? null, shuffled: false };
};

export const current = (queue) => queue.items[currentIndex(queue)] ?? null;

// Returns { queue, stopped }. stopped = reached the end with nothing to wrap to.
export const next = (queue, repeat) => {
  const index = currentIndex(queue);
  const target = queue.items[index + 1] ?? (repeat === "all" ? queue.items[0] : null);
  if (index < 0 || !target) return { queue, stopped: true };
  return { queue: { ...queue, currentQid: target.qid }, stopped: false };
};

// When a track finishes: repeat "one" keeps the same item; otherwise behave like next.
export const afterEnded = (queue, repeat) =>
  repeat === "one" ? { queue, stopped: false } : next(queue, repeat);

// Returns the same object when already at the first item (caller restarts the track).
export const prev = (queue) => {
  const index = currentIndex(queue);
  if (index <= 0) return queue;
  return { ...queue, currentQid: queue.items[index - 1].qid };
};

const insertAt = (queue, at, songId, qid) => {
  const item = { qid, songId, order: nextOrder(queue) };
  const settled = settle(queue, [...queue.items.slice(0, at), item, ...queue.items.slice(at)]);
  return { ...settled, currentQid: queue.currentQid ?? qid };
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
  return settle(queue, items);
};

// Arrange: everything up to and including the current item stays; the upcoming items are replaced.
export const replaceUpcoming = (queue, upcoming) =>
  settle(queue, [...queue.items.slice(0, currentIndex(queue) + 1), ...upcoming]);

export const upcomingItems = (queue) => queue.items.slice(currentIndex(queue) + 1);

// The current item can't be removed; that would silently change what's playing.
export const remove = (queue, qid) => {
  if (qid === queue.currentQid) return queue;
  return settle(queue, queue.items.filter((item) => item.qid !== qid));
};

// A song deleted from the library leaves the queue entirely (every copy). If it was
// current, the next remaining item after it becomes current; none left after it = stopped (null).
export const removeSong = (queue, songId) => {
  const items = queue.items.filter((item) => item.songId !== songId);
  if (items.length === queue.items.length) return queue;
  const playing = current(queue);
  const currentQid = playing?.songId === songId
    ? queue.items.slice(currentIndex(queue) + 1).find((item) => item.songId !== songId)?.qid ?? null
    : queue.currentQid;
  return { ...settle(queue, items), currentQid };
};

// Everything up to and including the current item stays put; the rest is Fisher–Yates shuffled.
export const shuffle = (queue, random = Math.random) => {
  const split = currentIndex(queue) + 1;
  const tail = queue.items.slice(split);
  for (let i = tail.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [tail[i], tail[j]] = [tail[j], tail[i]];
  }
  return { ...queue, items: [...queue.items.slice(0, split), ...tail], shuffled: true };
};

export const unshuffle = (queue) => {
  const split = currentIndex(queue) + 1;
  const tail = queue.items.slice(split).sort((a, b) => a.order - b.order);
  return { ...queue, items: renumber([...queue.items.slice(0, split), ...tail]), shuffled: false };
};
