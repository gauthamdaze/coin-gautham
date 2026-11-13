export const norm = (s) =>
  String(s || '').toLowerCase().replace(/[-_/*@|#:,()]+/g, ' ').replace(/\s+/g, ' ').trim();

const reCache = new Map();
export function kwMatch(nd, k) {
  if (!k) return false;
  if (k.length >= 5 || /\s/.test(k)) return nd.includes(k);
  let re = reCache.get(k);
  if (!re) {
    re = new RegExp('(^|[^a-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)');
    reCache.set(k, re);
  }
  return re.test(nd);
}

export function sortedRules(rules, cats) {
  const ids = new Set(cats.map((c) => c.id));
  return rules.filter((r) => ids.has(r.c)).slice().sort((a, b) => b.k.length - a.k.length);
}

export function autoCat(desc, sorted) {
  const nd = norm(desc);
  for (const r of sorted) if (kwMatch(nd, r.k)) return r.c;
  return null;
}

const STOP = new Set(
  'upi pos neft imps rtgs ach nach txn ref payment pay paid to from debit credit card purchase www com in co ltd pvt private limited india the and dr cr inr rs ecom online bank ybl okaxis okhdfcbank oksbi okicici paytm apl ibl axl by for of at transfer trf cms bil onl vps vin mmt imp int mumbai bangalore bengaluru delhi chennai hyderabad pune gurgaon noida kolkata order'.split(' ')
);

/** A short, human keyword for a transaction ("swiggy", "rajesh kumar"). */
export function guessKey(desc) {
  const words = norm(desc).split(/[^a-z&.]+/).filter((w) => w.length >= 3 && !STOP.has(w) && !/x{3,}/.test(w));
  if (!words.length) return norm(desc).slice(0, 14);
  if (words[0].length >= 4) return words[0];
  // keep the phrase contiguous so it actually matches the description
  const toks = norm(desc).split(' ');
  const i = toks.findIndex((t) => t.includes(words[0]));
  return i >= 0 ? toks.slice(i, i + 2).join(' ') : words[0];
}
