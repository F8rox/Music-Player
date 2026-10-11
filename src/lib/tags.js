// Tag text comes from files the user imported: untrusted, possibly huge or full of control chars.
const MAX = 200;

export const cleanText = (value) => {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim().slice(0, MAX);
};

export const titleFromFilename = (name) =>
  cleanText(String(name).replace(/\.[^.]+$/, "").replace(/[_]+/g, " ")) || "Untitled";

export const songInfo = (common, fileName) => ({
  title: cleanText(common?.title) || titleFromFilename(fileName),
  artist: cleanText(common?.artist) || "Unknown artist",
  album: cleanText(common?.album),
});
