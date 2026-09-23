import { DaySim, type Snapshot } from './day';

/* A single simulation clock for the whole page. The 3D scene reads `simStore.current` every frame;
   React components subscribe and receive a snapshot at most every UI_INTERVAL ms. */

const UI_INTERVAL = 60;
const sim = new DaySim();
let current: Snapshot = sim.step(0, 0);
let uiSnapshot = current;
let listeners = new Set<() => void>();
let raf = 0;
let start: number | null = null;
let lastT = 0;
let lastUi = 0;

function frame(now: number) {
  if (start === null) start = now;
  const t = (now - start) / 1000;
  const dt = Math.min(0.1, t - lastT);
  lastT = t;
  current = sim.step(t, dt);
  if (now - lastUi >= UI_INTERVAL) {
    lastUi = now;
    uiSnapshot = current;
    listeners.forEach((l) => l());
  }
  raf = requestAnimationFrame(frame);
}

export const simStore = {
  start() {
    if (!raf) raf = requestAnimationFrame(frame);
  },
  stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    simStore.start();
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => uiSnapshot,
  get current() {
    return current;
  },
};
