"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, KeyRound, Loader2, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

type AppUser = {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
};

function getFriendlyName(user: User | null, fallbackEmail: string, displayName: string) {
  if (displayName.trim()) return displayName.trim();
  const metadataName = user?.user_metadata?.display_name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  const email = user?.email ?? fallbackEmail;
  return email ? email.split("@")[0] : "Owner";
}

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("Master");
  const [phone, setPhone] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const ownerReady = appUser?.role === "OWNER";

  const authEmail = useMemo(() => user?.email ?? email, [user?.email, email]);

  async function loadAppUser() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("app_users")
      .select("id, display_name, email, phone, role, is_active")
      .limit(1)
      .maybeSingle();

    if (error) {
      setAppUser(null);
      return;
    }

    setAppUser(data as AppUser | null);
  }

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data.session?.user ?? null;
      setUser(currentUser);
      if (currentUser) void loadAppUser();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        void loadAppUser();
      } else {
        setAppUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!supabase) throw new Error("Supabase environment variables are missing.");
      if (!email.trim()) throw new Error("Please enter your email.");
      if (password.length < 6) throw new Error("Password must be at least 6 characters.");

      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
            data: {
              display_name: getFriendlyName(user, email, displayName),
              phone: phone.trim() || null
            }
          }
        });

        if (error) throw error;

        setUser(data.user ?? null);

        if (data.session) {
          setMessage("Account created and signed in. You can now bootstrap OWNER.");
          await loadAppUser();
        } else {
          setMessage("Account created. If email confirmation is enabled, please confirm your email, then sign in again.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (error) throw error;

        setUser(data.user ?? null);
        setMessage("Signed in successfully.");
        await loadAppUser();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleBootstrapOwner() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!supabase) throw new Error("Supabase environment variables are missing.");
      if (!user) throw new Error("Please sign in before bootstrapping OWNER.");

      const ownerName = getFriendlyName(user, authEmail, displayName);
      const { error } = await supabase.rpc("bootstrap_current_user_as_owner", {
        p_display_name: ownerName,
        p_email: authEmail || null,
        p_phone: phone.trim() || null,
        p_branch_code: "MAIN"
      });

      if (error) throw error;

      await loadAppUser();
      setMessage("OWNER bootstrap completed. This account now controls Iron Gym OS V2.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Owner bootstrap failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      if (!supabase) throw new Error("Supabase environment variables are missing.");
      await supabase.auth.signOut();
      setUser(null);
      setAppUser(null);
      setMessage("Signed out.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sign out failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="card auth-card">
        <h2>Supabase is not configured</h2>
        <p className="muted-text">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Environment Variables.
        </p>
      </section>
    );
  }

  return (
    <section className="auth-grid">
      <div className="card auth-card">
        <div className="section-heading">
          <span className="icon-badge"><KeyRound size={18} /></span>
          <div>
            <p className="eyebrow">Phase 1</p>
            <h2>Login + Bootstrap OWNER</h2>
          </div>
        </div>

        <div className="auth-toggle" aria-label="Authentication mode">
          <button className={mode === "sign-in" ? "active" : ""} onClick={() => setMode("sign-in")} type="button">
            Sign in
          </button>
          <button className={mode === "sign-up" ? "active" : ""} onClick={() => setMode("sign-up")} type="button">
            Create owner account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleAuthSubmit}>
          {mode === "sign-up" && (
            <>
              <label>
                Display name
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Master" />
              </label>
              <label>
                Phone optional
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="08x-xxx-xxxx" />
              </label>
            </>
          )}

          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@example.com" type="email" />
          </label>

          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" type="password" />
          </label>

          <button className="button primary full-width" disabled={loading} type="submit">
            {loading ? <Loader2 className="spin" size={16} /> : null}
            {mode === "sign-up" ? "Create account" : "Sign in"}
          </button>
        </form>

        {message ? <p className="notice success">{message}</p> : null}
        {errorMessage ? <p className="notice error">{errorMessage}</p> : null}
      </div>

      <aside className="card auth-card">
        <div className="section-heading">
          <span className="icon-badge"><ShieldCheck size={18} /></span>
          <div>
            <p className="eyebrow">Current Session</p>
            <h2>Owner Status</h2>
          </div>
        </div>

        <div className="status-list">
          <div className="status-row">
            <span className="status-label"><UserRound size={16} /> Auth user</span>
            <span className={user ? "status-value ok" : "status-value wait"}>{user ? "Signed in" : "Not signed in"}</span>
          </div>
          <div className="status-row">
            <span className="status-label"><ShieldCheck size={16} /> App role</span>
            <span className={ownerReady ? "status-value ok" : "status-value wait"}>{appUser?.role ?? "Not bootstrapped"}</span>
          </div>
          <div className="status-row">
            <span className="status-label"><CheckCircle2 size={16} /> Branch</span>
            <span className="status-value ok">MAIN</span>
          </div>
        </div>

        {user ? (
          <div className="account-box">
            <p className="muted-text">Signed in as</p>
            <strong>{user.email}</strong>
            {appUser ? (
              <p className="muted-text">Profile: {appUser.display_name} · {appUser.role}</p>
            ) : (
              <p className="muted-text">No app profile yet. Press bootstrap to create OWNER.</p>
            )}
          </div>
        ) : (
          <p className="muted-text">Sign in or create the first account, then bootstrap it as OWNER.</p>
        )}

        <div className="actions stacked-actions">
          <button className="button primary full-width" disabled={!user || loading || ownerReady} onClick={handleBootstrapOwner} type="button">
            {loading ? <Loader2 className="spin" size={16} /> : null}
            {ownerReady ? "OWNER ready" : "Bootstrap this account as OWNER"}
          </button>
          {user ? (
            <button className="button full-width" disabled={loading} onClick={handleSignOut} type="button">
              <LogOut size={16} /> Sign out
            </button>
          ) : null}
        </div>
      </aside>
    </section>
  );
}
