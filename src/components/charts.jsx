import { useState } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ReferenceLine,
  ResponsiveContainer, Sector, Tooltip, XAxis, YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { fmt, fmtShort, monthLabel } from '../lib/format';

const AXIS = { axisLine: false, tickLine: false, tickMargin: 8 };

export function TipBox({ title, rows }) {
  return (
    <div className="glass min-w-[170px] rounded-2xl px-3.5 py-2.5 text-[13px] shadow-lift">
      {title && <div className="mb-1.5 font-semibold">{title}</div>}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between gap-5 py-0.5">
          <span className="t-2 flex items-center gap-2">{r.color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />}{r.label}</span>
          <b className="num" style={r.valueColor ? { color: r.valueColor } : undefined}>{r.value}</b>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Donut / pie ---------------- */
function ActiveSlice(p) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = p;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={6} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 15} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.35} cornerRadius={3} />
    </g>
  );
}

/** data: [{id,name,value,color}] */
export function Donut({ data, total, label = 'Spent', height = 260, onSelect }) {
  const [active, setActive] = useState(-1);
  const cur = active >= 0 ? data[active] : null;
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="86%" paddingAngle={2.5} cornerRadius={8}
            stroke="none" activeIndex={active} activeShape={ActiveSlice}
            onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(-1)} onClick={(d) => onSelect && onSelect(d)}
            animationDuration={900} animationEasing="ease-out" isAnimationActive
          >
            {data.map((d) => <Cell key={d.id} fill={d.color} style={{ cursor: onSelect ? 'pointer' : 'default', outline: 'none' }} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <motion.div key={cur ? cur.id : 'total'} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
          <div className="t-3 text-xs font-medium">{cur ? cur.name : label}</div>
          <div className="num font-display text-2xl font-extrabold tracking-tight">{fmt(cur ? cur.value : total)}</div>
          {cur && total > 0 && <div className="t-3 text-xs font-semibold">{Math.round((cur.value / total) * 100)}% of total</div>}
        </motion.div>
      </div>
    </div>
  );
}

/* ---------------- Pace (area + lines) ---------------- */
export function PaceChart({ data, budget, curLabel, prevLabel, height = 250 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id="paceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.38} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="0" />
          <XAxis dataKey="day" {...AXIS} ticks={[1, 5, 10, 15, 20, 25, 30]} />
          <YAxis {...AXIS} tickFormatter={fmtShort} width={52} />
          {budget > 0 && <ReferenceLine y={budget} stroke="#f43f5e" strokeDasharray="6 5" strokeOpacity={0.7} label={{ value: 'Budget ' + fmtShort(budget), position: 'insideTopLeft', fill: '#f43f5e', fontSize: 11, fontWeight: 600 }} />}
          <Tooltip
            cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 3' }}
            content={({ active, payload, label }) => active && payload?.length ? (
              <TipBox title={`Day ${label}`} rows={payload.filter((p) => p.value != null).map((p) => ({ label: p.name, value: fmt(p.value), color: p.color || p.stroke }))} />
            ) : null}
          />
          <Line type="monotone" dataKey="prev" name={prevLabel} stroke="#f59e0b" strokeWidth={2} dot={false} strokeOpacity={0.9} animationDuration={1100} />
          <Area type="monotone" dataKey="cur" name={curLabel} stroke="#6366f1" strokeWidth={3} fill="url(#paceFill)" dot={false} activeDot={{ r: 5, strokeWidth: 3, stroke: 'var(--card-solid)' }} animationDuration={1100} />
          <Line type="monotone" dataKey="proj" name="Projected" stroke="#6366f1" strokeWidth={2.5} strokeDasharray="6 6" dot={false} animationDuration={1400} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Income vs spend bars ---------------- */
export function TrendBars({ data, selected, onPick, height = 260 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 4, left: -6, bottom: 0 }} barGap={6} barCategoryGap="26%">
          <defs>
            <linearGradient id="barInc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#10b981" /></linearGradient>
            <linearGradient id="barSp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#818cf8" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="ym" {...AXIS} tickFormatter={(v) => monthLabel(v, 'short')} />
          <YAxis {...AXIS} tickFormatter={fmtShort} width={52} />
          <Tooltip
            content={({ active, payload, label }) => active && payload?.length ? (
              <TipBox title={monthLabel(label)} rows={[
                { label: 'Income', value: fmt(payload[0].payload.income), color: '#10b981' },
                { label: 'Spent', value: fmt(payload[0].payload.spent), color: '#6366f1' },
                { label: 'Saved', value: fmt(payload[0].payload.saved), valueColor: payload[0].payload.saved < 0 ? '#f43f5e' : '#10b981' },
              ]} />
            ) : null}
          />
          <Bar dataKey="income" name="Income" fill="url(#barInc)" radius={[8, 8, 4, 4]} maxBarSize={30} animationDuration={900} onClick={(d) => onPick && onPick(d.ym)} style={{ cursor: 'pointer' }}>
            {data.map((d) => <Cell key={d.ym} fillOpacity={!selected || d.ym === selected ? 1 : 0.45} />)}
          </Bar>
          <Bar dataKey="spent" name="Spent" fill="url(#barSp)" radius={[8, 8, 4, 4]} maxBarSize={30} animationDuration={900} onClick={(d) => onPick && onPick(d.ym)} style={{ cursor: 'pointer' }}>
            {data.map((d) => <Cell key={d.ym} fillOpacity={!selected || d.ym === selected ? 1 : 0.45} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Savings line ---------------- */
export function SavingsLine({ data, height = 230 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 14, right: 10, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id="savFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10b981" stopOpacity={0.35} /><stop offset="1" stopColor="#10b981" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="ym" {...AXIS} tickFormatter={(v) => monthLabel(v, 'short')} />
          <YAxis {...AXIS} tickFormatter={fmtShort} width={52} />
          <ReferenceLine y={0} stroke="var(--ink-3)" strokeOpacity={0.4} />
          <Tooltip
            cursor={{ stroke: 'var(--ink-3)', strokeDasharray: '3 3' }}
            content={({ active, payload, label }) => active && payload?.length ? (
              <TipBox title={monthLabel(label)} rows={[
                { label: 'Saved', value: fmt(payload[0].payload.saved), valueColor: payload[0].payload.saved < 0 ? '#f43f5e' : '#10b981' },
                { label: 'Savings rate', value: Math.round(payload[0].payload.rate) + '%' },
              ]} />
            ) : null}
          />
          <Area type="monotone" dataKey="saved" stroke="#10b981" strokeWidth={3} fill="url(#savFill)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'var(--card-solid)' }} activeDot={{ r: 6 }} animationDuration={1100} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Weekday bars ---------------- */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function WeekdayBars({ values, height = 220 }) {
  const data = [1, 2, 3, 4, 5, 6, 0].map((i) => ({ d: WD[i], v: values[i] || 0 }));
  const max = Math.max(...data.map((d) => d.v));
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 4, left: -6, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="d" {...AXIS} />
          <YAxis {...AXIS} tickFormatter={fmtShort} width={52} />
          <Tooltip content={({ active, payload }) => active && payload?.length ? <TipBox title={payload[0].payload.d} rows={[{ label: 'Spent', value: fmt(payload[0].value), color: '#8b5cf6' }]} /> : null} />
          <Bar dataKey="v" radius={[10, 10, 4, 4]} maxBarSize={38} animationDuration={900}>
            {data.map((d) => <Cell key={d.d} fill={d.v === max && max > 0 ? '#d946ef' : '#8b5cf6'} fillOpacity={d.v === max ? 1 : 0.55} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Stacked category mix ---------------- */
export function CategoryMix({ data, series, height = 280 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 4, left: -6, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="ym" {...AXIS} tickFormatter={(v) => monthLabel(v, 'short')} />
          <YAxis {...AXIS} tickFormatter={fmtShort} width={52} />
          <Tooltip
            content={({ active, payload, label }) => active && payload?.length ? (
              <TipBox title={monthLabel(label)} rows={payload.slice().reverse().filter((p) => p.value > 0).map((p) => ({ label: p.name, value: fmt(p.value), color: p.color }))} />
            ) : null}
          />
          {series.map((s, i) => (
            <Bar key={s.id} dataKey={s.id} name={s.name} stackId="a" fill={s.color} maxBarSize={44} animationDuration={900}
              radius={i === series.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]} stroke="var(--card-solid)" strokeWidth={1.5} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Small pie ---------------- */
export function MiniPie({ data, height = 180 }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius="90%" stroke="var(--card-solid)" strokeWidth={3} animationDuration={900}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip content={({ active, payload }) => active && payload?.length ? <TipBox rows={[{ label: payload[0].name, value: fmt(payload[0].value), color: payload[0].payload.color }]} /> : null} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
