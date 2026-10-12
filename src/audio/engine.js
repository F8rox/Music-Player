import { fadeCurves } from "../lib/transition";

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

const setGain = (deck, value) => {
  const gain = deck.gain?.gain;
  if (!gain) return;
  gain.cancelScheduledValues(0);
  gain.setValueAtTime(value, graph.ctx.currentTime);
};

// End (or cancel) a fade: the outgoing deck stops, the current one is left at full volume.
const finishTransition = () => {
  if (!transition) return;
  const { from, ticker } = transition;
  transition = null;
  ticker.onended = null;
  ticker.stop();
  unload(decks[from].el);
  setGain(decks[from], 1);
  setGain(decks[current], 1);
};

const buildGraph = () => {
  deckEl();
  const ctx = new AudioContext();
  const master = ctx.createGain();
  const analyser = ctx.createAnalyser();
  master.gain.value = volume;
  master.connect(analyser).connect(ctx.destination);
  for (const deck of decks) {
    deck.gain = ctx.createGain();
    ctx.createMediaElementSource(deck.el).connect(deck.gain).connect(master);
  }
  return { ctx, master, analyser };
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
  transitioning: () => Boolean(transition),
  cancelTransition: () => finishTransition(),
  // Equal-power blend on the audio clock; the incoming deck becomes current immediately.
  crossfadeTo: (url, { nextOffset, fadeSeconds, key }) => {
    graph ??= buildGraph();
    finishTransition();
    const from = current;
    const to = 1 - current;
    const incoming = decks[to].el;
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
  setVolume: (value) => {
    volume = value;
    if (graph) graph.master.gain.value = value;
  },
  analyser: () => (graph ??= buildGraph()).analyser,
};
