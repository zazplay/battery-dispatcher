import { DayChart } from '../DayChart';
import { Reveal } from '../Reveal';
import { Rich, useT } from '../../i18n';

export function Problem() {
  const { t } = useT();
  return (
    <section className="sec" id="problem">
      <div className="wrap two">
        <Reveal>
          <p className="eyebrow">{t.problem.eyebrow}</p>
          <h2>{t.problem.title}</h2>
          <p className="sub"><Rich text={t.problem.text} /></p>
        </Reveal>
        <Reveal className="chart-card">
          <DayChart
            width={720}
            height={260}
            top={44}
            bottom={220}
            strokeWidth={2}
            ticks={['00:00', '06:00', '12:00', '18:00', '24:00']}
            marks={[
              { hr: 13, text: t.problem.markNoon, anchor: 'middle' },
              { hr: 19.5, text: t.problem.markPeak, anchor: 'end' },
            ]}
            label={t.problem.chartLabel}
          />
          <div className="cap">
            <span className="cap-g"><Rich text={t.problem.cap1} /></span>
            <span className="cap-b"><Rich text={t.problem.cap2} /></span>
          </div>
          {/* the curve is the model day of the scene; the real market figures follow in the next section */}
          <p className="chart-note">{t.problem.note}</p>
        </Reveal>
      </div>
    </section>
  );
}
