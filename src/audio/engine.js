// The app's only playback path (Invariant 1): two hidden <audio> decks routed through one
// AudioContext. A module singleton because React StrictMode mounts twice and
// createMediaElementSource may only be called once per element.
const EVENTS = ["loadstart", "loadedmetadata", "timeupdate", "ended", "error"];
const listeners = new Map(EVENTS.map((type) => [type, new Set()]));
let decks = null; // [{ el, gain }]; deck 0 plays until Unit 13 alternates them
let graph = null; // { ctx, master, analyser }, built on the first play (a user gesture)
let volume = 1;
const current = 0;

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
  load: (url) => {
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
  pause: () => deckEl().pause(),
  seek: (time) => {
    deckEl().currentTime = time;
  },
  currentTime: () => (decks ? decks[current].el.currentTime : 0),
  setVolume: (value) => {
    volume = value;
    if (graph) graph.master.gain.value = value;
  },
  analyser: () => (graph ??= buildGraph()).analyser,
};
