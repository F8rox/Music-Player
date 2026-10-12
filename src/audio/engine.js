import { fadeCurves } from "../lib/transition";
import { decodeSegment } from "./segment";

// The app's only playback path (Invariant 1): two hidden <audio> decks routed through one
// AudioContext. A module singleton because React StrictMode mounts twice and
// createMediaElementSource may only be called once per element.
const EVENTS = ["loadstart", "loadedmetadata", "timeupdate", "ended", "error"];
const listeners = new Map(EVENTS.map((type) => [type, new Set()]));
let decks = null; // [{ el, gain }]; the current deck alternates on each crossfade
let graph = null; // { ctx, master, analyser }, built on the first play (a user gesture)
let volume = 1;
let current = 0;
let transition = null; // { from, ticker } while two decks are blending
let adoptedKey = null; // queue item the incoming deck already plays, so load() must not restart it
let beatSegment = null; // { url, offset, rate, buffer }: decoded start of the next song for beat-matching

const deckEl = () => {
  decks ??= [0, 1].map(() => {
    const el = document.createElement("audio");
    el.preload = "auto";
    el.hidden = true;
    document.body.append(el);
    for (const type of EVENTS) {
      el.addEventListener(type, (e) => {
        // An error on an emptied deck is just the old source going away; ignore it.
        if (el !== decks[current].el || (type === "error" && !el.getAttribute("src"))) return;
        listeners.get(type).forEach((fn) => fn(e));
      });
    }
    return { el, gain: null };
  });
  return decks[current].el;
};

const unload = (el) => {
  el.pause();
  el.removeAttribute("src");
  el.load();
};

const setGain = (deck, value) => deck.gain && ramp(deck.gain.gain, value, value, 0);

// Cancel anything scheduled, then move from→to over `seconds` (0 = jump now).
const ramp = (param, from, to, seconds) => {
  const now = graph.ctx.currentTime;
  param.cancelScheduledValues(0);
  param.setValueAtTime(from, now);
  if (seconds) param.linearRampToValueAtTime(to, now + seconds);
};

// End (or cancel) a fade: the outgoing deck stops, the current one is left at full volume.
const finishTransition = () => {
  if (!transition) return;
  const { from, ticker, beat } = transition;
  transition = null;
  ticker.onended = null;
  ticker.stop();
  if (beat) {
    // Cancelled mid beat-match: the deck takes over where the segment had got to.
    beat.source.stop();
    const el = decks[current].el;
    el.currentTime = beat.offset + beat.rate * (graph.ctx.currentTime - beat.when);
    if (!decks[from].el.paused) el.play().catch(() => {});
  }
  unload(decks[from].el);
  setGain(decks[from], 1);
  setGain(decks[current], 1);
};

const setNormOn = (deck, value) => {
  deck.normValue = value;
  if (deck.norm) ramp(deck.norm.gain, value, value, 0);
};

const SOFT_CLIP = (() => {
  const knee = 10 ** (-2 / 20);
  return Float32Array.from({ length: 2049 }, (_, i) => {
    const x = Math.abs((i / 1024) - 1);
    return Math.sign(i - 1024) * (x <= knee ? x : knee + (1 - knee) * Math.tanh((x - knee) / (1 - knee)));
  });
})();

const buildGraph = () => {
  deckEl();
  const ctx = new AudioContext();
  const master = ctx.createGain();
  const analyser = ctx.createAnalyser();
  master.gain.value = volume;
  // Safety limiter ahead of the volume control: untouched up to -2 dB, then rounded toward full scale, so a
  // boosted quiet song can't clip. (A DynamicsCompressorNode would add automatic makeup gain.)
  const limiter = ctx.createWaveShaper();
  limiter.curve = SOFT_CLIP;
  limiter.oversample = "2x";
  limiter.connect(master).connect(analyser).connect(ctx.destination);
  for (const deck of decks) {
    deck.gain = ctx.createGain(); // fades
    deck.norm = ctx.createGain(); // loudness normalisation (Unit 17), kept separate from fades
    deck.norm.gain.value = deck.normValue ?? 1;
    ctx.createMediaElementSource(deck.el).connect(deck.norm).connect(deck.gain).connect(limiter);
  }
  return { ctx, master, limiter, analyser };
};

export const engine = {
  on: (type, fn) => {
    listeners.get(type).add(fn);
    return () => listeners.get(type).delete(fn);
  },
  // Setting src (even to the same URL) restarts from 0, which a duplicate queue item needs.
  // An explicit load always cancels a fade in progress.
  load: (url, key) => {
    if (key && key === adoptedKey) return;
    adoptedKey = null;
    finishTransition();
    const el = deckEl();
    if (url) {
      el.src = url;
    } else {
      el.removeAttribute("src");
      el.load();
    }
  },
  play: async () => {
    graph ??= buildGraph();
    await graph.ctx.resume();
    // Mid beat-match the deck waits for the handoff; starting it now would put it seconds ahead.
    if (transition?.beat) return undefined;
    return deckEl().play();
  },
  pause: () => {
    finishTransition();
    deckEl().pause();
  },
  seek: (time) => {
    finishTransition();
    deckEl().currentTime = time;
  },
  // Pre-load the next song on the idle deck so the fade starts without a buffering gap.
  prepare: (url, offset) => {
    if (transition || !url) return;
    deckEl();
    const idle = decks[1 - current].el;
    if (idle.getAttribute("src") !== url) idle.src = url;
    idle.currentTime = offset;
  },
  // Beat-matching (experimental): decode the next song once, keep only the stretch the blend uses.
  prepareBeat: async (url, { offset, rate, fadeSeconds }) => {
    if (!graph || (beatSegment?.url === url && beatSegment.offset === offset)) return;
    beatSegment = null;
    const buffer = await decodeSegment(graph.ctx, url, offset, fadeSeconds * rate + 2);
    if (buffer) beatSegment = { url, offset, rate, buffer };
  },
  // Sample-accurate start on the outgoing song's beat (media elements jitter by tens of ms).
  // Returns false when no matching segment is ready; the caller then uses crossfadeTo.
  beatMatchTo: (url, { at, offset, rate, fadeSeconds, key, norm = 1 }) => {
    if (!graph || beatSegment?.url !== url || beatSegment.offset !== offset || beatSegment.rate !== rate) return false;
    finishTransition();
    const ctx = graph.ctx;
    const from = current;
    const to = 1 - current;
    const outgoing = decks[from].el;
    const when = ctx.currentTime + Math.max(0, at - outgoing.currentTime);
    const source = ctx.createBufferSource();
    const segmentGain = ctx.createGain();
    source.buffer = beatSegment.buffer;
    source.playbackRate.value = rate;
    const segmentNorm = ctx.createGain();
    segmentNorm.gain.value = norm;
    source.connect(segmentNorm).connect(segmentGain).connect(graph.limiter);
    const { out, into } = fadeCurves();
    decks[from].gain.gain.cancelScheduledValues(0);
    decks[from].gain.gain.setValueCurveAtTime(out, when, fadeSeconds);
    segmentGain.gain.setValueAtTime(0, ctx.currentTime);
    segmentGain.gain.setValueCurveAtTime(into, when, fadeSeconds);
    source.start(when);
    // The deck waits silently at the position the segment will have reached by the handoff.
    const incoming = decks[to].el;
    setNormOn(decks[to], norm);
    if (incoming.getAttribute("src") !== url) incoming.src = url;
    incoming.currentTime = offset + rate * fadeSeconds;
    setGain(decks[to], 0);
    const ticker = ctx.createConstantSource();
    ticker.onended = () => {
      // Handoff: the deck starts and an 80 ms micro-fade covers its start-up jitter.
      incoming.play().catch(() => {});
      ramp(segmentGain.gain, 1, 0, 0.08);
      ramp(decks[to].gain.gain, 0, 1, 0.08);
      source.stop(ctx.currentTime + 0.1);
      transition = null;
      unload(outgoing);
      setGain(decks[from], 1);
      beatSegment = null;
    };
    ticker.start(ctx.currentTime);
    ticker.stop(when + fadeSeconds);
    transition = { from, ticker, beat: { source, when, offset, rate } };
    current = to;
    adoptedKey = key;
    return true;
  },
  transitioning: () => Boolean(transition),
  cancelTransition: () => finishTransition(),
  // Equal-power blend on the audio clock; the incoming deck becomes current immediately.
  crossfadeTo: (url, { nextOffset, fadeSeconds, key, norm = 1 }) => {
    graph ??= buildGraph();
    finishTransition();
    const from = current;
    const to = 1 - current;
    const incoming = decks[to].el;
    setNormOn(decks[to], norm);
    if (incoming.getAttribute("src") !== url) incoming.src = url;
    incoming.currentTime = nextOffset;
    const now = graph.ctx.currentTime;
    const { out, into } = fadeCurves();
    for (const [deck, curve] of [[decks[from], out], [decks[to], into]]) {
      deck.gain.gain.cancelScheduledValues(0);
      deck.gain.gain.setValueCurveAtTime(curve, now, fadeSeconds);
    }
    // A silent source that ends exactly when the fade does: cleanup on the audio clock, not a timer.
    const ticker = graph.ctx.createConstantSource();
    ticker.onended = finishTransition;
    ticker.start(now);
    ticker.stop(now + fadeSeconds);
    transition = { from, ticker };
    current = to;
    adoptedKey = key;
    return incoming.play();
  },
  currentTime: () => (decks ? decks[current].el.currentTime : 0),
  // Test hook: which deck is audible and each deck's state.
  decks: () => decks?.map((d, i) => ({ current: i === current, paused: d.el.paused, src: d.el.getAttribute("src"), time: d.el.currentTime, gain: d.gain?.gain.value })),
  // Normalisation for whatever the current deck plays; a short ramp avoids a click.
  setNorm: (value) => {
    deckEl();
    const deck = decks[current];
    deck.normValue = value;
    if (deck.norm) ramp(deck.norm.gain, deck.norm.gain.value, value, 0.3);
  },
  setVolume: (value) => {
    volume = value;
    if (graph) graph.master.gain.value = value;
  },
  analyser: () => (graph ??= buildGraph()).analyser,
};
