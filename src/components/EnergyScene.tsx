import { useEffect, useRef, useState } from 'react';
import { Stage, isPhone } from '../scene/Stage';
import { buildSite, animateSite, type LabelId } from '../scene/buildSite';
import { AlertDirector } from '../scene/alerts';
import { simStore } from '../sim/store';
import { useSim } from '../sim/useSim';
import { fmt, MODE_COLOR, priceTag } from '../sim/day';
import { currentDict, useT } from '../i18n';

if (import.meta.hot) import.meta.hot.accept(() => location.reload()); // the WebGL scene does not survive hot swaps well

const LABELS: { id: LabelId; unit: string; rise: number }[] = [
  { id: 'grid', unit: 'kW', rise: 125 },
  { id: 'bat', unit: '%', rise: 185 },
  { id: 'ai', unit: '', rise: 110 },
  { id: 'pv', unit: 'kW', rise: 205 },
];

/** Money card in the corner of the scene: what the day has earned and at what price the AI is acting. */
function MoneyHud() {
  const s = useSim();
  const { t } = useT();
  const color = MODE_COLOR[s.mode];
  const p = t.priceShort(s.price), tag = priceTag(s.price, t);
  const line = s.mode === 'sell' ? t.scene.sellingAt(p, tag) : s.mode === 'charge' ? t.scene.storingAt(p, tag) : t.scene.holding(p, tag);
  return (
    <div className="hud">
      <span className="hud-label">{t.scene.earnedToday}</span>
      <b className="hud-money">{t.eur(s.rev)}</b>
      <span className="hud-rate" style={{ color: s.rate > 1 ? color : 'var(--muted)' }}>
        {s.rate > 1 ? t.scene.perHour(s.rate) : t.scene.noExport}
      </span>
      <span className="hud-line" style={{ color }}>{line}</span>
    </div>
  );
}

/** The 3D site with floating labels. Labels are updated straight in the DOM every frame — React would be too slow for that. */
export function EnergyScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const calloutsRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const layoutRef = useRef<(() => void) | null>(null);
  const { t } = useT();

  useEffect(() => {
    const host = hostRef.current;
    const layer = labelsRef.current;
    const coLayer = calloutsRef.current;
    if (!host || !layer || !coLayer) return;
    let stage: Stage;
    try {
      stage = new Stage(host);
    } catch (e) {
      setError('The 3D scene could not start in this browser.');
      console.error(e);
      return;
    }
    const site = buildSite();
    // desktop: the whole site a little below centre (the canvas stops short of the right edge, see .stage in styles.css);
    // phones: frame only the core objects so the scene fills the small box
    stage.setObject(site.root, { shiftY: 0.12, phoneBox: site.coreBox });
    const alerts = new AlertDirector(site, coLayer);

    const nodes = LABELS.map((def) => {
      const el = layer.querySelector<HTMLDivElement>(`[data-id="${def.id}"]`)!;
      return {
        def,
        at: site.anchors[def.id],
        el,
        line: el.querySelector<HTMLDivElement>('.line')!,
        txt: el.querySelector<HTMLDivElement>('.txt')!,
        v: el.querySelector<HTMLSpanElement>('.v')!,
        u: el.querySelector<HTMLElement>('small')!,
        t: el.querySelector<HTMLDivElement>('.ttl')!,
      };
    });

    /* Lay the callouts out: scale the line lengths to the box, flip a label that would run off the right edge,
       and push overlapping labels further up their lines. The camera is static, so this only runs on resize / language change. */
    const layout = () => {
      const w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      const phone = isPhone();
      const k = phone ? Math.max(0.5, h / 600) : Math.min(1, h / 820);
      const items = nodes.map((n) => {
        const p = n.at.clone().project(stage.camera);
        const sx = ((p.x + 1) / 2) * w, sy = ((1 - p.y) / 2) * h;
        const r = n.txt.getBoundingClientRect();
        const flip = sx + 10 + r.width > w - 6;
        return { n, sx, sy, tw: r.width, th: r.height, rise: Math.round(n.def.rise * k), flip };
      });
      const rect = (it: (typeof items)[number]) => ({
        x1: it.flip ? it.sx - 10 - it.tw : it.sx + 10,
        x2: it.flip ? it.sx - 10 : it.sx + 10 + it.tw,
        y1: it.sy - it.rise - 4,
        y2: it.sy - it.rise - 4 + it.th,
      });
      const GAP = 6;
      for (let pass = 0; pass < 12; pass++) {
        let moved = false;
        for (let i = 0; i < items.length; i++)
          for (let j = i + 1; j < items.length; j++) {
            const a = rect(items[i]), b = rect(items[j]);
            const overlapX = a.x1 < b.x2 + GAP && b.x1 < a.x2 + GAP;
            const overlapY = a.y1 < b.y2 + GAP && b.y1 < a.y2 + GAP;
            if (!overlapX || !overlapY) continue;
            // push the label whose text sits higher further up, so the two stack instead of colliding
            const up = a.y1 <= b.y1 ? items[i] : items[j], other = up === items[i] ? b : a;
            up.rise += Math.round(rect(up).y2 - other.y1 + GAP);
            moved = true;
          }
        if (!moved) break;
      }
      for (const it of items) {
        const maxRise = Math.max(30, it.sy - it.th - 8); // keep the text inside the box
        it.rise = Math.min(it.rise, maxRise);
        it.n.line.style.height = it.rise + 'px';
        it.n.txt.style.top = -it.rise + 'px';
        it.n.el.classList.toggle('flip', it.flip);
      }
    };
    layoutRef.current = layout;
    const fontsReady = setTimeout(layout, 900); // web fonts change the text widths

    let lastW = 0, lastH = 0;
    stage.setAnimationLoop(() => {
      const s = simStore.current;
      const d = currentDict; // the language can change while the scene runs
      animateSite(site, s);
      const w = host.clientWidth, h = host.clientHeight;
      const phone = isPhone();
      alerts.update(s.hr, s.t, stage.camera, w, h, d);
      for (const n of nodes) {
        const p = n.at.clone().project(stage.camera);
        const visible = p.z < 1 && p.z > -1;
        n.el.style.display = visible ? '' : 'none';
        n.el.style.transform = `translate(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px)`;
      }
      if (w !== lastW || h !== lastH) {
        lastW = w; lastH = h;
        layout(); // after the labels are visible, so their text can be measured
      }
      const [grid, bat, ai, pv] = nodes;
      pv.v.textContent = fmt(s.pv * 1000);
      grid.v.textContent = fmt(s.gridP * 1000);
      grid.u.textContent = s.rate > 1 && !phone ? `kW · ${d.rate(s.rate).replace(/\s*\/\s*/, '/')}` : 'kW';
      bat.v.textContent = String(Math.round(s.soc * 100));
      bat.u.textContent = phone ? '%' : '% · ' + (s.soc * 2.4).toFixed(1) + ' MWh';
      const color = MODE_COLOR[s.mode];
      // the AI label shows the price it is acting on (short form on phones)
      if (s.mode === 'hold') {
        ai.v.textContent = 'AI';
        ai.u.textContent = '';
        ai.t.textContent = phone ? d.modes.hold : d.scene.aiWaiting;
      } else {
        ai.v.textContent = d.priceShort(s.price);
        ai.u.textContent = '/kWh';
        const what = s.mode === 'sell' ? d.scene.aiSells : d.scene.aiCharges;
        ai.t.textContent = phone ? what : what + ' · ' + d.tags.short(priceTag(s.price, d));
      }
      ai.v.style.color = color;
      ai.t.style.color = color;
    });
    simStore.start();
    return () => {
      clearTimeout(fontsReady);
      layoutRef.current = null;
      alerts.dispose();
      stage.dispose();
    };
  }, []);

  // label texts change with the language → re-measure and re-place them
  useEffect(() => {
    const id = setTimeout(() => layoutRef.current?.(), 50);
    return () => clearTimeout(id);
  }, [t]);

  const titles: Record<LabelId, string> = { grid: t.scene.grid, bat: t.scene.batteries, ai: t.scene.aiWaiting, pv: t.scene.solar };
  return (
    <div className="stage-wrap" id="scene">
      <div className="stage" ref={hostRef} />
      <div className="labels" ref={labelsRef} aria-hidden="true">
        {LABELS.map((l) => (
          <div key={l.id} className="lbl" data-id={l.id} style={{ display: 'none' }}>
            <div className="line" style={{ height: l.rise }} />
            <div className="txt" style={{ top: -l.rise }}>
              <div className="val">
                <span className="v">{l.id === 'ai' ? 'AI' : '0'}</span>
                <small>{l.unit}</small>
              </div>
              <div className="ttl">{titles[l.id]}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="callouts" ref={calloutsRef} aria-hidden="true" />
      <MoneyHud />
      {error && <div className="stage-err">{error}</div>}
    </div>
  );
}
