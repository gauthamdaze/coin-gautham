import { CUR_YM, TODAY, addMonths, dim, mean, clamp, isLive } from './format';
import { guessKey } from './categorize';

/**
 * Builds a memoised analytics engine over the current data and account filter.
 * Spending = debits (minus refunds) in "expense" categories + uncategorised debits.
 * Income = net credits in "income" categories. "transfer" categories are ignored
 * (card-bill payments, own-account moves, SIPs) so nothing is double-counted.
 */
export function createEngine({ tx, cats, accounts }, account = 'all') {
  const memo = new Map();
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const byMonth = new Map();
  for (const t of tx) {
    if (account !== 'all' && t.acc !== account) continue;
    const ym = t.date.slice(0, 7);
    if (!byMonth.has(ym)) byMonth.set(ym, []);
    byMonth.get(ym).push(t);
  }
  const cache = (key, fn) => { if (memo.has(key)) return memo.get(key); const v = fn(); memo.set(key, v); return v; };

  const monthTx = (ym) => byMonth.get(ym) || [];
  const hasData = (ym) => monthTx(ym).length > 0;
  const catOf = (t) => (t.cat ? catMap.get(t.cat) || null : null);

  function summarize(ym, upto = 0) {
    return cache(`s|${ym}|${upto}`, () => {
      const D = dim(ym);
      const res = { spent: 0, income: 0, byCat: {}, unc: { n: 0, amt: 0 }, daily: new Array(D + 1).fill(0), merchants: {}, byAcc: {}, weekday: new Array(7).fill(0), n: 0, count: 0 };
      for (const t of monthTx(ym)) {
        const day = +t.date.slice(8, 10);
        if (upto && day > upto) continue;
        res.n++;
        const c = catOf(t);
        const wd = new Date(+t.date.slice(0, 4), +t.date.slice(5, 7) - 1, day).getDay();
        if (!c) {
          res.unc.n++;
          if (t.dir === 'D') {
            res.spent += t.amt; res.unc.amt += t.amt; res.daily[day] += t.amt;
            res.byCat.__unc = (res.byCat.__unc || 0) + t.amt;
            res.byAcc[t.acc] = (res.byAcc[t.acc] || 0) + t.amt;
            res.weekday[wd] += t.amt; res.count++;
            const mk = guessKey(t.desc); res.merchants[mk] = (res.merchants[mk] || 0) + t.amt;
          }
          continue;
        }
        if (c.kind === 'income') { res.income += t.dir === 'C' ? t.amt : -t.amt; continue; }
        if (c.kind === 'transfer') continue;
        const v = t.dir === 'D' ? t.amt : -t.amt;
        res.spent += v; res.byCat[c.id] = (res.byCat[c.id] || 0) + v; res.daily[day] += v;
        res.byAcc[t.acc] = (res.byAcc[t.acc] || 0) + v; res.weekday[wd] += v;
        if (t.dir === 'D') res.count++;
        const mk = guessKey(t.desc); res.merchants[mk] = (res.merchants[mk] || 0) + v;
      }
      return res;
    });
  }

  const prevMonthsWithData = (ym, n) => {
    const out = [];
    for (let k = 1; k <= n; k++) { const p = addMonths(ym, -k); if (hasData(p)) out.push(p); }
    return out;
  };

  /** Projected full-month totals. For the live month, extrapolates using how each
   *  category usually accrues through a month (so rent paid on day 2 isn't re-counted). */
  function projectFull(ym) {
    return cache(`p|${ym}`, () => {
      const cur = summarize(ym);
      if (!isLive(ym)) return { byCat: { ...cur.byCat }, total: cur.spent, income: cur.income };
      const d = TODAY.getDate(), D = dim(ym), prevs = prevMonthsWithData(ym, 3);
      const keys = new Set(Object.keys(cur.byCat));
      prevs.forEach((p) => Object.keys(summarize(p).byCat).forEach((c) => keys.add(c)));
      const out = {}; let total = 0;
      for (const c of keys) {
        const so = cur.byCat[c] || 0; let p;
        if (prevs.length) {
          const tots = [], fr = [];
          for (const pm of prevs) {
            const full = summarize(pm).byCat[c] || 0; tots.push(full);
            if (full > 0) { const part = summarize(pm, Math.round((d / D) * dim(pm))).byCat[c] || 0; fr.push(clamp(part / full, 0, 1)); }
          }
          const avg = mean(tots), frac = fr.length ? mean(fr) : d / D;
          p = so + Math.max(0, avg * (1 - frac));
        } else p = d > 0 ? (so / d) * D : so;
        p = Math.max(p, so); out[c] = p; total += p;
      }
      const incPrev = mean(prevs.map((p) => summarize(p).income));
      return { byCat: out, total, income: Math.max(cur.income, prevs.length ? incPrev : cur.income) };
    });
  }

  /** Next-month forecast = 50% this month (projected) + 30% last month + 20% the one before. */
  function forecastNext(ym) {
    return cache(`f|${ym}`, () => {
      const srcs = [{ w: 0.5, full: projectFull(ym) }];
      [addMonths(ym, -1), addMonths(ym, -2)].forEach((p, i) => {
        if (hasData(p)) { const s = summarize(p); srcs.push({ w: [0.3, 0.2][i], full: { byCat: s.byCat, total: s.spent, income: s.income } }); }
      });
      const W = srcs.reduce((a, s) => a + s.w, 0);
      const keys = new Set(); srcs.forEach((s) => Object.keys(s.full.byCat).forEach((c) => keys.add(c)));
      const byCat = {}; let total = 0;
      for (const c of keys) { let v = 0; for (const s of srcs) v += s.w * (s.full.byCat[c] || 0); v /= W; byCat[c] = v; total += v; }
      let income = 0; for (const s of srcs) income += s.w * s.full.income; income /= W;
      return { byCat, total, income, saved: income - total };
    });
  }

  function dataRange() {
    const keys = [...byMonth.keys()].sort();
    if (!keys.length) return [CUR_YM, CUR_YM];
    return [keys[0], keys[keys.length - 1] > CUR_YM ? keys[keys.length - 1] : CUR_YM];
  }

  const expenseCats = cats.filter((c) => c.kind === 'expense');
  const totalBudget = expenseCats.reduce((a, c) => a + (+c.budget || 0), 0);

  function trend(ym, n = 6) {
    const out = [];
    for (let k = n - 1; k >= 0; k--) {
      const m = addMonths(ym, -k), s = summarize(m);
      out.push({ ym: m, income: s.income, spent: s.spent, saved: s.income - s.spent, rate: s.income > 0 ? ((s.income - s.spent) / s.income) * 100 : 0, has: hasData(m), byCat: s.byCat });
    }
    return out;
  }

  return { summarize, projectFull, forecastNext, hasData, dataRange, prevMonthsWithData, trend, expenseCats, totalBudget, catMap, accounts, monthTx };
}
