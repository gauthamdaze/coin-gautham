import { CUR_YM, TODAY, addMonths, dim, monthLabel, pad, uid, clamp } from './format';
import { autoCat, sortedRules } from './categorize';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Six months of realistic Indian bank + credit-card transactions, ending today. */
export function genSample(rules, cats) {
  const r = mulberry32(20261113);
  const R = (a, b) => Math.round(a + r() * (b - a));
  const pick = (a) => a[Math.floor(r() * a.length)];
  const tx = [];
  let prevCC = 0;
  for (let k = 5; k >= 0; k--) {
    const ym = addMonths(CUR_YM, -k), D = dim(ym), last = k === 0 ? TODAY.getDate() : D, now = k === 0;
    let cc = 0;
    const add = (day, desc, amt, dir, acc) => {
      day = clamp(day, 1, D);
      if (day > last) return;
      amt = Math.round(amt);
      tx.push({ id: uid(), date: ym + '-' + pad(day), desc, amt, dir, acc });
      if (acc === 'cc') { if (dir === 'D') cc += amt; else if (!/PAYMENT RECEIVED/.test(desc)) cc -= amt; }
    };
    add(1, 'NEFT CR-ACME TECHNOLOGIES PVT LTD-SALARY ' + monthLabel(ym, 'short').toUpperCase(), 125000, 'C', 'bank');
    add(2, 'UPI-RAJESH KUMAR-rajesh.k@okhdfcbank-HOUSE RENT', 28000, 'D', 'bank');
    add(5, 'ACH D- ZERODHA BROKING-MF SIP', 15000, 'D', 'bank');
    add(8, 'BESCOM ELECTRICITY BILL PAYMENT', R(1500, 2600), 'D', 'bank');
    add(10, 'AIRTEL POSTPAID BILL', 999, 'D', 'cc');
    add(11, 'JIO FIBER RECHARGE', R(699, 999), 'D', 'bank');
    add(12, 'NETFLIX.COM MUMBAI', 649, 'D', 'cc');
    add(15, 'SPOTIFY INDIA', 119, 'D', 'cc');
    add(16, 'YOUTUBE PREMIUM GOOGLE', 129, 'D', 'cc');
    if (prevCC > 0) {
      add(18, 'CC PAYMENT HDFC CREDIT CARD BILLDESK', prevCC, 'D', 'bank');
      add(18, 'PAYMENT RECEIVED - THANK YOU', prevCC, 'C', 'cc');
    }
    for (let i = 0, n = R(6, 9); i < n; i++) add(R(1, D), pick(['BIGBASKET', 'ZEPTO MARKETPLACE', 'BLINKIT', 'DMART AVENUE SUPERMARTS', 'SWIGGY INSTAMART']), R(300, 2400), 'D', r() < 0.6 ? 'cc' : 'bank');
    const foodN = now ? R(12, 14) : R(7 + (5 - k), 13);
    for (let i = 0; i < foodN; i++) add(now ? R(1, last) : R(1, D), pick(['SWIGGY BANGALORE', 'ZOMATO LTD', 'SWIGGY ORDER']), R(180, now ? 620 : 520), 'D', 'cc');
    for (let i = 0, n = R(3, 5); i < n; i++) add(R(1, D), pick(['STARBUCKS COFFEE', 'THIRD WAVE COFFEE', 'TOIT BREWPUB', 'CHAAYOS', 'MCDONALDS']), R(250, 2400), 'D', 'cc');
    for (let i = 0, n = R(8, 14); i < n; i++) add(R(1, D), pick(['UBER INDIA SYSTEMS', 'OLA CABS', 'RAPIDO BIKE']), R(110, 560), 'D', r() < 0.5 ? 'cc' : 'bank');
    add(R(3, 12), 'HPCL FUEL STATION', R(1500, 2400), 'D', 'cc');
    add(R(16, 28), 'INDIAN OIL PETROL PUMP', R(1500, 2400), 'D', 'cc');
    for (let i = 0, n = R(2, 4); i < n; i++) add(R(1, D), pick(['AMAZON PAY INDIA', 'FLIPKART INTERNET', 'MYNTRA DESIGNS', 'DECATHLON SPORTS']), R(400, 3800), 'D', 'cc');
    if (now) add(7, 'CROMA RETAIL - INFINITI RETAIL', 6999, 'D', 'cc');
    if (r() < 0.6) add(R(5, 25), 'AMAZON REFUND', R(400, 1400), 'C', 'cc');
    for (let i = 0, n = R(0, 2); i < n; i++) add(R(1, D), 'APOLLO PHARMACY', R(200, 1400), 'D', 'bank');
    for (let i = 0, n = R(1, 2); i < n; i++) add(R(1, D), 'BOOKMYSHOW', R(400, 1200), 'D', 'cc');
    if (k === 3 || k === 1) {
      add(R(5, 20), 'MAKEMYTRIP INDIA', R(8000, 14000), 'D', 'cc');
      add(R(5, 20), 'INDIGO AIRLINES', R(4000, 7000), 'D', 'cc');
    }
    if (k % 3 === 0) add(28, 'INT.PD SAVINGS ACCOUNT', R(300, 900), 'C', 'bank');
    const people = ['UPI-SURESH M-9845011223@ybl-PAYMENT', 'POS 4567XXXX SRI LAKSHMI STORES', 'UPI-ANITHA R-anitha@oksbi-SPLIT DINNER', 'UPI-GANESH TEA STALL-q234@paytm', 'UPI-PRAKASH LAUNDRY-prakash@ibl', 'UPI-MEERA NAIR-meera@okaxis-GIFT'];
    for (let i = 0, n = R(3, 6); i < n; i++) add(R(1, D), pick(people), R(80, 2500), 'D', 'bank');
    if (now) {
      add(3, 'UPI-GANESH TEA STALL-q234@paytm', 140, 'D', 'bank');
      add(9, 'POS 4567XXXX SRI LAKSHMI STORES', 860, 'D', 'bank');
      add(11, 'UPI-MEERA NAIR-meera@okaxis-GIFT', 1500, 'D', 'bank');
    }
    prevCC = Math.max(0, cc);
  }
  const sr = sortedRules(rules, cats);
  for (const t of tx) t.cat = autoCat(t.desc, sr);
  tx.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return tx;
}
