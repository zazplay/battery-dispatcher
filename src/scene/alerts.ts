import * as THREE from 'three';
import { SEV_COLOR, type Sev, type Site, type TargetId } from './buildSite';
import type { Dict } from '../i18n/en';
import { clockOf } from '../sim/day';

/* AI diagnostics on the scene, ported from the second mockup: at set hours the AI "finds" something,
   a beacon lights up over the object and a callout card types out the note. One callout at a time;
   the texts come from the dictionary (t.sceneAlerts) so they follow the language. */

const SCHEDULE: { hr: number; sev: Sev; target: TargetId | null }[] = [
  { hr: 6.5, sev: 'info', target: 'row2' },
  { hr: 9.2, sev: 'warn', target: 'pcs' },
  { hr: 11.0, sev: 'warn', target: 'unit3' },
  { hr: 13.4, sev: 'crit', target: 'unit5' },
  { hr: 16.8, sev: 'info', target: 'pylonB' },
  { hr: 21.3, sev: 'ok', target: null },
];
const CARD_W = 220, LINE = 70;

interface Callout { el: HTMLDivElement; pos: THREE.Vector3; target: THREE.Object3D; forceLeft: boolean; untilT: number; timers: number[] }

export class AlertDirector {
  private fired = new Set<number>();
  private queue: number[] = [];
  private callouts: Callout[] = [];
  private lastHr = 0;

  constructor(private site: Site, private layer: HTMLElement) {}

  /** Call once per frame. `hr` — simulated hour, `t` — real seconds, `w`/`h` — canvas size in CSS px. */
  update(hr: number, t: number, cam: THREE.Camera, w: number, h: number, dict: Dict) {
    if (hr < this.lastHr) this.reset(); // a new day
    this.lastHr = hr;
    SCHEDULE.forEach((a, i) => { if (hr >= a.hr && !this.fired.has(i)) { this.fired.add(i); this.queue.push(i); } });
    this.place(cam, w, h);
    if (!this.callouts.length && this.queue.length) this.show(this.queue.shift()!, dict);
    const b = this.site.beacon;
    if (b.group.visible) {
      const u = b.group.userData as { top: number; r: number; x: number; z: number };
      b.ring.position.set(u.x, 0.4, u.z);
      const s = u.r * (1 + 0.15 * Math.sin(t * 6));
      b.ring.scale.set(s, s, 1);
      b.pin.position.set(u.x, u.top + Math.sin(t * 4) * 0.4, u.z);
      b.mat.opacity = 0.55 + 0.35 * Math.sin(t * 6);
    }
  }

  private show(i: number, dict: Dict) {
    const a = SCHEDULE[i];
    const text = dict.sceneAlerts[i];
    const target = a.target ? this.site.targets[a.target] : this.site.targets.bess;
    const bb = new THREE.Box3().setFromObject(target);
    const anchor = bb.getCenter(new THREE.Vector3());
    anchor.y = bb.max.y;
    const col = SEV_COLOR[a.sev];

    const el = document.createElement('div');
    el.className = 'co';
    el.innerHTML =
      `<i class="co-dot" style="background:${col}"></i><i class="co-ping" style="background:${col}"></i>` +
      `<i class="co-line" style="width:${LINE}px;background:${col}"></i>` +
      `<div class="co-card"><div class="co-head"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0l1.4 4.6L12 6l-4.6 1.4L6 12l-1.4-4.6L0 6l4.6-1.4z" fill="#3b6cff"/></svg>` +
      `${dict.aiNote}<span class="co-time">${clockOf(a.hr)}</span></div><div class="co-note"></div></div>`;
    this.layer.appendChild(el);

    // type the note out, one pair of characters at a time
    const note = el.querySelector<HTMLDivElement>('.co-note')!;
    const timers: number[] = [];
    let n = 0;
    const type = () => { n += 2; note.textContent = text.note.slice(0, n); if (n < text.note.length) timers.push(window.setTimeout(type, 28)); };
    timers.push(window.setTimeout(type, 800));

    // a new callout on the same object replaces the old one; "ok" clears everything
    this.callouts = this.callouts.filter((c) => { if (c.target === target || a.sev === 'ok') { this.remove(c); return false; } return true; });
    const rowsGroup = this.site.targets.row2;
    this.callouts.push({ el, pos: anchor, target, forceLeft: target === rowsGroup, untilT: performance.now() + 900 + text.note.length * 14 + (a.sev === 'ok' ? 3000 : 5000), timers });

    const b = this.site.beacon;
    if (a.target) {
      const tb = new THREE.Box3().setFromObject(target), c = tb.getCenter(new THREE.Vector3());
      b.group.userData = { top: tb.max.y + 2, r: Math.max(tb.max.x - tb.min.x, tb.max.z - tb.min.z) * 0.6, x: c.x, z: c.z };
      b.mat.color.set(col);
      b.group.visible = true;
    } else b.group.visible = false;
  }

  private place(cam: THREE.Camera, w: number, h: number) {
    const now = performance.now();
    this.callouts = this.callouts.filter((c) => {
      if (now > c.untilT) {
        c.el.style.transition = 'opacity .4s';
        c.el.style.opacity = '0';
        window.setTimeout(() => c.el.remove(), 420);
        this.site.beacon.group.visible = false;
        return false;
      }
      return true;
    });
    const p = new THREE.Vector3();
    for (const c of this.callouts) {
      p.copy(c.pos).project(cam);
      const x = ((p.x + 1) / 2) * w, y = ((1 - p.y) / 2) * h;
      const left = c.forceLeft || x > w * 0.62;
      const ln = c.el.querySelector<HTMLElement>('.co-line')!, cd = c.el.querySelector<HTMLElement>('.co-card')!;
      ln.style.left = left ? -LINE + 'px' : '0px';
      ln.style.transformOrigin = left ? 'right' : 'left';
      cd.style.left = left ? -LINE - CARD_W + 'px' : LINE + 'px';
      cd.style.setProperty('--dx', left ? '12px' : '-12px');
      c.el.style.display = p.z < 1 ? '' : 'none';
      c.el.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  private remove(c: Callout) {
    c.timers.forEach(clearTimeout);
    c.el.remove();
  }

  private reset() {
    this.fired.clear();
    this.queue.length = 0;
    this.callouts.forEach((c) => this.remove(c));
    this.callouts = [];
    this.site.beacon.group.visible = false;
  }

  dispose() {
    this.reset();
  }
}
