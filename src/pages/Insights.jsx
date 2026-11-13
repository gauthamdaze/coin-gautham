import { motion } from 'framer-motion';
import { BarChart3, CalendarDays, Crown, Layers, LineChart as LineIcon, PieChart as PieIcon, Telescope } from 'lucide-react';
import { useData, useEngine, useUI } from '../lib/store';
import { addMonths, cx, fmt, fmt2, fmtDate, isLive, monthLabel } from '../lib/format';
import { Card, CardHeader, CatIcon, Pill, Progress, item, stagger } from '../components/ui';
import { CategoryMix, MiniPie, SavingsLine, TrendBars, WeekdayBars } from '../components/charts';

const Icon = ({ I, g }) => <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft', g)}><I size={18} /></span>;

export default function Insights() {
  const eng = useEngine();
  const accounts = useData((s) => s.accounts);
  const month = useUI((s) => s.month), setMonth = useUI((s) => s.setMonth);
  const ym = month, live = isLive(ym);
  const trend = eng.trend(ym, 6);
  const s = eng.summarize(ym), fc = eng.forecastNext(ym), proj = eng.projectFull(ym);
  const withData = trend.filter((t) => t.has);
  const avgSaved = withData.length ? withData.reduce((a, t) => a + t.saved, 0) / withData.length : 0;
  const avgRate = withData.length ? withData.reduce((a, t) => a + t.rate, 0) / withData.length : 0;

  // stacked mix: top 6 categories over 6 months + Other
  const totals = {};
  trend.forEach((t) => Object.entries(t.byCat).forEach(([k, v]) => { if (v > 0) totals[k] = (totals[k] || 0) + v; }));
  const top = Object.entries(totals).filter(([k]) => k !== '__unc' && eng.catMap.get(k)).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => eng.catMap.get(k));
  const series = [...top.map((c) => ({ id: c.id, name: c.name, color: c.color })), { id: '__other', name: 'Other', color: '#94a3b8' }];
  const mix = trend.map((t) => {
    const row = { ym: t.ym }; let other = 0;
    Object.entries(t.byCat).forEach(([k, v]) => { if (top.some((c) => c.id === k)) row[k] = Math.max(0, v); else other += Math.max(0, v); });
    row.__other = other; return row;
  });

  // weekday over last 3 months
  const wd = new Array(7).fill(0);
  trend.slice(-3).forEach((t) => eng.summarize(t.ym).weekday.forEach((v, i) => (wd[i] += v)));
  const wdNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  const maxWd = wd.indexOf(Math.max(...wd));

  const accPie = accounts.map((a, i) => ({ name: a.name, value: Math.max(0, s.byAcc[a.id] || 0), color: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9'][i % 5] })).filter((x) => x.value > 0);

  const fcRows = eng.expenseCats.map((c) => ({ c, f: fc.byCat[c.id] || 0, now: (live ? proj.byCat[c.id] : s.byCat[c.id]) || 0, b: +c.budget || 0 })).filter((r) => r.f > 0 || r.b > 0).sort((a, b) => b.f - a.f);
  const biggest = eng.monthTx(ym).filter((t) => t.dir === 'D' && (!t.cat || eng.catMap.get(t.cat)?.kind === 'expense')).sort((a, b) => b.amt - a.amt).slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-5">
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: 'Avg. monthly savings', v: fmt(avgSaved), g: 'from-emerald-500 to-teal-500' },
          { l: 'Avg. savings rate', v: Math.round(avgRate) + '%', g: 'from-indigo-500 to-violet-500' },
          { l: `Forecast spend ${monthLabel(addMonths(ym, 1), 'short')}`, v: fmt(fc.total), g: 'from-sky-500 to-cyan-500' },
          { l: 'Biggest spending day', v: wd[maxWd] > 0 ? wdNames[maxWd] : '—', g: 'from-fuchsia-500 to-pink-500' },
        ].map((k) => (
          <motion.div key={k.l} variants={item} className="card relative overflow-hidden p-4">
            <div className={cx('absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-xl', k.g)} />
            <div className="t-3 text-[12px] font-semibold">{k.l}</div>
            <div className={cx('mt-1 bg-gradient-to-r bg-clip-text font-display text-xl font-extrabold text-transparent sm:text-2xl', k.g)}>{k.v}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card delay={0.05}>
          <CardHeader icon={<Icon I={BarChart3} g="from-indigo-500 to-violet-500" />} title="Income vs spending" subtitle="Tap a month to open it"
            right={<div className="flex gap-3 text-xs font-semibold"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Income</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />Spent</span></div>} />
          <TrendBars data={trend} selected={ym} onPick={setMonth} />
        </Card>
        <Card delay={0.08}>
          <CardHeader icon={<Icon I={LineIcon} g="from-emerald-500 to-teal-500" />} title="Savings trend" subtitle="Income minus spending, month by month" />
          <SavingsLine data={trend} />
        </Card>
      </div>

      <Card delay={0.1}>
        <CardHeader icon={<Icon I={Layers} g="from-amber-500 to-orange-500" />} title="Category mix over time" subtitle="Your top 6 categories, stacked" />
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold">
          {series.map((x) => <span key={x.id} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />{x.name}</span>)}
        </div>
        <CategoryMix data={mix} series={series} />
      </Card>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" delay={0.12}>
          <CardHeader icon={<Icon I={CalendarDays} g="from-fuchsia-500 to-purple-500" />} title="Spending by weekday" subtitle="Last 3 months — the brightest bar is your priciest day" />
          <WeekdayBars values={wd} />
        </Card>
        <Card className="lg:col-span-2" delay={0.14}>
          <CardHeader icon={<Icon I={PieIcon} g="from-pink-500 to-rose-500" />} title="By account" subtitle={monthLabel(ym)} />
          {accPie.length ? (
            <>
              <MiniPie data={accPie} />
              <ul className="mt-3 space-y-2">
                {accPie.map((a) => <li key={a.name} className="flex items-center gap-2 text-[13.5px]"><span className="h-3 w-3 rounded-full" style={{ background: a.color }} /><span className="flex-1 truncate">{a.name}</span><b className="num">{fmt(a.value)}</b></li>)}
              </ul>
            </>
          ) : <p className="t-3 text-sm">No spending this month.</p>}
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" delay={0.16}>
          <CardHeader icon={<Icon I={Telescope} g="from-sky-500 to-cyan-500" />} title={`Forecast for ${monthLabel(addMonths(ym, 1))}`}
            subtitle={`Spend ${fmt(fc.total)} · income ${fmt(fc.income)} · save ${fmt(fc.saved)}`} />
          <ul className="space-y-3.5">
            {fcRows.map((r) => (
              <li key={r.c.id} className="flex items-center gap-3">
                <CatIcon cat={r.c} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2 text-[13.5px]">
                    <span className="truncate font-semibold">{r.c.name}</span>
                    <span className="num t-3 shrink-0 text-xs"><b className="t-ink">{fmt(r.f)}</b>{r.b ? ` / ${fmt(r.b)}` : ''}</span>
                  </div>
                  <Progress value={r.f} max={r.b || r.f || 1} color={r.c.color} height={6} />
                </div>
                <div className="w-20 text-right">{!r.b ? <Pill>—</Pill> : r.f > r.b ? <Pill tone="over">Over</Pill> : r.f > r.b * 0.9 && r.f < r.b - 1 ? <Pill tone="risk">Tight</Pill> : <Pill tone="ok">OK</Pill>}</div>
              </li>
            ))}
          </ul>
          <details className="t-3 mt-4 text-[13px]">
            <summary className="cursor-pointer font-semibold">How is this calculated?</summary>
            <p className="mt-2 leading-relaxed">Each category is a weighted average: 50% {monthLabel(ym, 'short')}{live ? ' (projected to month-end from how you usually spend through a month)' : ''}, 30% {monthLabel(addMonths(ym, -1), 'short')}, 20% {monthLabel(addMonths(ym, -2), 'short')}. Missing months are skipped. Fixed costs paid early, like rent, aren't double-counted.</p>
          </details>
        </Card>
        <Card className="lg:col-span-2" delay={0.18}>
          <CardHeader icon={<Icon I={Crown} g="from-amber-400 to-yellow-500" />} title="Biggest spends" subtitle={monthLabel(ym)} />
          <ol className="space-y-3">
            {biggest.map((t, i) => {
              const c = eng.catMap.get(t.cat);
              return (
                <li key={t.id} className="flex items-center gap-3">
                  <span className="t-3 w-4 text-center text-sm font-bold">{i + 1}</span>
                  <CatIcon cat={c} size={36} />
                  <div className="min-w-0 flex-1"><div className="truncate text-[13.5px] font-semibold">{t.desc}</div><div className="t-3 text-xs">{fmtDate(t.date)}{c ? ` · ${c.name}` : ''}</div></div>
                  <b className="num text-[14px]">{fmt2(t.amt)}</b>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
