import { Dumbbell, ShieldCheck, Database, Rocket } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { dashboardStats, modules } from "@/modules/dashboard/dashboard-data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const hasSupabaseKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo">IG</div>
          <div>
            <h1>Iron Gym OS V2</h1>
            <p>Next.js + Supabase gym management system</p>
          </div>
        </div>
        <div className="badge">V2 Core Build</div>
      </header>

      <section className="hero">
        <div className="card">
          <p className="badge" style={{ display: "inline-flex", margin: "0 0 18px" }}>
            <Rocket size={16} />&nbsp; Deployment Ready Starter
          </p>
          <h2 className="hero-title">
            Run your gym like an <span>operating system.</span>
          </h2>
          <p className="hero-copy">
            Iron Gym OS V2 is being rebuilt from a clean Supabase core schema. This starter page proves the web app, GitHub repo and Vercel deployment are connected. Next step is login, OWNER bootstrap, customer, sales and trainer workflows.
          </p>
          <div className="actions">
            <a className="button primary" href="/login">Login / Bootstrap OWNER</a>
            <a className="button" href="#status">View system status</a>
            <a className="button" href="https://github.com/iron-gymos/gymos" target="_blank" rel="noreferrer">Open GitHub repo</a>
          </div>
        </div>

        <aside className="card" id="status">
          <h2 style={{ marginTop: 0 }}>System Status</h2>
          <div className="status-list">
            <div className="status-row">
              <span className="status-label"><Database size={16} /> Supabase URL</span>
              <span className={supabaseUrl ? "status-value ok" : "status-value wait"}>{supabaseUrl ? "Configured" : "Missing"}</span>
            </div>
            <div className="status-row">
              <span className="status-label"><ShieldCheck size={16} /> Supabase anon key</span>
              <span className={hasSupabaseKey ? "status-value ok" : "status-value wait"}>{hasSupabaseKey ? "Configured" : "Missing"}</span>
            </div>
            <div className="status-row">
              <span className="status-label"><Dumbbell size={16} /> Database schema</span>
              <span className="status-value ok">Migration 001-002</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid" aria-label="Core database status">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="modules" aria-label="Iron Gym OS modules">
        {modules.map((module) => (
          <article className="card module" key={module.title}>
            <h3>{module.title}</h3>
            <p>{module.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
