const INR0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const INR2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const fmt = (v) => INR0.format(Math.round(v || 0));
export const fmt2 = (v) => INR2.format(v || 0);
export function fmtShort(v) {
  const a = Math.abs(v || 0), s = v < 0 ? '-' : '';
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(1).replace(/\.0$/, '') + 'Cr';
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(1).replace(/\.0$/, '') + 'L';
  if (a >= 1e3) return s + '₹' + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return s + '₹' + Math.round(a);
}
export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const ymOf = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1);
export const TODAY = new Date();
export const CUR_YM = ymOf(TODAY);
export function addMonths(ym, n) {
  let [y, m] = ym.split('-').map(Number);
  m += n;
  while (m > 12) { m -= 12; y++; }
  while (m < 1) { m += 12; y--; }
  return y + '-' + pad(m);
}
export function dim(ym) { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); }
export function monthLabel(ym, style = 'long') {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  if (style === 'short') return d.toLocaleDateString('en-IN', { month: 'short' });
  if (style === 'month') return d.toLocaleDateString('en-IN', { month: 'long' });
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
export function fmtDate(s, opts = { day: 'numeric', month: 'short' }) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', opts);
}
export function dayHeading(s) {
  const today = ymd(TODAY);
  const y = new Date(TODAY); y.setDate(y.getDate() - 1);
  if (s === today) return 'Today';
  if (s === ymd(y)) return 'Yesterday';
  return fmtDate(s, { weekday: 'long', day: 'numeric', month: 'long' });
}
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
export const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const isLive = (ym) => ym === CUR_YM;
export function greeting() {
  const h = TODAY.getHours();
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}
export const cx = (...a) => a.filter(Boolean).join(' ');
