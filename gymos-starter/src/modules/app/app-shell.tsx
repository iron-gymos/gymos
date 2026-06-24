"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Building2,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Loader2,
  LogOut,
  PackageCheck,
  ShieldCheck,
  UserRound,
  UsersRound
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type DashboardSummary = {
  profile: {
    id: string;
    displayName: string;
    role: string;
    isGlobal: boolean;
  };
  stats: {
    branches: number;
    staff: number;
    customers: number;
    packageProducts: number;
    activePackages: number;
    trainingPrograms: number;
    monthlySales: number;
    monthlySessions: number;
  };
  branches: Array<{
    id: string;
    code: string | null;
    name: string;
    timezone: string;
    isActive: boolean;
  }>;
  packageBreakdown: Record<string, number>;
  generatedAt: string;
};

type AuthState = "checking" | "signed-out" | "ready" | "error";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Customers", icon: UsersRound, active: false },
  { label: "Packages", icon: PackageCheck, active: false },
  { label: "Sales", icon: BadgeDollarSign, active: false },
  { label: "Training", icon: Dumbbell, active: false },
  { label: "Admin", icon: ShieldCheck, active: false }
];

const nextModules = [
  {
    title: "Customer OS",
    copy: "Customer profile, health profile, body composition and measurement history.",
    status: "Phase 3"
  },
  {
    title: "Sales OS",
    copy: "Multi-item invoices, payment tracking, package activation and monthly sales reports.",
    status: "Phase 4"
  },
  {
    title: "Training OS",
    copy: "Trainer assignment, session booking, Google Calendar sync and session logs.",
    status: "Phase 5"
  }
];

function numberFormat(value: number | null | undefined) {
  return new Intl.NumberFormat("th-TH").format(Number(value ?? 0));
}

function currencyFormat(value: number | null | undefined) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0
  }).format(Number(value ?? 0));
}

function readableTime(value?: string) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function DashboardStatCard({
  title,
  value,
  copy,
  icon: Icon
}: {
  title: string;
  value: string;
  copy: string;
  icon: typeof LayoutDashboard;
}) {
  return (
    <article className="workspace-stat-card">
      <div className="stat-icon"><Icon size={18} /></div>
      <p>{title}</p>
      <strong>{value}</strong>
      <span>{copy}</span>
    </article>
  );
}

export function AppShell() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      if (!supabase) throw new Error("Supabase environment variables are missing.");

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setAuthState("signed-out");
        setSummary(null);
        return;
      }

      const { data, error } = await supabase.rpc("get_app_dashboard_summary");
      if (error) throw error;

      setSummary(data as DashboardSummary);
      setAuthState("ready");
    } catch (error) {
      setAuthState("error");
      setErrorMessage(error instanceof Error ? error.message : "Could not load dashboard summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState("error");
      setErrorMessage("Supabase is not configured.");
      setLoading(false);
      return;
    }

    void loadDashboard();
  }, [loadDashboard]);

  const packageRows = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.packageBreakdown).map(([category, total]) => ({ category, total }));
  }, [summary]);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthState("signed-out");
    setSummary(null);
  }

  if (authState === "checking" || loading) {
    return (
      <main className="workspace-loading">
        <Loader2 className="spin" size={28} />
        <p>Loading Iron Gym OS workspace...</p>
      </main>
    );
  }

  if (authState === "signed-out") {
    return (
      <main className="page-shell compact-shell">
        <section className="card empty-state-card">
          <ShieldCheck size={42} />
          <p className="eyebrow">Secure Workspace</p>
          <h1>Please sign in first</h1>
          <p className="muted-text">The Iron Gym OS back office is available after OWNER login.</p>
          <Link className="button primary" href="/login">Go to login</Link>
        </section>
      </main>
    );
  }

  if (authState === "error" || !summary) {
    return (
      <main className="page-shell compact-shell">
        <section className="card empty-state-card">
          <Activity size={42} />
          <p className="eyebrow">Dashboard Error</p>
          <h1>Workspace is not ready</h1>
          <p className="muted-text">{errorMessage || "Could not load dashboard summary."}</p>
          <div className="actions centered-actions">
            <button className="button primary" onClick={() => void loadDashboard()} type="button">Retry</button>
            <Link className="button" href="/login">Back to login</Link>
          </div>
        </section>
      </main>
    );
  }

  const stats = summary.stats;

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/">
          <div className="logo">IG</div>
          <div>
            <strong>Iron Gym OS</strong>
            <span>V2 Workspace</span>
          </div>
        </Link>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className={item.active ? "nav-item active" : "nav-item"} key={item.label} type="button">
                <Icon size={18} />
                {item.label}
                {!item.active ? <small>soon</small> : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-profile">
          <p className="eyebrow">Signed in</p>
          <strong>{summary.profile.displayName}</strong>
          <span>{summary.profile.role}</span>
          <button className="button full-width" onClick={handleSignOut} type="button">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <section className="app-main">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Phase 2</p>
            <h1>Real Dashboard</h1>
            <p>Live Supabase summary for Iron Gym OS V2. Generated {readableTime(summary.generatedAt)}.</p>
          </div>
          <div className="workspace-header-actions">
            <Link className="button" href="/login">Owner status</Link>
            <button className="button primary" onClick={() => void loadDashboard()} type="button">
              Refresh data
            </button>
          </div>
        </header>

        <section className="workspace-stat-grid">
          <DashboardStatCard icon={Building2} title="Branches" value={numberFormat(stats.branches)} copy="Active branches in scope" />
          <DashboardStatCard icon={UsersRound} title="Customers" value={numberFormat(stats.customers)} copy="Active customer records" />
          <DashboardStatCard icon={Boxes} title="Active Packages" value={numberFormat(stats.activePackages)} copy="Purchased packages currently active" />
          <DashboardStatCard icon={BadgeDollarSign} title="Monthly Sales" value={currencyFormat(stats.monthlySales)} copy="Issued sales this month" />
          <DashboardStatCard icon={CalendarCheck} title="Sessions" value={numberFormat(stats.monthlySessions)} copy="Training sessions this month" />
          <DashboardStatCard icon={ClipboardList} title="Package Products" value={numberFormat(stats.packageProducts)} copy="Membership, PT, PL and Kick Fit" />
          <DashboardStatCard icon={Dumbbell} title="Programs" value={numberFormat(stats.trainingPrograms)} copy="Training program templates" />
          <DashboardStatCard icon={UserRound} title="Staff" value={numberFormat(stats.staff)} copy="Active staff linked to branches" />
        </section>

        <section className="workspace-panels">
          <article className="card workspace-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Branch Scope</p>
                <h2>Branches</h2>
              </div>
              <span className="badge">{summary.profile.isGlobal ? "Global access" : "Branch access"}</span>
            </div>

            <div className="table-like">
              {summary.branches.map((branch) => (
                <div className="table-row" key={branch.id}>
                  <div>
                    <strong>{branch.name}</strong>
                    <span>{branch.code ?? "NO-CODE"} · {branch.timezone}</span>
                  </div>
                  <span className="status-value ok">Active</span>
                </div>
              ))}
            </div>
          </article>

          <article className="card workspace-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Package Setup</p>
                <h2>Product Breakdown</h2>
              </div>
              <BarChart3 size={22} />
            </div>

            <div className="progress-list">
              {packageRows.map((row) => (
                <div className="progress-row" key={row.category}>
                  <span>{row.category.replaceAll("_", " ")}</span>
                  <strong>{row.total}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="workspace-modules">
          {nextModules.map((module) => (
            <article className="card module-card" key={module.title}>
              <span className="badge">{module.status}</span>
              <h3>{module.title}</h3>
              <p>{module.copy}</p>
              <button className="module-link" type="button">
                Coming next <ChevronRight size={16} />
              </button>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
