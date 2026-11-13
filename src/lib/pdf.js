/**
 * PDF statement reader — runs entirely in the browser with pdf.js.
 *
 * 1. Extracts every text item with its position.
 * 2. Rebuilds visual lines (items sharing a baseline) and splits each line into cells by gaps.
 * 3. Finds the transaction table header (Date / Narration / Debit / Credit / Amount …) and
 *    assigns every cell on later lines to a column by its x-position. Repeated page headers
 *    are skipped and wrapped descriptions are joined onto the row above.
 * 4. If no header is found, falls back to "line starts with a date, ends with an amount".
 *
 * Returns rows (arrays of cell strings) with a header row first, so the normal
 * column-mapping + preview flow works unchanged.
 */

export class PdfPasswordError extends Error {
  constructor(incorrect) {
    super(incorrect ? 'Incorrect password' : 'Password required');
    this.name = 'PdfPasswordError';
    this.incorrect = incorrect;
  }
}

let pdfjsPromise = null;
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

const DATE_RE = /^(\d{1,2}[-/. ](\d{1,2}|[A-Za-z]{3,9})[-/. ,']*\d{2,4}|\d{4}-\d{2}-\d{2}|[A-Za-z]{3,9} \d{1,2},? \d{2,4})\b/;
const AMT_RE = /^[-+(]?\s*(₹|rs\.?|inr)?\s*[\d,]+(\.\d{1,2})?\s*\)?\s*(cr|dr|c|d)?\.?$/i;
const isDate = (s) => DATE_RE.test(String(s).trim());
const isAmt = (s) => AMT_RE.test(String(s).trim()) && /\d/.test(s);
const HEADER_WORDS = /\b(date|narration|description|particulars|details|remarks|transaction|withdrawal|deposit|debit|credit|amount|balance|chq|ref)/i;

async function extractLines(data, password) {
  const pdfjs = await loadPdfjs();
  let doc;
  try {
    doc = await pdfjs.getDocument({ data, password: password || undefined, isEvalSupported: false, useSystemFonts: true }).promise;
  } catch (e) {
    if (e && e.name === 'PasswordException') throw new PdfPasswordError(e.code === 2);
    throw new Error('Could not open this PDF — is it a valid, unprotected statement?');
  }
  const lines = [];
  let textCount = 0;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items = tc.items
      .filter((it) => it.str && it.str.trim())
      .map((it) => ({ s: it.str.replace(/\s+/g, ' ').trim(), x: it.transform[4], y: it.transform[5], w: it.width || it.str.length * 4, h: Math.abs(it.transform[3]) || 8 }));
    textCount += items.length;
    // group into lines by baseline (pdf y grows upward)
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    const pageLines = [];
    for (const it of items) {
      const tol = Math.max(2, it.h * 0.45);
      const ln = pageLines.find((l) => Math.abs(l.y - it.y) <= tol);
      if (ln) ln.items.push(it); else pageLines.push({ y: it.y, page: p, items: [it] });
    }
    for (const ln of pageLines) {
      ln.items.sort((a, b) => a.x - b.x);
      // merge items into cells: a gap bigger than ~1.2 chars starts a new cell
      const cells = [];
      for (const it of ln.items) {
        const last = cells[cells.length - 1];
        const charW = it.w / Math.max(1, it.s.length);
        if (last && it.x - last.x1 < Math.max(3, charW * 1.2)) { last.s += (it.x - last.x1 > charW * 0.25 ? ' ' : '') + it.s; last.x1 = it.x + it.w; }
        else cells.push({ s: it.s, x0: it.x, x1: it.x + it.w });
      }
      ln.cells = cells;
      ln.text = cells.map((c) => c.s).join(' ');
    }
    pageLines.sort((a, b) => b.y - a.y);
    lines.push(...pageLines);
  }
  if (textCount < 5) throw new Error('This PDF has no readable text (it looks scanned). Download the e-statement from net banking, or use CSV/Excel.');
  return lines;
}

function headerScore(line) {
  const t = line.text.toLowerCase();
  let s = 0;
  if (/\bdate\b/.test(t)) s += 2;
  if (/narration|description|particulars|details|remarks|transaction/.test(t)) s += 2;
  if (/amount|debit|credit|withdrawal|deposit|\bdr\b|\bcr\b/.test(t)) s += 2;
  if (line.cells.length >= 3) s += 1;
  if (line.cells.some((c) => isAmt(c.s) || isDate(c.s))) s -= 3; // a data row, not a header
  return s;
}

/** Header cells sometimes wrap onto two lines ("Withdrawal" / "Amt."). Merge a header line with
 *  the line directly below it when that line has no date and no amounts. */
function headerColumns(lines, hi) {
  const cols = lines[hi].cells.map((c) => ({ name: c.s, x0: c.x0, x1: c.x1 }));
  const next = lines[hi + 1];
  if (next && next.page === lines[hi].page && Math.abs(lines[hi].y - next.y) < 16 && !next.cells.some((c) => isDate(c.s) || isAmt(c.s)) && next.cells.every((c) => c.s.length < 25)) {
    for (const c of next.cells) {
      const mid = (c.x0 + c.x1) / 2;
      const col = cols.find((k) => mid >= k.x0 - 6 && mid <= k.x1 + 6);
      if (col) { col.name += ' ' + c.s; col.x0 = Math.min(col.x0, c.x0); col.x1 = Math.max(col.x1, c.x1); }
    }
    return { cols, skip: 1 };
  }
  return { cols, skip: 0 };
}

function tableFromHeader(lines, hi) {
  const { cols, skip } = headerColumns(lines, hi);
  const n = cols.length;
  const headerKey = lines[hi].text.toLowerCase().replace(/\s+/g, '');
  // column boundaries halfway between neighbours
  const bounds = cols.map((c, i) => ({
    lo: i === 0 ? -Infinity : (cols[i - 1].x1 + c.x0) / 2,
    hi: i === n - 1 ? Infinity : (c.x1 + cols[i + 1].x0) / 2,
  }));
  const colOf = (cell) => {
    const mid = (cell.x0 + cell.x1) / 2;
    let i = bounds.findIndex((b) => mid >= b.lo && mid < b.hi);
    if (i < 0) i = n - 1;
    return i;
  };
  const dateCol = cols.findIndex((c) => /date/i.test(c.name) && !/value/i.test(c.name)) >= 0
    ? cols.findIndex((c) => /date/i.test(c.name) && !/value/i.test(c.name))
    : cols.findIndex((c) => /date/i.test(c.name));
  const descCol = cols.findIndex((c) => /narration|description|particulars|details|remarks|transaction(?!.*date)/i.test(c.name));

  const rows = [cols.map((c) => c.name)];
  let cur = null, ended = false;
  for (let i = hi + 1 + skip; i < lines.length && !ended; i++) {
    const ln = lines[i];
    const key = ln.text.toLowerCase().replace(/\s+/g, '');
    if (key === headerKey || (headerScore(ln) >= 5 && HEADER_WORDS.test(ln.text))) { cur = null; continue; } // repeated header on new page
    const row = new Array(n).fill('');
    // place each text run (not merged cells) so text that spills toward a neighbour stays put
    for (const it of ln.items) { const k = colOf({ x0: it.x, x1: it.x + it.w }); row[k] = row[k] ? row[k] + ' ' + it.s : it.s; }
    const dateCell = dateCol >= 0 ? row[dateCol] : ln.cells[0]?.s || '';
    const hasDate = isDate(dateCell);
    const hasAmt = row.some((v, k) => k !== dateCol && k !== descCol && isAmt(v));
    if (hasDate && hasAmt) { cur = row; rows.push(row); continue; }
    if (hasDate && !hasAmt) { cur = row; rows.push(row); continue; } // amount may be on the wrapped line
    if (cur && !hasDate) {
      // continuation: wrapped description (or an amount that wrapped below)
      const textOnly = ln.cells.length <= 3 && ln.text.length < 120;
      if (/opening balance|closing balance|statement summary|page \d+|total/i.test(ln.text)) { cur = null; continue; }
      if (textOnly && Math.abs(ln.y - (lines[i - 1]?.y ?? ln.y)) < 30 && ln.page === lines[i - 1]?.page) {
        row.forEach((v, k) => { if (v) cur[k] = cur[k] ? cur[k] + (k === descCol ? ' ' : ' ') + v : v; });
        continue;
      }
      cur = null;
    }
  }
  return rows.filter((r, i) => i === 0 || r.some((v) => isAmt(v)));
}

function tableFromLines(lines) {
  // Fallback: "<date> <description…> <amount> [Cr/Dr] [balance]"
  const rows = [['Date', 'Description', 'Amount', 'Balance']];
  for (const ln of lines) {
    const t = ln.text.trim();
    const m = t.match(DATE_RE);
    if (!m) continue;
    let rest = t.slice(m[0].length).trim();
    // a second date (value date) right after the first
    const m2 = rest.match(DATE_RE); if (m2) rest = rest.slice(m2[0].length).trim();
    const toks = rest.split(' ');
    const amts = [];
    while (toks.length) {
      const last = toks[toks.length - 1];
      if (/^(cr|dr|c|d)\.?$/i.test(last) && toks.length > 1 && isAmt(toks[toks.length - 2])) { amts.unshift(toks.splice(-2).join(' ')); continue; }
      if (isAmt(last)) { amts.unshift(toks.pop()); continue; }
      break;
    }
    if (!amts.length) continue;
    rows.push([m[0], toks.join(' '), amts.length >= 2 ? amts[amts.length - 2] : amts[0], amts.length >= 2 ? amts[amts.length - 1] : '']);
  }
  // With a running balance we can tell money in from money out: tag amounts with Dr/Cr.
  const num = (v) => { const x = parseFloat(String(v).replace(/[^\d.-]/g, '')); return isFinite(x) ? x : null; };
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[3] || /\b(cr|dr)\b/i.test(r[2])) continue;
    const bal = num(r[3]), amt = num(r[2]);
    const prevBal = i > 1 ? num(rows[i - 1][3]) : null;
    if (bal == null || amt == null) continue;
    let dir = null;
    if (prevBal != null) dir = Math.abs(prevBal - amt - bal) < 0.6 ? 'Dr' : Math.abs(prevBal + amt - bal) < 0.6 ? 'Cr' : null;
    if (!dir) {
      const d = r[1].toUpperCase();
      if (/^TO\b|\/DR\/|\bWDL\b|\bDEBIT\b|\bPURCHASE\b/.test(d)) dir = 'Dr';
      else if (/^BY\b|\/CR\/|\bCREDIT\b|\bREFUND\b|\bSALARY\b/.test(d)) dir = 'Cr';
    }
    if (dir) r[2] = r[2] + ' ' + dir;
  }
  return rows;
}

export async function readPdfRows(file, password) {
  const data = new Uint8Array(await file.arrayBuffer());
  const lines = await extractLines(data, password);
  let best = -1, bestScore = 0;
  lines.forEach((l, i) => { const s = headerScore(l); if (s > bestScore) { bestScore = s; best = i; } });
  let rows = best >= 0 && bestScore >= 5 && lines[best].cells.length >= 3 ? tableFromHeader(lines, best) : null;
  if (!rows || rows.length < 2) rows = tableFromLines(lines);
  if (rows.length < 2) throw new Error('No transactions found in this PDF. Try the CSV/Excel download, or send me the layout to support it.');
  return rows;
}
