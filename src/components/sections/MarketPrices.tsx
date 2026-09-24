import { Reveal } from '../Reveal';
import { Flag } from '../Flag';
import { useT } from '../../i18n';

/* Real day-ahead figures for the three markets, collected 23 Sep 2026:
   CZ — OTE day-ahead (euenergy.live), PL — TGE RDN / PSE RCE (nexbe.pl, TGE), UA — Оператор ринку indexes via ExPro, NEURC cap.
   FX used for the € column: 4.37 PLN/€, 51.3 UAH/€. */

type Row = { label: string; local: string; eur: string; tone?: 'low' | 'peak' };

export function MarketPrices() {
  const { t, lang } = useT();
  const p = t.prices;
  const d = lang === 'en' ? '.' : ','; // decimal separator
  const n = (v: string) => v.replace('.', d);
  const eur = (v: string) => n(v) + ' €/kWh';
  // everything per kWh, like the rest of the page: local currency first, euro next to it
  const czk = (v: string) => n(v) + ' Kč/kWh';
  const pln = (v: string) => n(v) + ' zł/kWh';
  const uah = (v: string) => n(v) + ' ₴/kWh';

  const markets: { id: 'cz' | 'pl' | 'ua'; market: string; date: string; rows: Row[]; source: string; note?: string }[] = [
    {
      id: 'cz',
      market: 'OTE · day-ahead',
      date: '23.09.2026',
      rows: [
        { label: `${p.noonLow} · 13:00`, local: czk('1.53'), eur: eur('0.063'), tone: 'low' },
        { label: `${p.eveningPeak} · 19:00`, local: czk('7.57'), eur: eur('0.31'), tone: 'peak' },
        { label: p.dayAvg, local: czk('3.77'), eur: eur('0.155') },
        { label: `${p.monthAvg} · 09/2026`, local: czk('3.70'), eur: eur('0.152') },
        { label: p.spread, local: '5×', eur: '' },
      ],
      source: 'OTE, euenergy.live',
    },
    {
      id: 'pl',
      market: 'TGE RDN · PSE RCE',
      date: '23.09.2026',
      rows: [
        { label: `${p.noonLow} · 12–16`, local: pln('0.28'), eur: eur('0.063'), tone: 'low' },
        { label: `${p.eveningPeak} · 18–21`, local: pln('1.61'), eur: eur('0.37'), tone: 'peak' },
        { label: p.dayAvg, local: pln('0.76'), eur: eur('0.175') },
        { label: `${p.monthAvg} · 08/2026`, local: pln('0.56'), eur: eur('0.128') },
        { label: p.spread, local: n('5.8') + '×', eur: '' },
      ],
      source: 'TGE, PSE / nexbe.pl',
    },
    {
      id: 'ua',
      market: 'Оператор ринку · РДН',
      date: '09/2026',
      rows: [
        { label: `${p.base} · 08/2026`, local: uah('5.89'), eur: eur('0.115') },
        { label: `${p.base} · 03.09.2026`, local: uah('8.62'), eur: eur('0.168'), tone: 'peak' },
        { label: `${p.peakOff} · 04/2026`, local: n('7.36') + ' / ' + uah('6.69'), eur: n('0.143') + ' / ' + eur('0.130') },
        { label: `${p.cap} · 05/2026 →`, local: uah('15.00'), eur: eur('0.29') },
        { label: p.spreadPeak, local: '≈' + n('1.1') + '×', eur: '' },
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
                  <Flag of={m.id} />
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
