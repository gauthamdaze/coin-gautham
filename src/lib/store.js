import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMemo } from 'react';
import { defaultAccounts, defaultCats, defaultRules, PALETTE } from './defaults';
import { genSample } from './sample';
import { autoCat, kwMatch, norm, sortedRules } from './categorize';
import { createEngine } from './analytics';
import { CUR_YM, uid } from './format';

const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

function freshState(withSample = true) {
  const cats = defaultCats(), rules = defaultRules();
  return { cats, rules, accounts: defaultAccounts(), tx: withSample ? genSample(rules, cats) : [], sample: withSample };
}

// localStorage that never throws (private mode, quota, sandboxed frames).
const safeStorage = createJSONStorage(() => {
  try { const k = '__t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; }
  catch { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) }; }
});

export const useData = create(
  persist(
    (set, get) => ({
      ...freshState(true),

      /* ---- transactions ---- */
      setTxCat: (id, cat) => set((s) => ({ tx: s.tx.map((t) => (t.id === id ? { ...t, cat: cat || null } : t)) })),
      bulkSetCat: (ids, cat) => set((s) => ({ tx: s.tx.map((t) => (ids.has(t.id) ? { ...t, cat: cat || null } : t)) })),
      deleteTx: (ids) => set((s) => ({ tx: s.tx.filter((t) => !ids.has(t.id)) })),
      addTx: (t) => set((s) => {
        let accounts = s.accounts, acc = t.acc;
        if (acc === '__cash') {
          let c = accounts.find((a) => a.name === 'Cash');
          if (!c) { c = { id: 'cash', name: 'Cash', type: 'bank' }; accounts = [...accounts, c]; }
          acc = c.id;
        }
        return { accounts, tx: [...s.tx, { ...t, acc, id: uid(), manual: true }].sort(byDate) };
      }),
      /** Applies cat to every txn containing keyword; optionally remembers it as a rule. */
      applyKeyword: (k, cat, remember = true) => {
        const kk = norm(k); if (!kk) return 0;
        let n = 0;
        const tx = get().tx.map((t) => { if (t.cat !== cat && kwMatch(norm(t.desc), kk)) { n++; return { ...t, cat }; } return t; });
        let rules = get().rules;
        if (remember && cat) rules = [...rules.filter((r) => r.k !== kk), { k: kk, c: cat }];
        set({ tx, rules });
        return n;
      },
      countKeyword: (k, cat) => { const kk = norm(k); if (!kk) return 0; return get().tx.filter((t) => t.cat !== cat && kwMatch(norm(t.desc), kk)).length; },

      /* ---- categories ---- */
      addCat: ({ name, kind, budget, icon, color }) => {
        const s = get();
        let base = norm(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'cat', id = base, i = 2;
        while (s.cats.some((c) => c.id === id)) id = base + '-' + i++;
        const used = new Set(s.cats.map((c) => c.color));
        const col = color || PALETTE.find((p) => !used.has(p)) || PALETTE[s.cats.length % PALETTE.length];
        set({ cats: [...s.cats, { id, name, kind, budget: kind === 'expense' ? Math.max(0, Math.round(+budget || 0)) : 0, color: col, icon: icon || 'tag' }] });
        return id;
      },
      updateCat: (id, patch) => set((s) => ({ cats: s.cats.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      deleteCat: (id) => set((s) => ({
        cats: s.cats.filter((c) => c.id !== id),
        rules: s.rules.filter((r) => r.c !== id),
        tx: s.tx.map((t) => (t.cat === id ? { ...t, cat: null } : t)),
      })),
      suggestBudgets: (avgByCat) => set((s) => ({ cats: s.cats.map((c) => (c.kind === 'expense' && avgByCat[c.id] > 0 ? { ...c, budget: Math.ceil(avgByCat[c.id] / 500) * 500 } : c)) })),

      /* ---- rules ---- */
      addRule: (k, c) => {
        const kk = norm(k); if (!kk || !c) return 0;
        let n = 0;
        set((s) => ({
          rules: [...s.rules.filter((r) => r.k !== kk), { k: kk, c }],
          tx: s.tx.map((t) => { if ((!t.cat || !s.cats.some((x) => x.id === t.cat)) && kwMatch(norm(t.desc), kk)) { n++; return { ...t, cat: c }; } return t; }),
        }));
        return n;
      },
      deleteRule: (k, c) => set((s) => ({ rules: s.rules.filter((r) => !(r.k === k && r.c === c)) })),
      rerunRules: () => {
        const s = get(), sr = sortedRules(s.rules, s.cats); let n = 0;
        const tx = s.tx.map((t) => { if (!t.cat || !s.cats.some((x) => x.id === t.cat)) { const c = autoCat(t.desc, sr); if (c) { n++; return { ...t, cat: c }; } } return t; });
        set({ tx }); return n;
      },

      /* ---- accounts ---- */
      addAccount: (name, type) => set((s) => ({ accounts: [...s.accounts, { id: 'a' + uid(), name, type }] })),
      updateAccount: (id, patch) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      deleteAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id), tx: s.tx.filter((t) => t.acc !== id) })),

      /* ---- import / reset ---- */
      importTx: ({ rows, acc, newName, newType, removeSample }) => {
        const s = get();
        let tx = s.tx, accounts = s.accounts, sample = s.sample;
        if (sample) { if (removeSample) tx = []; sample = false; }
        let accId = acc;
        if (accId === '__new') { accId = 'a' + uid(); accounts = [...accounts, { id: accId, name: (newName || '').trim() || 'New account', type: newType }]; }
        const key = (t) => [t.date, t.dir, t.amt.toFixed(2), norm(t.desc)].join('|');
        const have = {}; tx.filter((t) => t.acc === accId).forEach((t) => { const k = key(t); have[k] = (have[k] || 0) + 1; });
        const sr = sortedRules(s.rules, s.cats); const seen = {};
        let added = 0, dup = 0, unc = 0; const fresh = [];
        for (const t of rows) {
          const k = key(t); seen[k] = (seen[k] || 0) + 1;
          if (seen[k] <= (have[k] || 0)) { dup++; continue; }
          const cat = autoCat(t.desc, sr); if (!cat) unc++;
          fresh.push({ id: uid(), date: t.date, desc: t.desc, amt: t.amt, dir: t.dir, acc: accId, cat }); added++;
        }
        set({ tx: [...tx, ...fresh].sort(byDate), accounts, sample });
        return { added, dup, unc, accId };
      },
      clearTx: () => set({ tx: [], sample: false }),
      loadSample: () => set((s) => ({ tx: genSample(s.rules, s.cats), sample: true })),
      resetAll: () => set(freshState(true)),
      restore: (data) => {
        if (!data || !Array.isArray(data.tx) || !Array.isArray(data.cats)) throw new Error('Not a My Money backup file.');
        set({ cats: data.cats, rules: data.rules || [], accounts: data.accounts || defaultAccounts(), tx: data.tx.slice().sort(byDate), sample: !!data.sample });
      },
    }),
    { name: 'my-money-v1', storage: safeStorage, version: 1, partialize: (s) => ({ cats: s.cats, rules: s.rules, accounts: s.accounts, tx: s.tx, sample: s.sample }) }
  )
);

/* ---------- UI state (not persisted) ---------- */
export const useUI = create((set) => ({
  month: CUR_YM,
  account: 'all',
  setMonth: (month) => set({ month }),
  setAccount: (account) => set({ account }),
  txFilter: { q: '', cat: 'all', dir: 'all', scope: 'month' },
  setTxFilter: (patch) => set((s) => ({ txFilter: { ...s.txFilter, ...patch } })),
  confirmState: null,
  ask: (confirmState) => set({ confirmState }),
  closeAsk: () => set({ confirmState: null }),
  tab: 'home',
  setTab: (tab) => set({ tab }),
  toasts: [],
  toast: (msg, tone = 'default') => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, msg, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3600);
  },
}));
export const toast = (msg, tone) => useUI.getState().toast(msg, tone);
export const ask = (o) => useUI.getState().ask(o);

/** Memoised analytics engine for the current data + account filter. */
export function useEngine() {
  const tx = useData((s) => s.tx), cats = useData((s) => s.cats), accounts = useData((s) => s.accounts);
  const account = useUI((s) => s.account);
  return useMemo(() => createEngine({ tx, cats, accounts }, account), [tx, cats, accounts, account]);
}
