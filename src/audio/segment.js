// Decode a song and keep only [offset, offset + seconds): a few MB instead of ~90 MB for the
// whole track. The full decode is dropped as soon as the copy is made.
export const decodeSegment = async (ctx, url, offset, seconds) => {
  const full = await ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
  const start = Math.floor(offset * full.sampleRate);
  const length = Math.min(full.length - start, Math.ceil(seconds * full.sampleRate));
  if (length <= 0) return null;
  const buffer = ctx.createBuffer(full.numberOfChannels, length, full.sampleRate);
  for (let c = 0; c < full.numberOfChannels; c++) buffer.copyToChannel(full.getChannelData(c).subarray(start, start + length), c);
  return buffer;
};
