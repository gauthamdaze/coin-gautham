import { useEffect } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  LineChart,
  Upload,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useData, useEngine, useUI } from "./lib/store";
import {
  cx,
  greeting,
  isLive,
  monthLabel,
  addMonths,
  TODAY,
  dim,
} from "./lib/format";
import { Confirm, Toasts, spring } from "./components/ui";
import { Blobs } from "./components/Illustrations";
import Home from "./pages/Home";
import Activity from "./pages/Activity";
import Budgets from "./pages/Budgets";
import Insights from "./pages/Insights";
import ImportPage from "./pages/Import";

const NAV = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "activity", label: "Activity", icon: ReceiptText },
  { id: "budgets", label: "Budgets", icon: PieChart },
  { id: "insights", label: "Insights", icon: LineChart },
  { id: "import", label: "Import", icon: Upload },
];
const TITLES = {
  home: null,
  activity: "Activity",
  budgets: "Budgets",
  insights: "Insights",
  import: "Import & accounts",
};

function useHashTab() {
  const tab = useUI((s) => s.tab),
    setTab = useUI((s) => s.setTab);
  useEffect(() => {
    const read = () => {
      const h = location.hash.slice(1);
      if (NAV.some((n) => n.id === h)) setTab(h);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [setTab]);
  useEffect(() => {
    if (location.hash.slice(1) !== tab) {
      try {
        history.replaceState(null, "", "#" + tab);
      } catch {
        /* sandboxed */
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tab]);
  return [tab, setTab];
}

function MonthPicker() {
  const month = useUI((s) => s.month),
    setMonth = useUI((s) => s.setMonth);
  const eng = useEngine();
  const [lo, hi] = eng.dataRange();
  const go = (d) => {
    const m = addMonths(month, d);
    if (m >= lo && m <= hi) setMonth(m);
  };
  return (
    <div className="glass flex items-center rounded-full p-1 shadow-soft">
      <button
        className="btn-ghost !rounded-full !p-2"
        onClick={() => go(-1)}
        disabled={month <= lo}
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="min-w-[132px] text-center leading-tight">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={month}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={spring}
          >
            <div className="text-[14px] font-bold">{monthLabel(month)}</div>
            <div className="t-3 text-[11px] font-medium">
              {isLive(month)
                ? `Day ${TODAY.getDate()} of ${dim(month)}`
                : "Full month"}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <button
        className="btn-ghost !rounded-full !p-2"
        onClick={() => go(1)}
        disabled={month >= hi}
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

function AccountPicker() {
  const accounts = useData((s) => s.accounts);
  const account = useUI((s) => s.account),
    setAccount = useUI((s) => s.setAccount);
  return (
    <div className="glass relative flex items-center rounded-full pl-3.5 pr-1 shadow-soft">
      <Wallet size={16} className="t-3" />
      <select
        value={accounts.some((a) => a.id === account) ? account : "all"}
        onChange={(e) => setAccount(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent py-2.5 pl-2 pr-7 text-[13.5px] font-semibold outline-none"
        aria-label="Account"
      >
        <option value="all">All accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <ChevronRight
        size={14}
        className="t-3 pointer-events-none absolute right-3 rotate-90"
      />
    </div>
  );
}

function Sidebar({ tab, setTab, unc }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col p-4 lg:flex">
      <div className="glass flex h-full flex-col rounded-[28px] p-4 shadow-soft">
        <div className="mb-8 flex items-center gap-3 px-2 pt-2">
          <img
            src="./favicon.svg"
            alt=""
            className="h-10 w-10 rounded-2xl shadow-glow"
          />
          <div>
            <div className="font-display text-lg font-extrabold tracking-tight">
              Aishoo-Dashboard -coins
            </div>
            <div className="t-3 text-xs">Personal finance</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={cx(
                  "relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[14.5px] font-semibold transition-colors",
                  active
                    ? "text-white"
                    : "t-2 hover:bg-black/[.03] dark:hover:bg-white/[.04]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="side-active"
                    className="absolute inset-0 -z-0 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 shadow-glow"
                    transition={spring}
                  />
                )}
                <n.icon size={19} className="relative" />
                <span className="relative">{n.label}</span>
                {n.id === "activity" && unc > 0 && (
                  <span
                    className={cx(
                      "relative ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold",
                      active
                        ? "bg-white/25 text-white"
                        : "bg-rose-500 text-white",
                    )}
                  >
                    {unc}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-4 text-white">
          <Sparkles size={18} />
          <div className="mt-2 text-sm font-bold">Auto-sync coming</div>
          <p className="mt-1 text-xs text-white/80">
            Bank e-mails, SMS alerts and Account Aggregator API.
          </p>
          <button
            onClick={() => setTab("import")}
            className="mt-3 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/30"
          >
            Import a statement
          </button>
        </div>
      </div>
    </aside>
  );
}

function TabBar({ tab, setTab, unc }) {
  return (
    <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 px-2 pt-1.5 lg:hidden">
      <div className="mx-auto flex max-w-md justify-between">
        {NAV.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5"
              aria-label={n.label}
            >
              <motion.span
                animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                transition={spring}
                className={cx(
                  "relative grid h-8 w-12 place-items-center rounded-full",
                  active ? "text-indigo-600 dark:text-indigo-300" : "t-3",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute inset-0 rounded-full bg-indigo-500/12"
                    transition={spring}
                  />
                )}
                <n.icon
                  size={21}
                  strokeWidth={active ? 2.4 : 2}
                  className="relative"
                />
                {n.id === "activity" && unc > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-[18px] text-white">
                    {unc > 99 ? "99+" : unc}
                  </span>
                )}
              </motion.span>
              <span
                className={cx(
                  "text-[10.5px] font-semibold",
                  active ? "text-indigo-600 dark:text-indigo-300" : "t-3",
                )}
              >
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function App() {
  const [tab, setTab] = useHashTab();
  const tx = useData((s) => s.tx),
    cats = useData((s) => s.cats);
  const sample = useData((s) => s.sample);
  const month = useUI((s) => s.month);
  const confirmState = useUI((s) => s.confirmState),
    closeAsk = useUI((s) => s.closeAsk);
  const unc = tx.filter(
    (t) => !t.cat || !cats.some((c) => c.id === t.cat),
  ).length;
  const Page =
    {
      home: Home,
      activity: Activity,
      budgets: Budgets,
      insights: Insights,
      import: ImportPage,
    }[tab] || Home;

  return (
    <MotionConfig reducedMotion="user">
      <Blobs />
      <Sidebar tab={tab} setTab={setTab} unc={unc} />
      <div className="lg:pl-64">
        <header className="safe-top relative z-20">
          <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-4 pb-3 pt-4 sm:px-6 lg:px-8 lg:pt-6">
            <div className="flex items-center gap-3">
              <img
                src="./favicon.svg"
                alt=""
                className="h-9 w-9 rounded-xl lg:hidden"
              />
              <div>
                <p className="t-3 text-[13px] font-semibold">
                  {TITLES[tab]
                    ? monthLabel(month)
                    : TODAY.toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                </p>
                <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">
                  {TITLES[tab] || `${greeting()} 👋`}
                </h1>
              </div>
            </div>
            {tab !== "import" && (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <MonthPicker />
                <AccountPicker />
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-32 sm:px-6 lg:px-8 lg:pb-12">
          <AnimatePresence>
            {sample && tab !== "import" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-indigo-500/15 bg-indigo-500/[.07] px-4 py-3 text-[13.5px]">
                  <Sparkles size={18} className="text-indigo-500" />
                  <span className="flex-1">
                    <b>Sample data.</b>{" "}
                    <span className="t-2">
                      Import your debit &amp; credit-card statements to see your
                      real numbers.
                    </span>
                  </span>
                  <button
                    className="btn-primary !py-1.5 !text-[13px]"
                    onClick={() => setTab("import")}
                  >
                    Import
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <Page />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <TabBar tab={tab} setTab={setTab} unc={unc} />
      <Confirm state={confirmState} onClose={closeAsk} />
      <Toasts />
    </MotionConfig>
  );
}
