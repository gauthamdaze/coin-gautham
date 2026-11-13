import { pad } from './format';

/* ---------- CSV ---------- */
export function parseCSV(text) {
  const first = text.split(/\r?\n/).slice(0, 15).join('\n');
  const counts = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  for (const ch of first) if (ch in counts) counts[ch]++;
  const delim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.map((r) => r.map((c) => c.trim()));
}

/* ---------- dates & amounts ---------- */
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const y4 = (y) => { y = +y; return y < 100 ? 2000 + y : y; };
function okDate(y, m, d) {
  if (!(y > 1990 && y < 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getMonth() !== m - 1) return null;
  return y + '-' + pad(m) + '-' + pad(d);
}
export function parseDate(v, order = 'dmy') {
  if (v == null || v === '') return null;
  if (v instanceof Date && !isNaN(v)) { const d = new Date(v.getTime() + 12 * 3600e3); return okDate(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
  if (typeof v === 'number' && v > 20000 && v < 80000) { const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5); return okDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()); }
  const s = String(v).trim(); let m;
  if ((m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return okDate(+m[1], +m[2], +m[3]);
  if ((m = s.match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2,4})\b/))) return order === 'mdy' ? okDate(y4(m[3]), +m[1], +m[2]) : okDate(y4(m[3]), +m[2], +m[1]);
  if ((m = s.match(/^(\d{1,2})[-/ ]?([A-Za-z]{3,9})[-/ ,']*(\d{2,4})/)) && MONTHS[m[2].toLowerCase().slice(0, 3)]) return okDate(y4(m[3]), MONTHS[m[2].toLowerCase().slice(0, 3)], +m[1]);
  if ((m = s.match(/^([A-Za-z]{3,9})[ -](\d{1,2}),?[ -](\d{2,4})/)) && MONTHS[m[1].toLowerCase().slice(0, 3)]) return okDate(y4(m[3]), MONTHS[m[1].toLowerCase().slice(0, 3)], +m[2]);
  return null;
}
export function detectOrder(vals) {
  let dmy = 0, mdy = 0;
  for (const v of vals) {
    const m = String(v || '').trim().match(/^(\d{1,2})[-/. ](\d{1,2})[-/. ]\d{2,4}/);
    if (!m) continue;
    if (+m[1] > 12) dmy++;
    if (+m[2] > 12) mdy++;
  }
  return mdy > dmy ? 'mdy' : 'dmy';
}
export function parseAmt(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? { v, hint: null } : null;
  let s = String(v).trim(); if (!s) return null;
  let hint = null;
  if (/\bcr\.?$/i.test(s) || /^cr\b/i.test(s)) hint = 'C';
  else if (/\bdr\.?$/i.test(s) || /^dr\b/i.test(s)) hint = 'D';
  let neg = /^\(.*\)$/.test(s) || /-\s*$/.test(s);
  s = s.replace(/(₹|inr|rs\.?|cr\.?|dr\.?|[(),\s])/gi, '');
  if (s.startsWith('-')) { neg = !neg; s = s.slice(1); }
  if (s.endsWith('-')) s = s.slice(0, -1);
  if (s.startsWith('+')) s = s.slice(1);
  if (!/^\d*\.?\d+$/.test(s)) return null;
  const n = parseFloat(s);
  return { v: neg ? -n : n, hint };
}

/* ---------- header & column detection ---------- */
export function findHeader(rows) {
  let best = -1, bestScore = 0;
  for (let i = 0; i < Math.min(60, rows.length); i++) {
    const cells = rows[i].map((c) => String(c || '').toLowerCase());
    let sc = 0;
    if (cells.some((c) => /date/.test(c))) sc += 2;
    if (cells.some((c) => /narration|description|particular|details|remark|merchant|transaction/.test(c))) sc += 2;
    if (cells.some((c) => /amount|debit|credit|withdraw|deposit|\bdr\b|\bcr\b/.test(c))) sc += 2;
    if (cells.filter((c) => c).length >= 3) sc += 1;
    if (sc > bestScore) { bestScore = sc; best = i; }
    if (sc >= 7) break;
  }
  return bestScore >= 5 ? best : -1;
}
export function guessMap(head) {
  const h = head.map((c) => String(c || '').toLowerCase().trim());
  const find = (re, not) => h.findIndex((c) => re.test(c) && !(not && not.test(c)));
  let date = find(/(txn|tran|transaction|posting).*date|^date$/);
  if (date < 0) date = find(/date/, /value/);
  if (date < 0) date = find(/date/);
  let desc = find(/narration|description|particular|details|remark|merchant/);
  if (desc < 0) desc = find(/transaction(?!.*(date|id|no|type))/);
  const debit = find(/withdraw|debit(?!.*\/)|\bdr\b(?!.*cr)|paid out|money out/, /credit|cr\/dr|dr\/cr|type/);
  const credit = find(/deposit|credit(?!.*\/)|\bcr\b(?!.*dr)|paid in|money in/, /debit|cr\/dr|dr\/cr|type|card/);
  const amount = find(/amount|amt/, /balance|withdraw|deposit|debit|credit/);
  const drcr = find(/dr\s*\/\s*cr|cr\s*\/\s*dr|debit\s*\/\s*credit|^type$|txn type|transaction type/);
  const mode = debit >= 0 && credit >= 0 ? 'split' : 'single';
  return { date, desc, debit, credit, amount: amount >= 0 ? amount : debit >= 0 ? debit : credit, drcr, mode };
}

/* ---------- file reading ---------- */
export async function readStatement(file) {
  const name = file.name.toLowerCase();
  if (/\.(xlsx|xls)$/.test(name)) {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
    let rows = [];
    for (const sn of wb.SheetNames) {
      const r = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: '' });
      if (r.length > rows.length) rows = r;
    }
    return rows.map((r) => r.map((c) => (typeof c === 'string' ? c.trim() : c)));
  }
  const text = await file.text();
  return parseCSV(text.replace(/^﻿/, ''));
}

/** Prepares an import session from a file. */
export async function prepareImport(file, accounts) {
  let rows = await readStatement(file);
  rows = rows.filter((r) => r.some((c) => c !== '' && c != null));
  const hi = findHeader(rows);
  const head = hi >= 0 ? rows[hi].map(String) : (rows[0] || []).map((_, i) => 'Column ' + (i + 1));
  const body = rows.slice(hi >= 0 ? hi + 1 : 0);
  const map = guessMap(head);
  const isCC = /credit|card|cc/i.test(file.name) || head.some((h) => /card no|card number/i.test(h));
  const acc = accounts.find((a) => a.type === (isCC ? 'credit' : 'bank')) || accounts[0];
  return {
    file: file.name, head, body, map,
    order: map.date >= 0 ? detectOrder(body.map((r) => r[map.date])) : 'dmy',
    acc: acc ? acc.id : '__new',
    newName: isCC ? 'Credit card' : 'Bank account',
    newType: isCC ? 'credit' : 'bank',
    sign: (acc && acc.type === 'credit') || (!acc && isCC) ? 'pos_spend' : 'neg_spend',
    removeSample: true,
  };
}

/** Turns the mapped rows into transactions: {date, desc, amt, dir}. */
export function buildImportTx(I) {
  const M = I.map, out = []; let bad = 0;
  for (const r of I.body) {
    const date = parseDate(r[M.date], I.order);
    if (!date) { bad++; continue; }
    const desc = String(M.desc >= 0 ? r[M.desc] : '').replace(/\s+/g, ' ').trim() || '(no description)';
    if (/opening balance|closing balance|^total|b\/f|c\/f/i.test(desc)) continue;
    let amt = null, dir = null;
    if (M.mode === 'split') {
      const d = parseAmt(r[M.debit]), c = parseAmt(r[M.credit]);
      if (d && Math.abs(d.v) > 0) { amt = Math.abs(d.v); dir = d.v < 0 ? 'C' : 'D'; }
      else if (c && Math.abs(c.v) > 0) { amt = Math.abs(c.v); dir = c.v < 0 ? 'D' : 'C'; }
    } else {
      const a = parseAmt(r[M.amount]);
      if (a && a.v !== 0) {
        amt = Math.abs(a.v);
        const t = M.drcr >= 0 ? String(r[M.drcr] || '').toLowerCase() : '';
        if (/^(cr|c|credit|deposit)/.test(t)) dir = 'C';
        else if (/^(dr|d|debit|withdraw)/.test(t)) dir = 'D';
        else if (a.hint) dir = a.hint;
        else dir = I.sign === 'neg_spend' ? (a.v < 0 ? 'D' : 'C') : (a.v < 0 ? 'C' : 'D');
      }
    }
    if (!amt || !dir) { bad++; continue; }
    out.push({ date, desc, amt: Math.round(amt * 100) / 100, dir });
  }
  return { out, bad };
}
