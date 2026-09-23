import { siHuawei } from 'simple-icons';
import { useT } from '../i18n';

/* Manufacturers the system talks to. Logos live in public/logos/. Each entry carries the file's aspect ratio
   (width / height) so the ribbon can give a wide wordmark and a compact mark the same visual weight:
   height = 62 / sqrt(aspect), capped at 44px — i.e. roughly equal area for every logo. */
type Brand = { name: string; file?: string; aspect?: number; scale?: number; icon?: { path: string; hex: string } };
const BRANDS: Brand[] = [
  { name: 'Huawei', icon: siHuawei },
  { name: 'SolarEdge', file: 'solaredge.svg', aspect: 4.71 },
  { name: 'SMA', file: 'sma.svg', aspect: 1.58, scale: 0.9 },
  { name: 'Fronius', file: 'fronius.png', aspect: 2.0 },
  { name: 'Sungrow', file: 'sungrow.png', aspect: 7.5 },
  { name: 'GoodWe', file: 'goodwe-logo.svg', aspect: 6.73 },
  { name: 'Growatt', file: 'growatt.png', aspect: 2.76 },
  { name: 'Deye', file: 'deye.png', aspect: 2.59 },
  { name: 'Victron Energy', file: 'victron.svg', aspect: 5.22 },
  { name: 'SolaX Power', file: 'solax.png', aspect: 3.68 },
  { name: 'Fox ESS', file: 'foxess.png', aspect: 2.0 },
  { name: 'Kostal', file: 'kostal.svg', aspect: 4.61 },
  { name: 'Enphase', file: 'enphase.svg', aspect: 5.62 },
  { name: 'BYD', file: 'byd.svg', aspect: 1.65 },
  { name: 'Pylontech', file: 'pylontech.png', aspect: 4.98 },
  { name: 'LG Energy Solution', file: 'lg.svg', aspect: 8.08 },
  { name: 'Siemens', file: 'siemens.svg', aspect: 4.2 },
  { name: 'ABB', file: 'abb.svg', aspect: 2.52 },
  { name: 'Schneider Electric', file: 'schneider.svg', aspect: 3.31 },
  { name: 'Panasonic', file: 'panasonic.svg', aspect: 6.54 },
];

const heightFor = (aspect = 4, scale = 1) => Math.round(Math.min(44, 62 / Math.sqrt(aspect)) * scale);

function Mark({ name, file, aspect, scale, icon }: Brand) {
  if (file) return <span className="brand-mark"><img src={`/logos/${file}`} alt={name} title={name} style={{ height: heightFor(aspect, scale) }} /></span>;
  return (
    <span className="brand-mark">
      {icon && <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icon.path} fill={`#${icon.hex}`} /></svg>}
      {name}
    </span>
  );
}

/** Endless ribbon of manufacturer marks right under the hero. Two copies of the row make the loop seamless. */
export function LogoMarquee() {
  const { t } = useT();
  return (
    <section className="marquee" aria-label={t.marquee.label}>
      <div className="marquee-label">{t.marquee.label}</div>
      <div className="marquee-track">
        <div className="marquee-row">
          {BRANDS.map((b) => <Mark key={b.name} {...b} />)}
          {BRANDS.map((b) => <Mark key={b.name + '-2'} {...b} />)}
        </div>
      </div>
    </section>
  );
}
