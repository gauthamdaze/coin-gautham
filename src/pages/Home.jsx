import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CalendarClock, PiggyBank, Tags, TrendingUp, Wallet } from 'lucide-react';
import { useData, useEngine, useUI } from '../lib/store';
import { addMonths, clamp, cx, dim, fmt, fmtShort, isLive, monthLabel, TODAY } from '../lib/format';
import { AnimatedNumber, Card, CardHeader, CatIcon, Delta, Pill, Progress, Rings, item, softSpring, stagger } from '../components/ui';
import { Donut, PaceChart } from '../components/charts';
import { AllGoodArt, EmptyArt, HeroWallet } from '../components/Illustrations';

const UNC = { id: '__unc', name: 'Uncategorised', color: '#94a3b8', icon: null };

export default function Home() {
  const eng = useEngine();
  const month = useUI((s) => s.month), setTab = useUI((s) => s.setTab), setTxFilter = useUI((s) => s.setTxFilter);
  const accounts = useData((s) => s.accounts);
  const ym = month, live = isLive(ym), prev = addMonths(ym, -1), prevLbl = monthLabel(prev, 'short');

  if (!eng.hasData(ym)) {
    return (
      <Card className="flex flex-col items-center py-14 text-center">
        <EmptyArt className="h-36 w-48" />
        <h2 className="section-title mt-4">Nothing in {monthLabel(ym)} yet</h2>
        <p className="t-3 mt-1 max-w-sm text-sm">Import a statement or switch month / account to see your dashboard come alive.</p>
        <button className="btn-primary mt-5" onClick={() => setTab('import')}>Import statement</button>
      </Card>
    );
  }

  const s = eng.summarize(ym);
  const d = TODAY.getDate();
  const ps = eng.hasData(prev) ? eng.summarize(prev, live ? Math.round((d / dim(ym)) * dim(prev)) : 0) : null;
  const psFull = eng.hasData(prev) ? eng.summarize(prev) : null;
  const proj = eng.projectFull(ym), fc = eng.forecastNext(ym);
  const TB = eng.totalBudget, saved = s.income - s.spent;
  const rate = s.income > 0 ? saved / s.income : 0;

  // donut data
  const slices = eng.expenseCats.map((c) => ({ id: c.id, name: c.name, value: s.byCat[c.id] || 0, color: c.color, cat: c })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value);
  if (s.byCat.__unc > 0) slices.push({ id: '__unc', name: 'Uncategorised', value: s.byCat.__unc, color: '#94a3b8', cat: UNC });

  // alerts
  const over = [], risk = [];
  for (const c of eng.expenseCats) {
    const sp = s.byCat[c.id] || 0, b = +c.budget || 0;
    if (!b) continue;
    if (sp > b) over.push({ c, amt: sp - b });
    else if (live && (proj.byCat[c.id] || 0) > b * 1.02) risk.push({ c, p: proj.byCat[c.id] });
  }
  over.sort((a, b) => b.amt - a.amt);
  const overTotal = over.reduce((a, o) => a + o.amt, 0);

  // pace data
  const D = dim(ym), PD = eng.hasData(prev) ? dim(prev) : 0, X = Math.max(D, PD), lastDay = live ? d : D;
  const pace = []; let c1 = 0, c2 = 0; const pDaily = PD ? eng.summarize(prev).daily : [];
  for (let i = 1; i <= X; i++) {
    if (i <= D) c1 += s.daily[i] || 0;
    if (i <= PD) c2 += pDaily[i] || 0;
    const row = { day: i, cur: i <= lastDay ? c1 : null, prev: i <= PD ? c2 : null, proj: null };
    pace.push(row);
  }
  if (live && lastDay < D) {
    const start = pace[lastDay - 1].cur;
    for (let i = lastDay; i <= D; i++) pace[i - 1].proj = start + ((proj.total - start) * (i - lastDay)) / (D - lastDay);
  }

  const catRows = eng.expenseCats.map((c) => ({ c, sp: s.byCat[c.id] || 0, b: +c.budget || 0, p: proj.byCat[c.id] || 0 })).filter((r) => r.sp > 0 || r.b > 0).sort((a, b) => (b.b ? b.sp / b.b : 0) - (a.b ? a.sp / a.b : 0)).slice(0, 6);
  const merch = Object.entries(s.merchants).filter((e) => e[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const mMax = merch.length ? merch[0][1] : 1;
  const categorisedPct = s.n ? (s.n - s.unc.n) / s.n : 1;
  const gradients = ['from-indigo-500 to-violet-500', 'from-sky-500 to-cyan-400', 'from-emerald-500 to-teal-400', 'from-amber-500 to-orange-400', 'from-rose-500 to-pink-500', 'from-fuchsia-500 to-purple-500'];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={softSpring}
        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-glow sm:p-8"
      >
        <div className="absolute -right-10 -top-16 h-64 w-64 animate-blob rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-20 left-10 h-56 w-56 animate-blob rounded-full bg-sky-300/25 blur-3xl" style={{ animationDelay: '-8s' }} />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-white/80"><Wallet size={16} /> Spent in {monthLabel(ym, 'month')}{live ? ' so far' : ''}</div>
            <div className="mt-1 font-display text-[44px] font-extrabold leading-none tracking-tight sm:text-6xl"><AnimatedNumber value={s.spent} /></div>
            <div className="mt-2 text-sm text-white/85">
              {ps ? (() => { const dd = s.spent - ps.spent; return <>{dd > 0 ? '↑' : '↓'} {fmt(Math.abs(dd))} {dd > 0 ? 'more' : 'less'} than {prevLbl}{live ? ' at this point' : ''}</>; })() : 'First month of data'}
            </div>
            {TB > 0 && (
              <div className="mt-5 max-w-md">
                <div className="mb-1.5 flex justify-between text-xs font-semibold text-white/85">
                  <span>{Math.round((s.spent / TB) * 100)}% of {fmt(TB)} budget</span>
                  <span>{s.spent > TB ? `${fmt(s.spent - TB)} over` : `${fmt(TB - s.spent)} left`}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
                  <motion.div className={cx('h-full rounded-full', s.spent > TB ? 'bg-rose-300' : 'bg-white')} initial={{ width: 0 }} animate={{ width: clamp((s.spent / TB) * 100, 0, 100) + '%' }} transition={{ ...softSpring, delay: 0.2 }} />
                </div>
              </div>
            )}
            <motion.div variants={stagger} initial="hidden" animate="show" className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { l: 'Income', v: s.income, i: TrendingUp },
                { l: live ? 'Saved so far' : 'Saved', v: saved, i: PiggyBank },
                { l: `Forecast ${monthLabel(addMonths(ym, 1), 'short')}`, v: fc.total, i: CalendarClock },
              ].map((k) => (
                <motion.div key={k.l} variants={item} className="rounded-2xl bg-white/12 p-3 backdrop-blur-md ring-1 ring-white/15">
                  <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-white/75"><k.i size={13} />{k.l}</div>
                  <div className="num mt-0.5 text-[15px] font-bold sm:text-lg">{fmtShort(k.v)}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <HeroWallet className="hidden h-44 w-56 md:block lg:h-52 lg:w-64" />
        </div>
      </motion.section>

      {/* ALERTS */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
        {over.length > 0 && (
          <motion.div variants={item} className="card min-w-[280px] snap-start border-rose-500/20 !bg-rose-500/[.06] p-4">
            <div className="flex items-center gap-2 font-bold text-rose-600 dark:text-rose-400"><AlertTriangle size={18} /> Over budget by {fmt(overTotal)}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">{over.map((o) => <span key={o.c.id} className="chip bg-white/70 !py-1 dark:bg-white/5"><span className="h-2 w-2 rounded-full" style={{ background: o.c.color }} />{o.c.name} <b className="text-rose-600 dark:text-rose-400">+{fmt(o.amt)}</b></span>)}</div>
          </motion.div>
        )}
        {risk.length > 0 && (
          <motion.div variants={item} className="card min-w-[280px] snap-start border-amber-500/25 !bg-amber-500/[.07] p-4">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400"><CalendarClock size={18} /> On pace to overspend</div>
            <div className="mt-2 flex flex-wrap gap-1.5">{risk.map((o) => <span key={o.c.id} className="chip bg-white/70 !py-1 dark:bg-white/5"><span className="h-2 w-2 rounded-full" style={{ background: o.c.color }} />{o.c.name} · {fmtShort(o.p)} / {fmtShort(o.c.budget)}</span>)}</div>
          </motion.div>
        )}
        {s.unc.n > 0 && (
          <motion.button variants={item} whileTap={{ scale: 0.98 }} onClick={() => { setTxFilter({ cat: '__unc', scope: 'month', q: '', dir: 'all' }); setTab('activity'); }} className="card min-w-[280px] snap-start border-indigo-500/20 !bg-indigo-500/[.06] p-4 text-left">
            <div className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-300"><Tags size={18} /> {s.unc.n} need a category</div>
            <p className="t-2 mt-1.5 text-[13px]">{s.unc.amt ? `${fmt(s.unc.amt)} of spending is uncategorised.` : 'A few credits aren’t categorised.'}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-300">Categorise now <ArrowRight size={14} /></span>
          </motion.button>
        )}
        {!over.length && !risk.length && TB > 0 && (
          <motion.div variants={item} className="card flex min-w-[280px] snap-start items-center gap-3 border-emerald-500/20 !bg-emerald-500/[.06] p-4">
            <AllGoodArt className="h-14 w-14 shrink-0" />
            <div><div className="font-bold text-emerald-700 dark:text-emerald-400">All within budget</div><p className="t-2 text-[13px]">{live ? 'And on pace to stay there. Nice!' : 'Great month!'}</p></div>
          </motion.div>
        )}
      </motion.div>

      {/* DONUT + RINGS */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" delay={0.05}>
          <CardHeader title="Where your money went" subtitle="Tap a slice or category to see its transactions" />
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <Donut data={slices} total={s.spent} onSelect={(d) => { setTxFilter({ cat: d.id, scope: 'month', q: '', dir: 'all' }); setTab('activity'); }} />
            <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-1">
              {slices.slice(0, 7).map((x) => (
                <motion.li key={x.id} variants={item}>
                  <button onClick={() => { setTxFilter({ cat: x.id, scope: 'month', q: '', dir: 'all' }); setTab('activity'); }} className="flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition hover:bg-black/[.03] dark:hover:bg-white/[.04]">
                    <CatIcon cat={x.id === '__unc' ? null : x.cat} size={32} />
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{x.name}</span>
                    <span className="t-3 num text-xs">{Math.round((x.value / s.spent) * 100)}%</span>
                    <span className="num w-20 text-right text-[14px] font-semibold">{fmt(x.value)}</span>
                  </button>
                </motion.li>
              ))}
              {slices.length > 7 && <li className="t-3 px-2 pt-1 text-xs">+ {slices.length - 7} more categories</li>}
            </motion.ul>
          </div>
        </Card>

        <Card className="lg:col-span-2" delay={0.1}>
          <CardHeader title="Your month at a glance" subtitle="Close your rings — stay under budget, save more" />
          <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative">
              <Rings rings={[
                { value: TB ? s.spent / TB : 0, color: s.spent > TB ? '#f43f5e' : '#6366f1' },
                { value: Math.max(0, rate) / 0.5, color: '#10b981' },
                { value: categorisedPct, color: '#f59e0b' },
              ]} />
            </div>
            <ul className="w-full space-y-3">
              {[
                { c: s.spent > TB ? '#f43f5e' : '#6366f1', l: 'Budget used', v: TB ? Math.round((s.spent / TB) * 100) + '%' : '—', sub: TB ? `${fmt(s.spent)} of ${fmt(TB)}` : 'Set budgets' },
                { c: '#10b981', l: 'Savings rate', v: Math.round(rate * 100) + '%', sub: `Goal 50% · ${fmt(saved)} saved` },
                { c: '#f59e0b', l: 'Categorised', v: Math.round(categorisedPct * 100) + '%', sub: `${s.n - s.unc.n} of ${s.n} transactions` },
              ].map((r) => (
                <li key={r.l} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: r.c }} />
                  <div className="flex-1"><div className="text-[13.5px] font-semibold">{r.l}</div><div className="t-3 text-xs">{r.sub}</div></div>
                  <div className="num font-display text-lg font-extrabold" style={{ color: r.c }}>{r.v}</div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* PACE + BUDGETS */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" delay={0.12}>
          <CardHeader title="Spending pace" subtitle={live ? `On track for ${fmt(proj.total)} by month-end` : `Running total through ${monthLabel(ym, 'month')}`}
            right={<div className="hidden flex-wrap justify-end gap-3 text-xs font-semibold sm:flex">
              <span className="flex items-center gap-1.5"><span className="h-1 w-4 rounded-full bg-indigo-500" />{monthLabel(ym, 'short')}</span>
              {PD > 0 && <span className="flex items-center gap-1.5"><span className="h-1 w-4 rounded-full bg-amber-500" />{prevLbl}</span>}
              {live && <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-indigo-500" />Projected</span>}
            </div>} />
          <PaceChart data={pace} budget={TB} curLabel={monthLabel(ym, 'short')} prevLabel={prevLbl} />
        </Card>

        <Card className="lg:col-span-2" delay={0.16}>
          <CardHeader title="Budgets" subtitle="Closest to the limit first" right={<button className="btn-ghost !px-3 !py-1.5 text-[13px] text-indigo-600 dark:text-indigo-300" onClick={() => setTab('budgets')}>See all <ArrowRight size={14} /></button>} />
          <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {catRows.map((r) => {
              const overAmt = r.b && r.sp > r.b ? r.sp - r.b : 0;
              return (
                <motion.li key={r.c.id} variants={item} className="flex items-center gap-3">
                  <CatIcon cat={r.c} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-semibold">{r.c.name}</span>
                      <span className="num t-3 shrink-0 text-xs"><b className="t-ink">{fmt(r.sp)}</b>{r.b ? ` / ${fmtShort(r.b)}` : ''}</span>
                    </div>
                    <Progress value={r.sp} max={r.b || r.sp || 1} color={r.c.color} projected={live ? r.p : 0} />
                    <div className="mt-1 text-[11.5px]">{overAmt ? <span className="font-semibold text-rose-600 dark:text-rose-400">{fmt(overAmt)} over budget</span> : r.b ? <span className="t-3">{fmt(r.b - r.sp)} left{live && r.p > r.b ? ' · projected over' : ''}</span> : <span className="t-3">No budget set</span>}</div>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </Card>
      </div>

      {/* MERCHANTS + ACCOUNTS */}
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card delay={0.18}>
          <CardHeader title="Top merchants" subtitle={`Where you spent most in ${monthLabel(ym, 'month')}`} />
          <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {merch.map(([k, v], i) => (
              <motion.li key={k} variants={item} className="flex items-center gap-3">
                <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-sm font-extrabold uppercase text-white shadow-soft', gradients[i % gradients.length])}>{k.slice(0, 2)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2"><span className="truncate text-[14px] font-semibold capitalize">{k}</span><span className="num text-[14px] font-bold">{fmt(v)}</span></div>
                  <div className="bg-track mt-1.5 h-1.5 overflow-hidden rounded-full"><motion.div className={cx('h-full rounded-full bg-gradient-to-r', gradients[i % gradients.length])} initial={{ width: 0 }} animate={{ width: (v / mMax) * 100 + '%' }} transition={{ ...softSpring, delay: 0.1 + i * 0.05 }} /></div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </Card>
        <Card delay={0.2}>
          <CardHeader title="By account" subtitle="Card-bill payments are excluded, so nothing is counted twice" />
          <div className="space-y-3">
            {accounts.map((a, i) => {
              const v = s.byAcc[a.id] || 0; if (!v) return null;
              const pct = s.spent ? (v / s.spent) * 100 : 0;
              return (
                <div key={a.id} className="bg-track/60 flex items-center gap-3 rounded-2xl p-3" style={{ background: 'var(--track)' }}>
                  <span className={cx('grid h-11 w-11 place-items-center rounded-2xl text-white', a.type === 'credit' ? 'bg-gradient-to-br from-fuchsia-500 to-rose-500' : 'bg-gradient-to-br from-sky-500 to-indigo-500')}>
                    {a.type === 'credit' ? <CardSvg /> : <Wallet size={20} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">{a.name}</div>
                    <div className="t-3 text-xs">{a.type === 'credit' ? 'Credit card' : 'Bank / debit card'} · {Math.round(pct)}%</div>
                  </div>
                  <div className="num text-[15px] font-bold">{fmt(v)}</div>
                  <Pill tone={i % 2 ? 'accent' : 'neutral'}>{Math.round(pct)}%</Pill>
                </div>
              );
            })}
            <div className="t-3 flex items-center justify-between px-1 pt-1 text-xs">
              <span>Forecast for {monthLabel(addMonths(ym, 1))}</span>
              <span>spend <b className="t-ink">{fmt(fc.total)}</b> · save <b className={fc.saved < 0 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}>{fmt(fc.saved)}</b></span>
            </div>
            {psFull && <div className="t-3 px-1 text-xs"><Delta cur={saved} prev={psFull.income - psFull.spent} goodWhenUp label={`${prevLbl} savings`} /></div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CardSvg() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M6 15h4" /></svg>
  );
}
