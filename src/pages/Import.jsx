import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, FileUp, Landmark, Link2, Mail, MessageSquareText, Plus, RotateCcw, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { ask, toast, useData, useUI } from '../lib/store';
import { cx, fmt, fmt2, fmtDate } from '../lib/format';
import { autoCat, sortedRules } from '../lib/categorize';
import { buildImportTx, detectOrder, prepareImport } from '../lib/parser';
import { Card, CardHeader, Pill, Segmented, Sheet, item, stagger } from '../components/ui';
import { UploadArt } from '../components/Illustrations';

export default function ImportPage() {
  const accounts = useData((s) => s.accounts), tx = useData((s) => s.tx), sample = useData((s) => s.sample);
  const updateAccount = useData((s) => s.updateAccount), deleteAccount = useData((s) => s.deleteAccount), addAccount = useData((s) => s.addAccount);
  const clearTx = useData((s) => s.clearTx), loadSample = useData((s) => s.loadSample), restore = useData((s) => s.restore);
  const [drag, setDrag] = useState(false);
  const [imp, setImp] = useState(null);
  const [newAcc, setNewAcc] = useState({ name: '', type: 'credit' });
  const fileRef = useRef(null), backupRef = useRef(null);
  const counts = {}; tx.forEach((t) => (counts[t.acc] = (counts[t.acc] || 0) + 1));

  const start = async (file) => {
    if (!file) return;
    if (/\.pdf$/i.test(file.name)) { toast('PDF can’t be read yet — download CSV/Excel from net banking', 'warn'); return; }
    try { setImp(await prepareImport(file, accounts)); }
    catch (e) { toast(e.message || 'Could not read that file', 'warn'); }
  };
  const exportBackup = () => {
    const s = useData.getState();
    const blob = new Blob([JSON.stringify({ app: 'my-money', v: 1, exportedAt: new Date().toISOString(), cats: s.cats, rules: s.rules, accounts: s.accounts, tx: s.tx, sample: s.sample }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `my-money-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup downloaded', 'success');
  };
  const doRestore = async (file) => {
    if (!file) return;
    try { const data = JSON.parse(await file.text()); ask({ title: 'Restore backup?', body: `This replaces everything with ${data.tx?.length ?? 0} transactions from the backup.`, ok: 'Restore', danger: true, onOk: () => { try { restore(data); toast('Backup restored', 'success'); } catch (e) { toast(e.message, 'warn'); } } }); }
    catch { toast('That isn’t a valid backup file', 'warn'); }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <motion.div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); start(e.dataTransfer.files?.[0]); }}
            onClick={() => fileRef.current?.click()} animate={{ scale: drag ? 1.02 : 1 }}
            className={cx('flex cursor-pointer flex-col items-center rounded-[26px] border-2 border-dashed px-6 py-8 text-center transition', drag ? 'border-indigo-500 bg-indigo-500/10' : 'hairline hover:border-indigo-400 hover:bg-indigo-500/[.04]')}
          >
            <UploadArt className="h-36 w-56" />
            <h2 className="section-title mt-3">Drop your statement here</h2>
            <p className="t-3 mt-1 max-w-sm text-sm">CSV, XLS or XLSX from net banking — bank / debit-card account or credit-card statement. Read privately in your browser.</p>
            <span className="btn-primary mt-5"><Upload size={16} /> Choose file</span>
          </motion.div>
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,.xls,.xlsx" hidden onChange={(e) => { start(e.target.files?.[0]); e.target.value = ''; }} />
          <div className="mt-5 grid gap-2 text-[13px] sm:grid-cols-3">
            {[
              { I: ShieldCheck, t: 'Stays on your device', d: 'Data is saved in this browser only.' },
              { I: RotateCcw, t: 'No double counting', d: 'Card-bill payments become transfers.' },
              { I: FileUp, t: 'Safe to re-import', d: 'Duplicate rows are skipped.' },
            ].map((x) => (
              <div key={x.t} className="flex gap-2.5 rounded-2xl p-3" style={{ background: 'var(--track)' }}>
                <x.I size={18} className="mt-0.5 shrink-0 text-indigo-500" />
                <div><div className="font-semibold">{x.t}</div><div className="t-3 text-xs">{x.d}</div></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2" delay={0.05}>
          <CardHeader title="Accounts" subtitle="Each statement goes into an account" />
          <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {accounts.map((a) => (
              <motion.li key={a.id} variants={item} className="flex items-center gap-3 rounded-2xl p-2.5" style={{ background: 'var(--track)' }}>
                <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white', a.type === 'credit' ? 'bg-gradient-to-br from-fuchsia-500 to-rose-500' : 'bg-gradient-to-br from-sky-500 to-indigo-500')}>
                  {a.type === 'credit' ? <CreditCard size={18} /> : <Landmark size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <input defaultValue={a.name} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== a.name) { updateAccount(a.id, { name: v.slice(0, 40) }); toast('Renamed', 'success'); } }} className="w-full truncate bg-transparent text-[14px] font-semibold outline-none focus:underline" aria-label="Account name" />
                  <div className="t-3 flex items-center gap-2 text-xs">
                    <select value={a.type} onChange={(e) => updateAccount(a.id, { type: e.target.value })} className="cursor-pointer bg-transparent outline-none" aria-label="Type"><option value="bank">Bank / debit</option><option value="credit">Credit card</option></select>
                    · {counts[a.id] || 0} txns
                  </div>
                </div>
                <button className="btn-ghost !p-2 text-rose-500" onClick={() => ask({ title: `Delete “${a.name}”?`, body: `This also deletes its ${counts[a.id] || 0} transactions.`, ok: 'Delete', danger: true, onOk: () => deleteAccount(a.id) })} aria-label="Delete account"><Trash2 size={16} /></button>
              </motion.li>
            ))}
          </motion.ul>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!newAcc.name.trim()) return; addAccount(newAcc.name.trim().slice(0, 40), newAcc.type); setNewAcc({ ...newAcc, name: '' }); toast('Account added', 'success'); }}>
            <input className="field !py-2 text-sm" placeholder="e.g. ICICI Amazon Pay card" value={newAcc.name} onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })} aria-label="New account name" />
            <select className="field !w-auto !py-2 text-sm" value={newAcc.type} onChange={(e) => setNewAcc({ ...newAcc, type: e.target.value })} aria-label="Type"><option value="bank">Bank</option><option value="credit">Card</option></select>
            <button className="btn-soft !px-3" aria-label="Add account"><Plus size={18} /></button>
          </form>
        </Card>
      </div>

      <Card delay={0.1}>
        <CardHeader title="Coming next: automatic sync" subtitle="The data model is ready for these sources" />
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-3">
          {[
            { I: Mail, g: 'from-sky-500 to-indigo-500', t: 'Bank e-mails', d: 'Read alert e-mails & monthly e-statements from Gmail / Outlook.' },
            { I: MessageSquareText, g: 'from-emerald-500 to-teal-500', t: 'SMS alerts', d: 'Parse “debited / spent on card” SMS forwarded from your phone.' },
            { I: Link2, g: 'from-fuchsia-500 to-rose-500', t: 'Account Aggregator', d: "RBI's consent-based AA framework pulls bank & card data directly." },
          ].map((x) => (
            <motion.div key={x.t} variants={item} whileHover={{ y: -3 }} className="relative overflow-hidden rounded-3xl p-5" style={{ background: 'var(--track)' }}>
              <div className={cx('absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-25 blur-2xl', x.g)} />
              <span className={cx('grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft', x.g)}><x.I size={20} /></span>
              <div className="mt-3 font-bold">{x.t}</div>
              <p className="t-3 mt-1 text-[13px]">{x.d}</p>
              <Pill tone="accent">Planned</Pill>
            </motion.div>
          ))}
        </motion.div>
      </Card>

      <Card delay={0.15}>
        <CardHeader title="Your data" subtitle="Everything is stored in this browser. Back it up to move devices." />
        <div className="flex flex-wrap gap-2">
          <button className="btn-soft" onClick={exportBackup}><Download size={16} /> Download backup</button>
          <button className="btn-soft" onClick={() => backupRef.current?.click()}><Upload size={16} /> Restore backup</button>
          <input ref={backupRef} type="file" accept=".json,application/json" hidden onChange={(e) => { doRestore(e.target.files?.[0]); e.target.value = ''; }} />
          <button className="btn-soft" onClick={() => ask({ title: 'Load sample data?', body: 'Replaces all transactions with 6 months of sample data.', ok: 'Load sample', onOk: () => { loadSample(); toast('Sample loaded'); } })}>Load sample data</button>
          <button className="btn-danger" onClick={() => ask({ title: 'Delete all transactions?', body: `All ${tx.length} transactions will be removed. Categories, budgets, rules and accounts are kept.`, ok: 'Delete all', danger: true, onOk: () => { clearTx(); toast('All transactions deleted'); } })}><Trash2 size={16} /> Delete all transactions</button>
        </div>
      </Card>

      <ImportSheet imp={imp} setImp={setImp} sample={sample} />
    </div>
  );
}

function ImportSheet({ imp, setImp, sample }) {
  const accounts = useData((s) => s.accounts), rules = useData((s) => s.rules), cats = useData((s) => s.cats);
  const importTx = useData((s) => s.importTx);
  const setTab = useUI((s) => s.setTab), setMonth = useUI((s) => s.setMonth), setAccount = useUI((s) => s.setAccount), setTxFilter = useUI((s) => s.setTxFilter);
  const open = !!imp;
  const I = imp || { head: [], body: [], map: {} };
  const { out, bad } = open ? buildImportTx(I) : { out: [], bad: 0 };
  const sr = sortedRules(rules, cats);
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const up = (patch) => setImp({ ...imp, ...patch });
  const upMap = (k, v) => {
    const map = { ...imp.map, [k]: k === 'mode' ? v : +v };
    const next = { ...imp, map };
    if (k === 'date') next.order = detectOrder(imp.body.map((r) => r[+v]));
    setImp(next);
  };
  const accType = I.acc === '__new' ? I.newType : accounts.find((a) => a.id === I.acc)?.type;
  const outSum = out.filter((t) => t.dir === 'D').reduce((a, t) => a + t.amt, 0), inSum = out.filter((t) => t.dir === 'C').reduce((a, t) => a + t.amt, 0);
  const unc = out.filter((t) => !autoCat(t.desc, sr)).length;
  const sel = (k, label, allowNone = true) => (
    <label className="t-2 grid gap-1 text-[12.5px] font-semibold">{label}
      <select className="field !py-2 text-sm" value={I.map[k] ?? -1} onChange={(e) => upMap(k, e.target.value)}>
        {allowNone && <option value={-1}>—</option>}
        {I.head.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
      </select>
    </label>
  );
  const go = () => {
    const r = importTx({ rows: out, acc: I.acc, newName: I.newName, newType: I.newType, removeSample: I.removeSample });
    const latest = out.reduce((a, t) => (t.date > a ? t.date : a), out[0].date).slice(0, 7);
    setMonth(latest); setAccount('all'); setImp(null);
    toast(`Imported ${r.added}${r.dup ? ` · ${r.dup} duplicates skipped` : ''}${r.unc ? ` · ${r.unc} to categorise` : ''}`, 'success');
    if (r.unc) { setTxFilter({ cat: '__unc', scope: 'all', q: '', dir: 'all' }); setTab('activity'); } else setTab('home');
  };

  return (
    <Sheet open={open} onClose={() => setImp(null)} wide title="Import statement" subtitle={I.file}
      footer={<><button className="btn-soft" onClick={() => setImp(null)}>Cancel</button><button className="btn-primary" disabled={!out.length} onClick={go}>Import {out.length} transactions</button></>}>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="t-2 grid gap-1 text-[12.5px] font-semibold">Account
          <select className="field !py-2 text-sm" value={I.acc} onChange={(e) => { const acc = e.target.value; const t = acc === '__new' ? I.newType : accounts.find((a) => a.id === acc)?.type; up({ acc, sign: t === 'credit' ? 'pos_spend' : 'neg_spend' }); }}>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}<option value="__new">+ New account…</option>
          </select>
        </label>
        {I.acc === '__new' && <>
          <label className="t-2 grid gap-1 text-[12.5px] font-semibold">New account name<input className="field !py-2 text-sm" value={I.newName} onChange={(e) => up({ newName: e.target.value })} /></label>
          <label className="t-2 grid gap-1 text-[12.5px] font-semibold">Type<select className="field !py-2 text-sm" value={I.newType} onChange={(e) => up({ newType: e.target.value, sign: e.target.value === 'credit' ? 'pos_spend' : 'neg_spend' })}><option value="bank">Bank / debit card</option><option value="credit">Credit card</option></select></label>
        </>}
        {sel('date', 'Date column', false)}
        <label className="t-2 grid gap-1 text-[12.5px] font-semibold">Date format<select className="field !py-2 text-sm" value={I.order} onChange={(e) => up({ order: e.target.value })}><option value="dmy">DD/MM/YYYY</option><option value="mdy">MM/DD/YYYY</option></select></label>
        {sel('desc', 'Description column')}
      </div>
      <div className="my-4 flex justify-center">
        <Segmented id="amtmode" value={I.map.mode} onChange={(v) => upMap('mode', v)} options={[{ value: 'split', label: 'Debit & credit columns' }, { value: 'single', label: 'One amount column' }]} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {I.map.mode === 'split' ? <>{sel('debit', 'Debit / withdrawal')}{sel('credit', 'Credit / deposit')}</> : <>
          {sel('amount', 'Amount column')}{sel('drcr', 'Dr/Cr column (optional)')}
          <label className="t-2 grid gap-1 text-[12.5px] font-semibold">Plain numbers mean<select className="field !py-2 text-sm" value={I.sign} onChange={(e) => up({ sign: e.target.value })}><option value="neg_spend">Negative = money out</option><option value="pos_spend">Positive = spend (card)</option></select></label>
        </>}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px]">
        <Pill tone="accent">{out.length} transactions</Pill>
        {out.length > 0 && <span className="t-3">{fmtDate(out.reduce((a, t) => (t.date < a ? t.date : a), out[0].date))} – {fmtDate(out.reduce((a, t) => (t.date > a ? t.date : a), out[0].date))}</span>}
        <span className="t-3">· out <b className="t-ink">{fmt(outSum)}</b> · in <b className="text-emerald-600">{fmt(inSum)}</b></span>
        {unc > 0 && <Pill tone="risk">{unc} to categorise</Pill>}
        {bad > 0 && <Pill>{bad} rows skipped</Pill>}
        {accType === 'credit' && <Pill>Credit card</Pill>}
      </div>
      <div className="hairline mt-3 max-h-64 overflow-auto rounded-2xl border">
        <table className="w-full text-[13px]">
          <thead className="glass sticky top-0"><tr className="t-3 text-left text-xs"><th className="px-3 py-2 font-semibold">Date</th><th className="px-3 py-2 font-semibold">Description</th><th className="px-3 py-2 font-semibold">Category</th><th className="px-3 py-2 text-right font-semibold">Amount</th></tr></thead>
          <tbody>
            {out.slice(0, 40).map((t, i) => { const c = catMap.get(autoCat(t.desc, sr)); return (
              <tr key={i} className="hairline border-t">
                <td className="whitespace-nowrap px-3 py-2">{fmtDate(t.date)} <span className="t-3 text-xs">{t.date.slice(0, 4)}</span></td>
                <td className="max-w-[240px] truncate px-3 py-2">{t.desc}</td>
                <td className="px-3 py-2">{c ? <span className="font-semibold" style={{ color: c.color }}>{c.name}</span> : <span className="t-3">Uncategorised</span>}</td>
                <td className={cx('num whitespace-nowrap px-3 py-2 text-right font-semibold', t.dir === 'C' && 'text-emerald-600')}>{t.dir === 'C' ? '+' : '−'}{fmt2(t.amt)}</td>
              </tr>); })}
            {!out.length && <tr><td colSpan={4} className="t-3 px-3 py-8 text-center">Nothing recognised yet — pick the date and amount columns above.</td></tr>}
          </tbody>
        </table>
      </div>
      {sample && (
        <label className="mt-4 flex items-center gap-2.5 text-[14px] font-medium">
          <input type="checkbox" className="h-5 w-5 accent-indigo-500" checked={I.removeSample} onChange={(e) => up({ removeSample: e.target.checked })} /> Remove the sample data (recommended)
        </label>
      )}
    </Sheet>
  );
}
