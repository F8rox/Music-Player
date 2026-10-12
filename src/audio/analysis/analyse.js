// Main-thread half of analysis: decode at 11025 Hz mono (about 10 MB for 4 minutes instead of
// about 92 MB at 48 kHz stereo), hand the samples to the worker, keep nothing afterwards.
const RATE = 11025;
let worker = null;

const getWorker = () => (worker ??= new Worker(new URL("./analysis.worker.js", import.meta.url), { type: "module" }));

const decodeMono = async (blob) => {
  // decodeAudioData resamples to the context's rate; the 1-frame context is only a decoder.
  const buffer = await new OfflineAudioContext(1, 1, RATE).decodeAudioData(await blob.arrayBuffer());
  const mono = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const channel = buffer.getChannelData(c);
    for (let i = 0; i < mono.length; i++) mono[i] += channel[i] / buffer.numberOfChannels;
  }
  return mono;
};

// Resolves to an AnalysisResult, or null when the file can't be decoded or analysed.
export const analyseBlob = async (id, blob) => {
  let samples;
  try {
    samples = await decodeMono(blob);
  } catch {
    return null;
  }
  const w = getWorker();
  return new Promise((resolve) => {
    const done = (result) => {
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      resolve(result);
    };
    const onMessage = (e) => e.data.id === id && done(e.data.result);
    const onError = () => done(null);
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    w.postMessage({ id, samples, rate: RATE }, [samples.buffer]); // transferred, not copied
  });
};
