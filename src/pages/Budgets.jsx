import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Plus, Sparkles, Target, Trash2, Wand2, CalendarClock, Wallet, X } from 'lucide-react';
import { ask, toast, useData, useEngine, useUI } from '../lib/store';
import { addMonths, cx, fmt, fmtShort, isLive, mean, monthLabel } from '../lib/format';
import { KIND_LABEL, PALETTE } from '../lib/defaults';
import { sortedRules } from '../lib/categorize';
import { AnimatedNumber, Card, CardHeader, CatIcon, ICONS, Pill, Segmented, Sheet, item, stagger, softSpring } from '../components/ui';
import { PiggyArt } from '../components/Illustrations';

function MiniRing({ value, color, size = 54, stroke = 6 }) {
  const r = size / 2 - stroke / 2, C = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value));
  const over = value > 1;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity=".15" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={over ? '#f43f5e' : color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={C}
        initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - v) }} transition={{ type: 'spring', stiffness: 70, damping: 18 }} />
    </svg>
  );
}

export default function Budgets() {
  const eng = useEngine();
  const cats = useData((s) => s.cats), rules = useData((s) => s.rules);
  const suggestBudgets = useData((s) => s.suggestBudgets), addRule = useData((s) => s.addRule), deleteRule = useData((s) => s.deleteRule), rerunRules = useData((s) => s.rerunRules);
  const month = useUI((s) => s.month);
  const [edit, setEdit] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [rk, setRk] = useState(''); const [rc, setRc] = useState('food');

  const ym = month, live = isLive(ym), s = eng.summarize(ym), proj = eng.projectFull(ym), fc = eng.forecastNext(ym);
  const prevs = eng.prevMonthsWithData(ym, 3);
  const avg3 = (id) => mean(prevs.map((p) => eng.summarize(p).byCat[id] || 0));
  const TB = eng.totalBudget;
  const exp = cats.filter((c) => c.kind === 'expense');
  const others = cats.filter((c) => c.kind !== 'expense');
  const sr = useMemo(() => sortedRules(rules, cats).sort((a, b) => (a.c + a.k < b.c + b.k ? -1 : 1)), [rules, cats]);
  const byCat = {}; sr.forEach((r) => (byCat[r.c] = byCat[r.c] || []).push(r));

  const suggest = () => {
    const src = prevs.length ? prevs : [ym];
    ask({ title: 'Suggest budgets?', body: `Each spending budget becomes its average over ${src.map((p) => monthLabel(p, 'short')).join(', ')}, rounded up to the nearest ₹500. You can tweak them after.`, ok: 'Set budgets',
      onOk: () => { const avg = {}; exp.forEach((c) => (avg[c.id] = mean(src.map((p) => eng.summarize(p).byCat[c.id] || 0)))); suggestBudgets(avg); toast('Budgets updated', 'success'); } });
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-3">
        {[
          { l: 'Monthly budget', v: TB, sub: `${exp.filter((c) => +c.budget > 0).length} of ${exp.length} categories budgeted`, g: 'from-indigo-500 to-violet-500', I: Target },
          { l: `Spent in ${monthLabel(ym, 'short')}${live ? ' so far' : ''}`, v: s.spent, sub: TB ? (s.spent > TB ? `${fmt(s.spent - TB)} over budget` : `${fmt(TB - s.spent)} left${live ? ` · projected ${fmtShort(proj.total)}` : ''}`) : '', g: s.spent > TB ? 'from-rose-500 to-orange-500' : 'from-emerald-500 to-teal-500', I: Wallet },
          { l: `Forecast ${monthLabel(addMonths(ym, 1), 'short')}`, v: fc.total, sub: TB ? (fc.total > TB ? `${fmt(fc.total - TB)} above budget` : `${fmt(TB - fc.total)} under budget`) : '', g: 'from-sky-500 to-cyan-500', I: CalendarClock },
        ].map((k) => (
          <motion.div key={k.l} variants={item} className="card flex items-center gap-4 p-5">
            <span className={cx('grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft', k.g)}><k.I size={22} /></span>
            <div className="min-w-0">
              <div className="t-3 text-[12.5px] font-semibold">{k.l}</div>
              <div className="font-display text-2xl font-extrabold tracking-tight"><AnimatedNumber value={k.v} /></div>
              <div className="t-3 truncate text-xs">{k.sub}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title">Spending categories</h2>
        <div className="flex gap-2">
          <button className="btn-soft" onClick={suggest}><Sparkles size={16} className="text-amber-500" /> Suggest budgets</button>
          <button className="btn-primary" onClick={() => setEdit('new')}><Plus size={16} /> New category</button>
        </div>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {exp.map((c) => {
          const sp = s.byCat[c.id] || 0, b = +c.budget || 0, p = proj.byCat[c.id] || 0, f = fc.byCat[c.id] || 0;
          const status = !b ? <Pill>No budget</Pill> : sp > b ? <Pill tone="over">{fmt(sp - b)} over</Pill> : live && p > b ? <Pill tone="risk">At risk</Pill> : <Pill tone="ok">On track</Pill>;
          return (
            <motion.button key={c.id} variants={item} layout whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => setEdit(c.id)} className="card group p-4 text-left transition-shadow hover:shadow-lift">
              <div className="flex items-center gap-3">
                <div className="relative grid place-items-center">
                  <MiniRing value={b ? sp / b : 0} color={c.color} />
                  <span className="absolute"><CatIcon cat={c} size={34} className="!rounded-full" /></span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold">{c.name}</div>
                  <div className="t-3 num text-[13px]"><b className="t-ink">{fmt(sp)}</b>{b ? ` of ${fmt(b)}` : ''}</div>
                </div>
                {status}
              </div>
              <div className="t-3 mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-[11.5px] hairline">
                <div><div>3-mo avg</div><div className="num t-ink text-[13px] font-semibold">{prevs.length ? fmtShort(avg3(c.id)) : '—'}</div></div>
                <div><div>{live ? 'Projected' : 'Actual'}</div><div className="num t-ink text-[13px] font-semibold">{fmtShort(live ? p : sp)}</div></div>
                <div><div>Next month</div><div className={cx('num text-[13px] font-semibold', b && f > b ? 'text-rose-500' : 't-ink')}>{fmtShort(f)}</div></div>
              </div>
            </motion.button>
          );
        })}
        <motion.button variants={item} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => setEdit('new')} className="hairline flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-500/5">
          <PiggyArt className="h-16 w-20" />
          <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Add a category</span>
        </motion.button>
      </motion.div>

      <Card delay={0.1}>
        <CardHeader title="Income & transfers" subtitle="Transfers (card-bill payments, own accounts, SIPs) are never counted as spending" />
        <div className="grid gap-2 sm:grid-cols-3">
          {others.map((c) => (
            <button key={c.id} onClick={() => setEdit(c.id)} className="flex items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-black/[.03] dark:hover:bg-white/[.04]" style={{ background: 'var(--track)' }}>
              <CatIcon cat={c} size={38} />
              <div className="min-w-0"><div className="truncate text-[14px] font-semibold">{c.name}</div><div className="t-3 text-xs">{KIND_LABEL[c.kind]}</div></div>
            </button>
          ))}
        </div>
      </Card>

      <Card delay={0.15}>
        <button className="flex w-full items-center justify-between text-left" onClick={() => setShowRules(!showRules)}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white"><Wand2 size={18} /></span>
            <div><h2 className="section-title">Auto-categorisation rules</h2><p className="t-3 text-[13px]">{sr.length} keywords file transactions automatically on import</p></div>
          </div>
          <motion.span animate={{ rotate: showRules ? 180 : 0 }}><ChevronDown className="t-3" /></motion.span>
        </button>
        <AnimatePresence initial={false}>
          {showRules && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={softSpring} className="overflow-hidden">
              <form className="mt-5 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const n = addRule(rk, rc); if (rk.trim()) { toast(`Rule added${n ? ` · ${n} categorised` : ''}`, 'success'); setRk(''); } }}>
                <input className="field !w-auto flex-1" value={rk} onChange={(e) => setRk(e.target.value)} placeholder="Keyword, e.g. swiggy" maxLength={40} aria-label="Keyword" />
                <select className="field !w-auto" value={rc} onChange={(e) => setRc(e.target.value)} aria-label="Category">{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <button className="btn-primary" type="submit">Add rule</button>
                <button className="btn-soft" type="button" onClick={() => { const n = rerunRules(); toast(n ? `Categorised ${n} transactions` : 'Nothing new matched', n ? 'success' : 'default'); }}>Re-run on uncategorised</button>
              </form>
              <div className="mt-5 space-y-4">
                {Object.entries(byCat).map(([cid, rs]) => {
                  const c = cats.find((x) => x.id === cid);
                  return (
                    <div key={cid}>
                      <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />{c.name}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {rs.map((r) => (
                          <motion.span key={r.k} layout className="chip !py-1 text-[12.5px]" style={{ background: c.color + '14', color: c.color }}>
                            {r.k}<button onClick={() => deleteRule(r.k, r.c)} aria-label={`Remove ${r.k}`} className="opacity-60 hover:opacity-100"><X size={13} /></button>
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <CategorySheet id={edit} onClose={() => setEdit(null)} spentFor={(id) => s.byCat[id] || 0} />
    </div>
  );
}

function CategorySheet({ id, onClose, spentFor }) {
  const cats = useData((s) => s.cats), tx = useData((s) => s.tx);
  const addCat = useData((s) => s.addCat), updateCat = useData((s) => s.updateCat), deleteCat = useData((s) => s.deleteCat);
  const isNew = id === 'new';
  const cat = !isNew && cats.find((c) => c.id === id);
  const [f, setF] = useState(null);
  useEffect(() => {
    if (!id) return;
    setF(isNew ? { name: '', kind: 'expense', budget: 2000, icon: 'tag', color: PALETTE.find((p) => !cats.some((c) => c.color === p)) || PALETTE[0] } : { ...cat });
  }, [id]); // eslint-disable-line
  const open = !!id && !!f;
  const n = cat ? tx.filter((t) => t.cat === cat.id).length : 0;
  const nameTaken = f && cats.some((c) => c.id !== id && c.name.toLowerCase() === f.name.trim().toLowerCase());
  const ok = f && f.name.trim() && !nameTaken;
  const save = () => {
    if (!ok) return;
    const patch = { name: f.name.trim().slice(0, 40), kind: f.kind, budget: f.kind === 'expense' ? Math.max(0, Math.round(+f.budget || 0)) : 0, icon: f.icon, color: f.color };
    if (isNew) { addCat(patch); toast(`Added “${patch.name}”`, 'success'); } else { updateCat(id, patch); toast('Saved', 'success'); }
    onClose();
  };
  const spent = cat ? spentFor(cat.id) : 0;
  const maxB = Math.max(50000, Math.ceil(((+f?.budget || 0) * 1.5) / 1000) * 1000);
  return (
    <Sheet open={open} onClose={onClose} title={isNew ? 'New category' : 'Edit category'} subtitle={cat ? `${n} transactions · ${fmt(spent)} this month` : 'Create a category and give it a budget'}
      footer={<>
        {!isNew && <button className="btn-danger mr-auto" onClick={() => ask({ title: `Delete “${cat.name}”?`, body: `${n} transaction${n === 1 ? '' : 's'} will become Uncategorised and its rules will be removed.`, ok: 'Delete', danger: true, onOk: () => { deleteCat(cat.id); onClose(); toast('Category deleted'); } })}><Trash2 size={16} /> Delete</button>}
        <button className="btn-soft" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={!ok} onClick={save}>{isNew ? 'Create' : 'Save'}</button>
      </>}>
      {f && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <motion.div key={f.icon + f.color} initial={{ scale: 0.6, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
              <CatIcon cat={f} size={64} />
            </motion.div>
            <div className="flex-1">
              <input className="field font-display !text-lg font-bold" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Category name" maxLength={40} aria-label="Name" autoFocus={isNew} />
              {nameTaken && <p className="mt-1 text-xs text-rose-500">That name is already used.</p>}
            </div>
          </div>
          <div className="flex justify-center">
            <Segmented id="kind" value={f.kind} onChange={(v) => setF({ ...f, kind: v })} options={[{ value: 'expense', label: 'Spending' }, { value: 'income', label: 'Income' }, { value: 'transfer', label: 'Transfer' }]} />
          </div>
          {f.kind === 'expense' && (
            <div>
              <div className="mb-2 flex items-center justify-between"><span className="t-2 text-[13px] font-semibold">Monthly budget</span>
                <div className="relative"><span className="t-3 absolute left-3 top-1/2 -translate-y-1/2 font-semibold">₹</span><input type="number" min="0" step="500" className="field !w-36 !py-2 pl-7 text-right font-bold" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} aria-label="Budget" /></div>
              </div>
              <input type="range" min="0" max={maxB} step="500" value={+f.budget || 0} onChange={(e) => setF({ ...f, budget: e.target.value })} className="w-full accent-indigo-500" aria-label="Budget slider" />
              {cat && spent > 0 && <p className="t-3 mt-1 text-xs">Spent {fmt(spent)} this month</p>}
            </div>
          )}
          <div>
            <div className="t-2 mb-2 text-[13px] font-semibold">Icon</div>
            <div className="grid grid-cols-7 gap-2 sm:grid-cols-9">
              {Object.keys(ICONS).map((k) => { const I = ICONS[k], on = f.icon === k; return (
                <motion.button key={k} whileTap={{ scale: 0.88 }} onClick={() => setF({ ...f, icon: k })} className={cx('grid aspect-square place-items-center rounded-xl transition', on ? 'text-white' : 't-2 hover:bg-black/[.04] dark:hover:bg-white/[.06]')} style={on ? { background: f.color } : { background: 'var(--track)' }} aria-label={k}><I size={18} /></motion.button>); })}
            </div>
          </div>
          <div>
            <div className="t-2 mb-2 text-[13px] font-semibold">Colour</div>
            <div className="flex flex-wrap gap-2.5">
              {PALETTE.concat(['#64748b', '#22c55e']).map((p) => (
                <motion.button key={p} whileTap={{ scale: 0.85 }} onClick={() => setF({ ...f, color: p })} className="h-9 w-9 rounded-full transition" style={{ background: p, boxShadow: f.color === p ? `0 0 0 3px var(--card-solid), 0 0 0 5px ${p}` : 'none' }} aria-label={p} />
              ))}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
