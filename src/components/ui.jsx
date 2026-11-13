import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, animate, motion, useDragControls, useInView, useMotionValue, useTransform } from 'framer-motion';
import {
  Home, ShoppingBasket, Bike, UtensilsCrossed, Car, ShoppingBag, Zap, Tv, HeartPulse, Ticket, Plane, Wallet,
  TrendingUp, ArrowLeftRight, Tag, X, Coffee, Gift, GraduationCap, Baby, PawPrint, Dumbbell, Fuel, Smartphone,
  Shirt, Sparkles, Landmark, Receipt, HelpCircle, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';
import { fmt, cx } from '../lib/format';
import { useUI } from '../lib/store';

export const spring = { type: 'spring', stiffness: 380, damping: 32, mass: 0.8 };
export const softSpring = { type: 'spring', stiffness: 220, damping: 26 };

export const ICONS = {
  home: Home, basket: ShoppingBasket, bike: Bike, utensils: UtensilsCrossed, car: Car, bag: ShoppingBag, zap: Zap,
  tv: Tv, heart: HeartPulse, ticket: Ticket, plane: Plane, wallet: Wallet, trending: TrendingUp, swap: ArrowLeftRight,
  tag: Tag, coffee: Coffee, gift: Gift, edu: GraduationCap, baby: Baby, pet: PawPrint, gym: Dumbbell, fuel: Fuel,
  phone: Smartphone, shirt: Shirt, sparkles: Sparkles, bank: Landmark, receipt: Receipt,
};

/** Rounded coloured bubble with the category icon. */
export function CatIcon({ cat, size = 40, className = '' }) {
  const Icon = (cat && ICONS[cat.icon]) || (cat ? Tag : HelpCircle);
  const color = cat ? cat.color : '#94a3b8';
  return (
    <span
      className={cx('grid shrink-0 place-items-center rounded-2xl', className)}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}26, ${color}14)`, color }}
    >
      <Icon size={size * 0.48} strokeWidth={2.2} />
    </span>
  );
}

/** Counts up to `value` with a spring when it scrolls into view or changes. */
export function AnimatedNumber({ value, format = fmt, className = '', duration = 0.9 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));
  const [display, setDisplay] = useState(format(0));
  useEffect(() => text.on('change', setDisplay), [text]);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, value || 0, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [value, inView]); // eslint-disable-line
  return <span ref={ref} className={cx('num', className)}>{display}</span>;
}

export function Card({ children, className = '', delay = 0, ...rest }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...softSpring, delay }}
      className={cx('card p-5 sm:p-6', className)}
      {...rest}
    >
      {children}
    </motion.section>
  );
}

export function CardHeader({ title, subtitle, right, icon }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {icon}
        <div className="min-w-0">
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="t-3 mt-0.5 text-[13px]">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/** Animated progress bar; turns red with stripes when over. */
export function Progress({ value, max, color = '#6366f1', height = 8, projected }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  const projPct = projected && max > 0 ? Math.min(100, (projected / max) * 100) : 0;
  return (
    <div className="bg-track relative w-full overflow-hidden rounded-full" style={{ height }}>
      {projPct > pct && (
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `repeating-linear-gradient(90deg, ${color}40 0 6px, transparent 6px 10px)` }}
          initial={{ width: 0 }} animate={{ width: projPct + '%' }} transition={{ ...softSpring, delay: 0.15 }}
        />
      )}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          background: over
            ? 'repeating-linear-gradient(45deg,#f43f5e 0 6px,#fb7185 6px 10px)'
            : `linear-gradient(90deg, ${color}cc, ${color})`,
        }}
        initial={{ width: 0 }} animate={{ width: pct + '%' }} transition={softSpring}
      />
    </div>
  );
}

/** Apple-Watch style concentric rings. rings: [{value 0..1+, color, label}] */
export function Rings({ rings, size = 168, stroke = 16 }) {
  const gap = 4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {rings.map((r, i) => {
        const radius = size / 2 - stroke / 2 - i * (stroke + gap);
        const C = 2 * Math.PI * radius;
        const v = Math.max(0, Math.min(1, r.value));
        return (
          <g key={i}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.color} strokeOpacity={0.16} strokeWidth={stroke} />
            <motion.circle
              cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C * (1 - v) }}
              transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.2 + i * 0.12 }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** iOS-style segmented control with a sliding thumb. */
export function Segmented({ value, onChange, options, id = 'seg', size = 'md' }) {
  return (
    <div className="bg-track relative inline-flex rounded-full p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cx('relative z-10 rounded-full font-semibold transition-colors', size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-[13px]', active ? 't-ink' : 't-3')}
          >
            {active && <motion.span layoutId={`${id}-thumb`} className="bg-solid absolute inset-0 -z-10 rounded-full shadow-soft" transition={spring} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Bottom sheet on mobile, centred dialog on desktop. Drag down to dismiss. */
export function Sheet({ open, onClose, title, subtitle, children, footer, wide }) {
  const controls = useDragControls();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            className={cx('bg-solid relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] shadow-lift sm:rounded-[28px]', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
            initial={{ y: '100%', opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            drag="y" dragListener={false} dragControls={controls} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose(); }}
          >
            <div className="flex cursor-grab touch-none justify-center pt-2.5 sm:hidden" onPointerDown={(e) => controls.start(e)}><span className="h-1.5 w-10 rounded-full bg-slate-400/40" /></div>
            <div className="flex touch-none items-start justify-between gap-3 px-6 pb-2 pt-4" onPointerDown={(e) => { if (!e.target.closest('button')) controls.start(e); }}>
              <div>
                <h3 className="font-display text-xl font-bold tracking-tight">{title}</h3>
                {subtitle && <p className="t-3 mt-0.5 text-sm">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="btn-soft !p-2" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto px-6 pb-4">{children}</div>
            {footer && <div className="hairline safe-bottom flex justify-end gap-2 border-t px-6 pt-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Renders children into <body> so position:fixed isn't trapped by animated parents. */
export function Portal({ children }) {
  return createPortal(children, document.body);
}

export function Confirm({ state, onClose }) {
  return (
    <Sheet
      open={!!state} onClose={onClose} title={state?.title}
      footer={<>
        <button className="btn-soft" onClick={onClose}>Cancel</button>
        <button className={state?.danger ? 'btn-danger' : 'btn-primary'} onClick={() => { state.onOk(); onClose(); }}>{state?.ok || 'OK'}</button>
      </>}
    >
      <p className="t-2 text-[15px] leading-relaxed">{state?.body}</p>
    </Sheet>
  );
}

export function Toasts() {
  const toasts = useUI((s) => s.toasts);
  const Icon = { success: CheckCircle2, warn: AlertTriangle, default: Info };
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      <AnimatePresence>
        {toasts.map((t) => {
          const I = Icon[t.tone] || Info;
          return (
            <motion.div
              key={t.id} layout
              initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={spring}
              className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full bg-slate-900/90 px-4 py-2.5 text-sm font-medium text-white shadow-lift backdrop-blur-xl dark:bg-white/90 dark:text-slate-900"
            >
              <I size={17} className={t.tone === 'success' ? 'text-emerald-400 dark:text-emerald-600' : t.tone === 'warn' ? 'text-amber-400' : 'text-indigo-300 dark:text-indigo-600'} />
              {t.msg}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function Pill({ tone = 'neutral', children }) {
  const tones = {
    over: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
    risk: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    ok: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
    neutral: 'bg-slate-500/10 t-2',
    accent: 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-300',
  };
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold', tones[tone])}>{children}</span>;
}

export function Delta({ cur, prev, goodWhenUp, label }) {
  if (!prev) return <span className="t-3">No data for {label}</span>;
  const d = cur - prev;
  if (Math.abs(d) < 1) return <span className="t-3">Same as {label}</span>;
  const up = d > 0, good = up === goodWhenUp;
  const pct = Math.round((Math.abs(d) / Math.abs(prev)) * 100);
  return (
    <span>
      <span className={cx('font-semibold', good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
        {up ? '↑' : '↓'} {fmt(Math.abs(d))}{isFinite(pct) && pct ? ` (${pct}%)` : ''}
      </span>{' '}
      <span className="t-3">vs {label}</span>
    </span>
  );
}

/** Staggered list container + item helpers. */
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } } };
export const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: softSpring } };
