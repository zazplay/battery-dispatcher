import { useSim } from '../sim/useSim';
import { fmt, MODE_COLOR, priceTag } from '../sim/day';
import { useT } from '../i18n';

/** Phone-only replacement for the floating callouts over the 3D scene: the same live numbers as a compact grid. */
export function SceneStats() {
  const s = useSim();
  const { t } = useT();
  const color = MODE_COLOR[s.mode];
  return (
    <div className="scene-stats" aria-live="off">
      <div className="money">
        <div>
          <span>{t.scene.earnedToday}</span>
          <b>{t.eur(s.rev)}</b>
        </div>
        <i style={{ color: s.rate > 1 ? color : 'var(--grey)' }}>{s.rate > 1 ? t.rate(s.rate) : t.scene.noExport}</i>
      </div>
      <div className="cell"><span>{t.scene.solar}</span><b>{fmt(s.pv * 1000)} kW</b></div>
      <div className="cell"><span>{t.scene.batteries}</span><b>{Math.round(s.soc * 100)} %</b></div>
      <div className="cell"><span>{t.scene.grid}</span><b>{fmt(s.gridP * 1000)} kW</b></div>
      <div className="cell ai" style={{ color }}>
        <span>AI · {t.modes[s.mode]}</span>
        <b>{s.mode === 'hold' ? t.tags.short(priceTag(s.price, t)) : t.priceShort(s.price)}</b>
      </div>
    </div>
  );
}
