import type { ReactNode } from 'react';
import { Reveal } from '../Reveal';
import { useT } from '../../i18n';

/* Real day-ahead figures for the three markets, collected 23 Sep 2026:
   CZ — OTE day-ahead (euenergy.live), PL — TGE RDN / PSE RCE (nexbe.pl, TGE), UA — Оператор ринку indexes via ExPro, NEURC cap.
   FX used for the € column: 4.37 PLN/€, 51.3 UAH/€. */

const FLAGS: Record<'cz' | 'pl' | 'ua', ReactNode> = {
  cz: (
    <svg viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="8" fill="#fff" /><rect y="8" width="24" height="8" fill="#d7141a" /><path d="M0 0l12 8-12 8z" fill="#11457e" /></svg>
  ),
  pl: (
    <svg viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="8" fill="#fff" /><rect y="8" width="24" height="8" fill="#dc143c" /></svg>
  ),
  ua: (
    <svg viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="8" fill="#0057b7" /><rect y="8" width="24" height="8" fill="#ffd700" /></svg>
  ),
};

type Row = { label: string; local: string; eur: string; tone?: 'low' | 'peak' };

export function MarketPrices() {
  const { t, lang } = useT();
  const p = t.prices;
  const d = lang === 'en' ? '.' : ','; // decimal separator
  const eur = (v: string) => v.replace('.', d) + ' €/kWh';

  const markets: { id: 'cz' | 'pl' | 'ua'; market: string; date: string; rows: Row[]; source: string; note?: string }[] = [
    {
      id: 'cz',
      market: 'OTE · day-ahead',
      date: '23.09.2026',
      rows: [
        { label: `${p.noonLow} · 13:00`, local: '63 €/MWh', eur: eur('0.063'), tone: 'low' },
        { label: `${p.eveningPeak} · 19:00`, local: '311 €/MWh', eur: eur('0.31'), tone: 'peak' },
        { label: p.dayAvg, local: '155 €/MWh', eur: eur('0.155') },
        { label: `${p.monthAvg} · 09/2026`, local: '152 €/MWh', eur: eur('0.152') },
        { label: p.spread, local: '5×', eur: '' },
      ],
      source: 'OTE, euenergy.live',
    },
    {
      id: 'pl',
      market: 'TGE RDN · PSE RCE',
      date: '23.09.2026',
      rows: [
        { label: `${p.noonLow} · 12–16`, local: '276 PLN/MWh', eur: eur('0.063'), tone: 'low' },
        { label: `${p.eveningPeak} · 18–21`, local: '1 612 PLN/MWh', eur: eur('0.37'), tone: 'peak' },
        { label: p.dayAvg, local: '763 PLN/MWh', eur: eur('0.175') },
        { label: `${p.monthAvg} · 08/2026`, local: '558 PLN/MWh', eur: eur('0.128') },
        { label: p.spread, local: '5,8×'.replace(',', d), eur: '' },
      ],
      source: 'TGE, PSE / nexbe.pl',
    },
    {
      id: 'ua',
      market: 'Оператор ринку · РДН',
      date: '09/2026',
      rows: [
        { label: `${p.base} · 08/2026`, local: '5 893 UAH/MWh', eur: eur('0.115') },
        { label: `${p.base} · 03.09.2026`, local: '8 624 UAH/MWh', eur: eur('0.168'), tone: 'peak' },
        { label: `${p.peakOff} · 04/2026`, local: '7 360 / 6 685', eur: eur('0.143') + ' / ' + '0.130'.replace('.', d) },
        { label: `${p.cap} · 05/2026 →`, local: '15 000 UAH/MWh', eur: eur('0.29') },
        { label: p.spreadPeak, local: '≈1,1×'.replace(',', d), eur: '' },
      ],
      source: 'Оператор ринку, ExPro, НКРЕКП',
      note: p.uaNote,
    },
  ];

  return (
    <section className="sec dark" id="prices">
      <div className="wrap">
        <p className="eyebrow">{p.eyebrow}</p>
        <h2>{p.title}</h2>
        <p className="sub">{p.sub}</p>
        <Reveal>
          <div className="markets">
            {markets.map((m) => (
              <div className="market" key={m.id}>
                <div className="market-head">
                  <span className="flag">{FLAGS[m.id]}</span>
                  <div>
                    <b>{p.countries[m.id]}</b>
                    <span>{m.market}</span>
                  </div>
                </div>
                <table>
                  <tbody>
                    {m.rows.map((r) => (
                      <tr key={r.label} className={r.tone ?? ''}>
                        <th scope="row">{r.label}</th>
                        <td>{r.local}</td>
                        <td>{r.eur}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="market-foot">
                  <span>{p.source}: {m.source}</span>
                  <span>{p.asOf} {m.date}</span>
                </div>
                {m.note && <p className="market-note">{m.note}</p>}
              </div>
            ))}
          </div>
        </Reveal>
        <p className="fx">{p.fx}</p>
      </div>
    </section>
  );
}
