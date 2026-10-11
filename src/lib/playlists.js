// Pure playlist rules. A playlist: { id, name, songIds, createdAt }. Songs are unique per playlist.

export const MAX_NAME = 60;

// Returns the trimmed name, or null when it's empty or too long (never silently truncated).
export const validateName = (raw) => {
  const name = typeof raw === "string" ? raw.trim() : "";
  return name.length >= 1 && name.length <= MAX_NAME ? name : null;
};

const update = (list, id, change) => list.map((playlist) => (playlist.id === id ? change(playlist) : playlist));

export const create = (list, rawName, id, now) => {
  const name = validateName(rawName);
  return name ? [...list, { id, name, songIds: [], createdAt: now }] : list;
};

export const rename = (list, id, rawName) => {
  const name = validateName(rawName);
  return name ? update(list, id, (playlist) => ({ ...playlist, name })) : list;
};

export const remove = (list, id) => list.filter((playlist) => playlist.id !== id);

export const addSong = (list, id, songId) => {
  const target = list.find((playlist) => playlist.id === id);
  if (!target || target.songIds.includes(songId)) return { list, added: false };
  return { list: update(list, id, (playlist) => ({ ...playlist, songIds: [...playlist.songIds, songId] })), added: true };
};

export const removeSong = (list, id, songId) =>
  update(list, id, (playlist) => ({ ...playlist, songIds: playlist.songIds.filter((s) => s !== songId) }));

export const moveSong = (list, id, songId, toIndex) =>
  update(list, id, (playlist) => {
    const from = playlist.songIds.indexOf(songId);
    const to = Math.max(0, Math.min(toIndex, playlist.songIds.length - 1));
    if (from < 0 || from === to) return playlist;
    const songIds = [...playlist.songIds];
    songIds.splice(to, 0, ...songIds.splice(from, 1));
    return { ...playlist, songIds };
  });

// A song deleted from the library leaves every playlist.
export const removeSongEverywhere = (list, songId) =>
  list.map((playlist) =>
    playlist.songIds.includes(songId) ? { ...playlist, songIds: playlist.songIds.filter((s) => s !== songId) } : playlist);
