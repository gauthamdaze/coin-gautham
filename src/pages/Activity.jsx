import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CheckSquare, Plus, Search, Trash2, X, Wand2 } from 'lucide-react';
import { ask, toast, useData, useUI } from '../lib/store';
import { cx, dayHeading, fmt, fmt2, monthLabel, ymd, TODAY } from '../lib/format';
import { guessKey, kwMatch, norm } from '../lib/categorize';
import { KIND_LABEL } from '../lib/defaults';
import { CatIcon, Card, Portal, Segmented, Sheet, spring } from '../components/ui';
import { EmptyArt, AllGoodArt } from '../components/Illustrations';


export default function Activity() {
  const tx = useData((s) => s.tx), cats = useData((s) => s.cats), accounts = useData((s) => s.accounts);
  const deleteTx = useData((s) => s.deleteTx), bulkSetCat = useData((s) => s.bulkSetCat);
  const month = useUI((s) => s.month), account = useUI((s) => s.account);
  const f = useUI((s) => s.txFilter), setF = useUI((s) => s.setTxFilter);
  const [limit, setLimit] = useState(150);
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const [selMode, setSelMode] = useState(false);
  const [sel, setSel] = useState(() => new Set());
  const catMap = useMemo(() => new Map(cats.map((c) => [c.id, c])), [cats]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const scoped = useMemo(() => tx.filter((t) => (f.scope !== 'month' || t.date.startsWith(month)) && (account === 'all' || t.acc === account)), [tx, f.scope, month, account]);
  const uncN = scoped.filter((t) => !catMap.has(t.cat)).length;
  const list = useMemo(() => {
    const q = norm(f.q);
    return scoped.filter((t) => {
      if (f.dir !== 'all' && t.dir !== f.dir) return false;
      if (f.cat === '__unc' && catMap.has(t.cat)) return false;
      if (f.cat !== 'all' && f.cat !== '__unc' && t.cat !== f.cat) return false;
      if (q && !norm(t.desc).includes(q)) return false;
      return true;
    }).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [scoped, f, catMap]);
  const shown = list.slice(0, limit);
  const groups = [];
  for (const t of shown) { const g = groups[groups.length - 1]; if (g && g.date === t.date) g.items.push(t); else groups.push({ date: t.date, items: [t] }); }
  const out = list.filter((t) => t.dir === 'D').reduce((a, t) => a + t.amt, 0), inn = list.filter((t) => t.dir === 'C').reduce((a, t) => a + t.amt, 0);
  const selCat = f.cat !== 'all' && f.cat !== '__unc' ? catMap.get(f.cat) : null;

  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const chips = [
    { k: 'all', l: 'All', on: f.cat === 'all' && f.dir === 'all', set: { cat: 'all', dir: 'all' } },
    { k: 'unc', l: `Uncategorised${uncN ? ` · ${uncN}` : ''}`, on: f.cat === '__unc', set: { cat: '__unc', dir: 'all' }, warn: uncN > 0 },
    { k: 'out', l: 'Money out', on: f.dir === 'D' && f.cat === 'all', set: { dir: 'D', cat: 'all' } },
    { k: 'in', l: 'Money in', on: f.dir === 'C' && f.cat === 'all', set: { dir: 'C', cat: 'all' } },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="glass flex flex-1 items-center gap-2.5 rounded-2xl px-4 shadow-soft">
          <Search size={18} className="t-3" />
          <input value={f.q} onChange={(e) => { setF({ q: e.target.value }); setLimit(150); }} placeholder="Search transactions" className="w-full bg-transparent py-3 text-[15px] outline-none" aria-label="Search" />
          {f.q && <button onClick={() => setF({ q: '' })} className="t-3" aria-label="Clear search"><X size={16} /></button>}
        </label>
        <div className="flex items-center gap-2">
          <Segmented id="scope" value={f.scope} onChange={(v) => setF({ scope: v })} options={[{ value: 'month', label: monthLabel(month, 'short') }, { value: 'all', label: 'All time' }]} />
          <button className={cx('btn-soft !py-2', selMode && '!bg-indigo-500 !text-white')} onClick={() => { setSelMode(!selMode); setSel(new Set()); }}><CheckSquare size={16} /> Select</button>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {chips.map((c) => (
          <motion.button key={c.k} whileTap={{ scale: 0.95 }} onClick={() => setF(c.set)}
            className={cx('chip shrink-0 border', c.on ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'glass t-2', !c.on && c.warn && '!border-amber-400/50 !text-amber-700 dark:!text-amber-400')}>
            {c.l}
          </motion.button>
        ))}
        <select value={selCat ? f.cat : ''} onChange={(e) => setF({ cat: e.target.value || 'all', dir: 'all' })} className={cx('chip shrink-0 cursor-pointer appearance-none border pr-6 outline-none', selCat ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'glass t-2')} aria-label="Category">
          <option value="">Category…</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="t-3 flex flex-wrap gap-x-4 gap-y-1 px-1 text-[13px]">
        <span><b className="t-ink">{list.length}</b> transactions</span>
        <span>Out <b className="t-ink num">{fmt(out)}</b></span>
        <span>In <b className="num text-emerald-600 dark:text-emerald-400">{fmt(inn)}</b></span>
      </div>

      {!list.length ? (
        <Card className="flex flex-col items-center py-12 text-center">
          {f.cat === '__unc' ? <AllGoodArt className="h-24 w-24" /> : <EmptyArt className="h-32 w-44" />}
          <h3 className="section-title mt-3">{f.cat === '__unc' ? 'Everything is categorised 🎉' : 'No transactions match'}</h3>
          <p className="t-3 mt-1 text-sm">{f.cat === '__unc' ? 'Nice work — your reports are fully accurate.' : 'Try another filter or month.'}</p>
        </Card>
      ) : (
        <div className="card overflow-clip p-0">
          {groups.map((g) => (
            <div key={g.date}>
              <div className="glass hairline sticky top-0 z-10 flex justify-between border-x-0 border-t-0 px-5 py-2 text-[12.5px] font-semibold">
                <span className="t-2">{dayHeading(g.date)}</span>
                <span className="t-3 num">{fmt(g.items.filter((t) => t.dir === 'D').reduce((a, t) => a + t.amt, 0))}</span>
              </div>
              <ul>
                {g.items.map((t) => {
                  const c = catMap.get(t.cat), a = accMap.get(t.acc), on = sel.has(t.id);
                  return (
                    <motion.li key={t.id} layout="position" transition={spring}>
                      <button onClick={() => (selMode ? toggle(t.id) : setOpen(t.id))}
                        className={cx('hairline flex w-full items-center gap-3 border-b px-4 py-3 text-left transition sm:px-5', on ? 'bg-indigo-500/10' : 'hover:bg-black/[.02] dark:hover:bg-white/[.03]', !c && 'bg-amber-500/[.05]')}>
                        {selMode && <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition', on ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 dark:border-slate-600')}>{on && <Check size={14} strokeWidth={3} />}</span>}
                        <CatIcon cat={c} size={42} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14.5px] font-semibold">{t.desc}</div>
                          <div className="t-3 mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px]">
                            {c ? <span style={{ color: c.color }} className="font-semibold">{c.name}</span> : <span className="font-semibold text-amber-600 dark:text-amber-400">Tap to categorise</span>}
                            {a && <span>· {a.name}</span>}
                            {c && c.kind !== 'expense' && <span>· {KIND_LABEL[c.kind]}</span>}
                          </div>
                        </div>
                        <div className={cx('num shrink-0 text-[15px] font-bold', t.dir === 'C' && 'text-emerald-600 dark:text-emerald-400')}>{t.dir === 'C' ? '+' : '−'}{fmt2(t.amt)}</div>
                      </button>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          ))}
          {list.length > shown.length && <div className="p-4 text-center"><button className="btn-soft" onClick={() => setLimit(limit + 300)}>Show more ({list.length - shown.length})</button></div>}
        </div>
      )}

      {/* bulk bar */}
      <Portal>
      <AnimatePresence>
        {selMode && sel.size > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={spring}
            className="glass fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-xl flex-wrap items-center gap-2 rounded-3xl p-3 shadow-lift lg:bottom-6 lg:left-[calc(16rem+1rem)]">
            <b className="px-2 text-sm">{sel.size} selected</b>
            <select className="field !w-auto flex-1 !py-2 text-sm" defaultValue="" onChange={(e) => { if (!e.target.value) return; const v = e.target.value === '__none' ? null : e.target.value; bulkSetCat(sel, v); toast(`Updated ${sel.size} transactions`, 'success'); setSel(new Set()); setSelMode(false); }} aria-label="Set category">
              <option value="">Set category…</option>
              <option value="__none">Uncategorised</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button className="btn-danger !py-2" onClick={() => ask({ title: `Delete ${sel.size} transactions?`, body: "This can't be undone.", ok: 'Delete', danger: true, onOk: () => { deleteTx(sel); setSel(new Set()); setSelMode(false); toast('Deleted', 'success'); } })}><Trash2 size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 0.3 }}
        onClick={() => setAdding(true)} className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-glow lg:bottom-8 lg:right-8" aria-label="Add transaction">
        <Plus size={26} />
      </motion.button>
      </Portal>

      <TxSheet id={open} onClose={() => setOpen(null)} />
      <AddTxSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function TxSheet({ id, onClose }) {
  const tx = useData((s) => s.tx.find((t) => t.id === id));
  const cats = useData((s) => s.cats), accounts = useData((s) => s.accounts);
  const setTxCat = useData((s) => s.setTxCat), applyKeyword = useData((s) => s.applyKeyword), deleteTx = useData((s) => s.deleteTx);
  const allTx = useData((s) => s.tx);
  const [pending, setPending] = useState(null);
  const [kw, setKw] = useState('');
  const [similar, setSimilar] = useState(true);
  const open = !!id && !!tx;

  const chosen = pending !== null ? pending : tx?.cat || '';
  const k = norm(kw);
  const matchN = open && k ? allTx.filter((t) => t.id !== id && t.cat !== (chosen || null) && kwMatch(norm(t.desc), k)).length : 0;
  const a = tx && accounts.find((x) => x.id === tx.acc);

  const reset = () => { setPending(null); setKw(''); setSimilar(true); };
  useEffect(() => { if (tx) { setKw(guessKey(tx.desc)); setPending(null); setSimilar(true); } }, [id]); // eslint-disable-line
  const close = () => { reset(); onClose(); };
  const save = () => {
    const cat = chosen || null;
    setTxCat(id, cat);
    let n = 0;
    if (similar && cat && k) n = applyKeyword(k, cat, true);
    toast(n ? `Saved · ${n} similar updated & rule remembered` : 'Category saved', 'success');
    close();
  };

  const groups = ['expense', 'income', 'transfer'];
  return (
    <Sheet open={open} onClose={close} title={tx ? (tx.dir === 'C' ? '+' : '−') + fmt2(tx.amt) : ''} subtitle={tx ? `${tx.desc} · ${dayHeading(tx.date)}${a ? ' · ' + a.name : ''}` : ''}
      footer={<>
        <button className="btn-danger mr-auto" onClick={() => ask({ title: 'Delete transaction?', body: tx?.desc, ok: 'Delete', danger: true, onOk: () => { deleteTx(new Set([id])); close(); } })}><Trash2 size={16} /></button>
        <button className="btn-soft" onClick={close}>Cancel</button>
        <button className="btn-primary" onClick={save}>Save</button>
      </>}>
      {groups.map((g) => {
        const cs = cats.filter((c) => c.kind === g); if (!cs.length) return null;
        return (
          <div key={g} className="mb-4">
            <div className="t-3 mb-2 text-xs font-semibold uppercase tracking-wide">{KIND_LABEL[g]}</div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {cs.map((c) => {
                const on = chosen === c.id;
                return (
                  <motion.button key={c.id} whileTap={{ scale: 0.94 }} onClick={() => setPending(c.id)}
                    className={cx('relative flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 text-center text-[12px] font-semibold leading-tight transition', on ? 'border-transparent' : 'hairline hover:bg-black/[.02] dark:hover:bg-white/[.03]')}
                    style={on ? { background: c.color + '1f', boxShadow: `inset 0 0 0 2px ${c.color}` } : undefined}>
                    <CatIcon cat={c} size={36} />
                    <span className="line-clamp-2">{c.name}</span>
                    {on && <motion.span layoutId="cat-check" className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full text-white" style={{ background: c.color }}><Check size={12} strokeWidth={3} /></motion.span>}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
      <button className="t-3 mb-4 text-[13px] font-semibold underline-offset-2 hover:underline" onClick={() => setPending('')}>Mark as uncategorised</button>
      {chosen && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--track)' }}>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={similar} onChange={(e) => setSimilar(e.target.checked)} className="h-5 w-5 accent-indigo-500" />
            <span className="flex-1 text-[14px] font-semibold"><Wand2 size={15} className="mr-1 inline text-indigo-500" />Apply to similar & remember</span>
          </label>
          {similar && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="t-2">Descriptions containing</span>
              <input value={kw} onChange={(e) => setKw(e.target.value)} className="field !w-40 !py-1.5 text-sm" aria-label="Keyword" />
              <span className="t-3">→ {matchN} other{matchN === 1 ? '' : 's'} + future imports</span>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

function AddTxSheet({ open, onClose }) {
  const cats = useData((s) => s.cats), accounts = useData((s) => s.accounts), addTx = useData((s) => s.addTx);
  const [form, setForm] = useState({ date: ymd(TODAY), desc: '', amt: '', dir: 'D', acc: accounts[0]?.id || '__cash', cat: '' });
  const up = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const ok = form.desc.trim() && +form.amt > 0 && /^\d{4}-\d{2}-\d{2}$/.test(form.date);
  const save = () => {
    if (!ok) return;
    addTx({ date: form.date, desc: form.desc.trim(), amt: Math.round(+form.amt * 100) / 100, dir: form.dir, acc: form.acc, cat: form.cat || null });
    toast('Transaction added', 'success'); setForm({ ...form, desc: '', amt: '' }); onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add transaction" subtitle="Cash spends or anything missing from statements"
      footer={<><button className="btn-soft" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={!ok} onClick={save}>Add</button></>}>
      <div className="mb-4 flex justify-center">
        <Segmented id="dir" value={form.dir} onChange={(v) => setForm({ ...form, dir: v })} options={[{ value: 'D', label: 'Money out' }, { value: 'C', label: 'Money in' }]} />
      </div>
      <div className="relative mb-4">
        <span className="t-3 absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold">₹</span>
        <input type="number" inputMode="decimal" min="0" step="0.01" value={form.amt} onChange={up('amt')} placeholder="0" className="field !py-4 pl-10 font-display !text-3xl font-extrabold" aria-label="Amount" autoFocus />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="t-2 grid gap-1 text-[13px] font-semibold">Description<input className="field" value={form.desc} onChange={up('desc')} maxLength={120} placeholder="e.g. Auto rickshaw" /></label>
        <label className="t-2 grid gap-1 text-[13px] font-semibold">Date<input type="date" className="field" value={form.date} onChange={up('date')} /></label>
        <label className="t-2 grid gap-1 text-[13px] font-semibold">Account<select className="field" value={form.acc} onChange={up('acc')}>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}<option value="__cash">Cash</option></select></label>
        <label className="t-2 grid gap-1 text-[13px] font-semibold">Category<select className="field" value={form.cat} onChange={up('cat')}><option value="">Uncategorised</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      </div>
    </Sheet>
  );
}
