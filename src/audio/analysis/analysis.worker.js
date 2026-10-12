import { analyse } from "./dsp";

// Runs the DSP off the main thread. Decoding can't happen here (no OfflineAudioContext in workers).
self.onmessage = ({ data: { id, samples, rate } }) => {
  let result = null;
  try {
    result = analyse(samples, rate);
  } catch {
    // result stays null: the song is marked "Couldn't analyse" and still plays.
  }
  self.postMessage({ id, result });
};
