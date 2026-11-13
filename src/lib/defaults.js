// Vibrant, modern category palette (Tailwind 500 steps).
export const PALETTE = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#d946ef',
];

// [id, name, kind, monthly budget, color, icon]
export const DEFAULT_CATS = [
  ['rent', 'Rent & Housing', 'expense', 28000, '#6366f1', 'home'],
  ['groceries', 'Groceries', 'expense', 9000, '#10b981', 'basket'],
  ['food', 'Food Delivery', 'expense', 4500, '#f97316', 'bike'],
  ['dining', 'Dining Out', 'expense', 4000, '#f43f5e', 'utensils'],
  ['transport', 'Transport & Fuel', 'expense', 5000, '#0ea5e9', 'car'],
  ['shopping', 'Shopping', 'expense', 7000, '#ec4899', 'bag'],
  ['bills', 'Bills & Utilities', 'expense', 4500, '#f59e0b', 'zap'],
  ['subs', 'Subscriptions', 'expense', 1200, '#8b5cf6', 'tv'],
  ['health', 'Health', 'expense', 2000, '#14b8a6', 'heart'],
  ['fun', 'Entertainment', 'expense', 2500, '#d946ef', 'ticket'],
  ['travel', 'Travel', 'expense', 5000, '#06b6d4', 'plane'],
  ['income', 'Income', 'income', 0, '#22c55e', 'wallet'],
  ['invest', 'Investments & SIP', 'transfer', 0, '#64748b', 'trending'],
  ['transfer', 'Card Payments & Transfers', 'transfer', 0, '#94a3b8', 'swap'],
];

export const DEFAULT_RULES = {
  rent: ['rent', 'nobroker', 'housing society', 'maintenance charges'],
  groceries: ['bigbasket', 'zepto', 'blinkit', 'dmart', 'instamart', 'jiomart', 'more retail', 'nature basket', 'ratnadeep', 'reliance fresh', 'spencers', 'grocery', 'supermarket'],
  food: ['swiggy', 'zomato', 'eatsure', 'dominos', 'faasos', 'box8'],
  dining: ['starbucks', 'third wave', 'cafe', 'restaurant', 'brewpub', 'toit', 'chaayos', 'mcdonald', 'mcdonalds', 'kfc', 'pizza hut', 'burger king', 'haldiram'],
  transport: ['uber', 'ola', 'rapido', 'irctc', 'metro', 'fuel', 'petrol', 'hpcl', 'bpcl', 'iocl', 'indian oil', 'fastag', 'namma yatri'],
  shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'decathlon', 'ikea', 'croma', 'reliance digital', 'tata cliq', 'lenskart'],
  bills: ['bescom', 'electricity', 'airtel', 'jio', 'vodafone', 'act fibernet', 'bsnl', 'tata power', 'water bill', 'broadband', 'recharge', 'lpg', 'indane'],
  subs: ['netflix', 'spotify', 'youtube', 'prime video', 'hotstar', 'apple.com', 'google play', 'icloud', 'openai', 'claude.ai', 'linkedin premium'],
  health: ['apollo', 'pharmacy', 'pharmeasy', 'netmeds', 'hospital', 'clinic', 'diagnostic', 'practo', 'cult.fit', 'cultfit', 'medplus'],
  fun: ['bookmyshow', 'pvr', 'inox', 'steam', 'playstation'],
  travel: ['makemytrip', 'goibibo', 'indigo', 'air india', 'vistara', 'akasa', 'cleartrip', 'oyo', 'airbnb', 'booking.com', 'yatra', 'redbus', 'ixigo'],
  income: ['salary', 'int.pd', 'interest credit', 'dividend', 'cashback'],
  invest: ['sip', 'mutual fund', 'zerodha', 'groww', 'kuvera', 'nps', 'ppf', 'indian clearing'],
  transfer: ['cc payment', 'credit card payment', 'payment received', 'billdesk', 'autopay', 'card bill', 'self transfer', 'thank you', 'own account'],
};

export const KIND_LABEL = { expense: 'Spending', income: 'Income', transfer: 'Transfer / savings' };

export function defaultCats() {
  return DEFAULT_CATS.map(([id, name, kind, budget, color, icon]) => ({ id, name, kind, budget, color, icon }));
}
export function defaultRules() {
  const r = [];
  for (const [c, kws] of Object.entries(DEFAULT_RULES)) for (const k of kws) r.push({ k, c });
  return r;
}
export function defaultAccounts() {
  return [
    { id: 'bank', name: 'Bank / Debit card', type: 'bank' },
    { id: 'cc', name: 'Credit card', type: 'credit' },
  ];
}
