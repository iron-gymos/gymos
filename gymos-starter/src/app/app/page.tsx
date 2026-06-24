import Link from "next/link";
import { AuthPanel } from "@/modules/auth/auth-panel";

export default function AppPage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo">IG</div>
          <div>
            <h1>Iron Gym OS V2 App</h1>
            <p>Secure workspace starts after OWNER bootstrap</p>
          </div>
        </div>
        <Link className="badge" href="/">Dashboard preview</Link>
      </header>

      <AuthPanel />
    </main>
  );
}
