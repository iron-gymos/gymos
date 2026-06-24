import Link from "next/link";
import { AuthPanel } from "@/modules/auth/auth-panel";

export default function LoginPage() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo">IG</div>
          <div>
            <h1>Iron Gym OS V2</h1>
            <p>Owner login and first account bootstrap</p>
          </div>
        </div>
        <Link className="badge" href="/">Back to system status</Link>
      </header>

      <AuthPanel />
    </main>
  );
}
