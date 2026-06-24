"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
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
  FileHeart,
  LayoutDashboard,
  Loader2,
  LogOut,
  PackageCheck,
  Plus,
  Ruler,
  Scale,
  Search,
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

type CustomerOsSummary = {
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    customersWithTrainer: number;
    healthProfiles: number;
    bodyCompositionRecords: number;
    bodyMeasurementRecords: number;
  };
  branches: Array<{ id: string; code: string | null; name: string }>;
  trainers: Array<{ id: string; displayName: string; role: string }>;
  generatedAt: string;
};

type CustomerListItem = {
  id: string;
  customerCode: string | null;
  displayName: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  phone: string | null;
  email: string | null;
  gender: string;
  status: string;
  branch: { id: string; code: string | null; name: string };
  trainer: { id: string; displayName: string } | null;
  hasHealthProfile: boolean;
  bodyCompositionCount: number;
  bodyMeasurementCount: number;
  createdAt: string;
};

type CustomerListResponse = {
  total: number;
  items: CustomerListItem[];
};

type CustomerDetail = {
  customer: CustomerListItem & {
    birthDate: string | null;
    address: string | null;
    occupation: string | null;
    notes: string | null;
    emergencyContact: { name: string | null; phone: string | null; relation: string | null };
  };
  healthProfile: {
    medical_conditions?: string | null;
    injuries?: string | null;
    movement_limitations?: string | null;
    training_cautions?: string | null;
  } | null;
  bodyCompositions: Array<Record<string, string | number | null>>;
  bodyMeasurements: Array<Record<string, string | number | null>>;
  packages: Array<Record<string, string | number | null>>;
};

type AuthState = "checking" | "signed-out" | "ready" | "error";
type ActiveSection = "dashboard" | "customers" | "packages" | "sales" | "training" | "admin";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, status: "live" },
  { key: "customers", label: "Customers", icon: UsersRound, status: "live" },
  { key: "packages", label: "Packages", icon: PackageCheck, status: "soon" },
  { key: "sales", label: "Sales", icon: BadgeDollarSign, status: "soon" },
  { key: "training", label: "Training", icon: Dumbbell, status: "soon" },
  { key: "admin", label: "Admin", icon: ShieldCheck, status: "soon" }
] as const;

const nextModules = [
  {
    title: "Package OS",
    copy: "Sell Membership, PT, PL and Kick Fit in one invoice, then activate customer packages.",
    status: "Phase 4"
  },
  {
    title: "Sales OS",
    copy: "Multi-item invoices, payment tracking, package activation and monthly sales reports.",
    status: "Phase 5"
  },
  {
    title: "Training OS",
    copy: "Trainer assignment, session booking, Google Calendar sync and session logs.",
    status: "Phase 6"
  }
];

const emptyCustomerForm = {
  firstName: "",
  lastName: "",
  nickname: "",
  phone: "",
  email: "",
  gender: "UNSPECIFIED",
  birthDate: "",
  address: "",
  occupation: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  primaryTrainerId: "",
  medicalConditions: "",
  injuries: "",
  movementLimitations: "",
  trainingCautions: "",
  notes: ""
};

const emptyBodyCompositionForm = {
  weightKg: "",
  bodyFatPercent: "",
  skeletalMuscleMassKg: "",
  bmi: "",
  visceralFatLevel: "",
  notes: ""
};

const emptyBodyMeasurementForm = {
  chestCm: "",
  waistCm: "",
  hipCm: "",
  armLeftCm: "",
  armRightCm: "",
  thighLeftCm: "",
  thighRightCm: "",
  notes: ""
};

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

function optionalText(value: string) {
  const clean = value.trim();
  return clean.length ? clean : null;
}

function optionalNumber(value: string) {
  const clean = value.trim();
  if (!clean) return null;
  const numeric = Number(clean);
  return Number.isFinite(numeric) ? numeric : null;
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
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [customerSummary, setCustomerSummary] = useState<CustomerOsSummary | null>(null);
  const [customerList, setCustomerList] = useState<CustomerListResponse>({ total: 0, items: [] });
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);
  const [bodyCompositionForm, setBodyCompositionForm] = useState(emptyBodyCompositionForm);
  const [bodyMeasurementForm, setBodyMeasurementForm] = useState(emptyBodyMeasurementForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingBodyRecord, setSavingBodyRecord] = useState(false);

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

  const loadCustomers = useCallback(async (search = customerSearch) => {
    if (!supabase) return;
    setCustomersLoading(true);
    setCustomerMessage("");

    try {
      const [{ data: summaryData, error: summaryError }, { data: listData, error: listError }] = await Promise.all([
        supabase.rpc("get_customer_os_summary"),
        supabase.rpc("list_customers_for_app", {
          p_search: optionalText(search),
          p_status: null,
          p_limit: 50,
          p_offset: 0
        })
      ]);

      if (summaryError) throw summaryError;
      if (listError) throw listError;

      setCustomerSummary(summaryData as CustomerOsSummary);
      setCustomerList((listData as CustomerListResponse) ?? { total: 0, items: [] });
    } catch (error) {
      setCustomerMessage(error instanceof Error ? error.message : "Could not load customers.");
    } finally {
      setCustomersLoading(false);
    }
  }, [customerSearch]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState("error");
      setErrorMessage("Supabase is not configured.");
      setLoading(false);
      return;
    }

    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (authState === "ready" && activeSection === "customers") {
      void loadCustomers();
    }
  }, [activeSection, authState, loadCustomers]);

  const packageRows = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.packageBreakdown).map(([category, total]) => ({ category, total }));
  }, [summary]);

  const defaultBranchId = customerSummary?.branches[0]?.id ?? summary?.branches[0]?.id ?? "";

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthState("signed-out");
    setSummary(null);
  }

  async function handleCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const branchId = defaultBranchId;
    if (!branchId) {
      setCustomerMessage("No branch is available for customer creation.");
      return;
    }

    setSavingCustomer(true);
    setCustomerMessage("");

    try {
      const { error } = await supabase.rpc("create_customer_for_app", {
        p_branch_id: branchId,
        p_first_name: customerForm.firstName,
        p_last_name: optionalText(customerForm.lastName),
        p_nickname: optionalText(customerForm.nickname),
        p_phone: optionalText(customerForm.phone),
        p_email: optionalText(customerForm.email),
        p_gender: customerForm.gender,
        p_birth_date: optionalText(customerForm.birthDate),
        p_address: optionalText(customerForm.address),
        p_occupation: optionalText(customerForm.occupation),
        p_emergency_contact_name: optionalText(customerForm.emergencyContactName),
        p_emergency_contact_phone: optionalText(customerForm.emergencyContactPhone),
        p_emergency_contact_relation: optionalText(customerForm.emergencyContactRelation),
        p_primary_trainer_id: optionalText(customerForm.primaryTrainerId),
        p_medical_conditions: optionalText(customerForm.medicalConditions),
        p_injuries: optionalText(customerForm.injuries),
        p_movement_limitations: optionalText(customerForm.movementLimitations),
        p_training_cautions: optionalText(customerForm.trainingCautions),
        p_notes: optionalText(customerForm.notes)
      });

      if (error) throw error;

      setCustomerForm(emptyCustomerForm);
      setShowCreateCustomer(false);
      setCustomerMessage("Customer created successfully.");
      await Promise.all([loadDashboard(), loadCustomers("")]);
    } catch (error) {
      setCustomerMessage(error instanceof Error ? error.message : "Could not create customer.");
    } finally {
      setSavingCustomer(false);
    }
  }

  async function openCustomerDetail(customerId: string) {
    if (!supabase) return;
    setCustomerMessage("");

    try {
      const { data, error } = await supabase.rpc("get_customer_detail_for_app", {
        p_customer_id: customerId
      });
      if (error) throw error;
      setSelectedCustomer(data as CustomerDetail);
    } catch (error) {
      setCustomerMessage(error instanceof Error ? error.message : "Could not open customer detail.");
    }
  }

  async function handleAddBodyComposition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedCustomer) return;

    setSavingBodyRecord(true);
    setCustomerMessage("");

    try {
      const { error } = await supabase.rpc("add_customer_body_composition_for_app", {
        p_customer_id: selectedCustomer.customer.id,
        p_weight_kg: optionalNumber(bodyCompositionForm.weightKg),
        p_body_fat_percent: optionalNumber(bodyCompositionForm.bodyFatPercent),
        p_skeletal_muscle_mass_kg: optionalNumber(bodyCompositionForm.skeletalMuscleMassKg),
        p_bmi: optionalNumber(bodyCompositionForm.bmi),
        p_visceral_fat_level: optionalNumber(bodyCompositionForm.visceralFatLevel),
        p_notes: optionalText(bodyCompositionForm.notes)
      });
      if (error) throw error;
      setBodyCompositionForm(emptyBodyCompositionForm);
      await openCustomerDetail(selectedCustomer.customer.id);
      await loadCustomers();
      setCustomerMessage("Body composition record added.");
    } catch (error) {
      setCustomerMessage(error instanceof Error ? error.message : "Could not add body composition record.");
    } finally {
      setSavingBodyRecord(false);
    }
  }

  async function handleAddBodyMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedCustomer) return;

    setSavingBodyRecord(true);
    setCustomerMessage("");

    try {
      const { error } = await supabase.rpc("add_customer_body_measurement_for_app", {
        p_customer_id: selectedCustomer.customer.id,
        p_chest_cm: optionalNumber(bodyMeasurementForm.chestCm),
        p_waist_cm: optionalNumber(bodyMeasurementForm.waistCm),
        p_hip_cm: optionalNumber(bodyMeasurementForm.hipCm),
        p_arm_left_cm: optionalNumber(bodyMeasurementForm.armLeftCm),
        p_arm_right_cm: optionalNumber(bodyMeasurementForm.armRightCm),
        p_thigh_left_cm: optionalNumber(bodyMeasurementForm.thighLeftCm),
        p_thigh_right_cm: optionalNumber(bodyMeasurementForm.thighRightCm),
        p_notes: optionalText(bodyMeasurementForm.notes)
      });
      if (error) throw error;
      setBodyMeasurementForm(emptyBodyMeasurementForm);
      await openCustomerDetail(selectedCustomer.customer.id);
      await loadCustomers();
      setCustomerMessage("Body measurement record added.");
    } catch (error) {
      setCustomerMessage(error instanceof Error ? error.message : "Could not add body measurement record.");
    } finally {
      setSavingBodyRecord(false);
    }
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
            const isActive = activeSection === item.key;
            return (
              <button
                className={isActive ? "nav-item active" : "nav-item"}
                key={item.key}
                onClick={() => setActiveSection(item.key)}
                type="button"
              >
                <Icon size={18} />
                {item.label}
                {item.status === "soon" ? <small>soon</small> : null}
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
        {activeSection === "dashboard" ? (
          <>
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
          </>
        ) : null}

        {activeSection === "customers" ? (
          <section className="customer-os">
            <header className="workspace-header">
              <div>
                <p className="eyebrow">Phase 3</p>
                <h1>Customer OS</h1>
                <p>Customer records, health profile, trainer assignment, body composition and measurement history.</p>
              </div>
              <div className="workspace-header-actions">
                <button className="button" onClick={() => void loadCustomers()} type="button">
                  {customersLoading ? <Loader2 className="spin" size={16} /> : null} Refresh
                </button>
                <button className="button primary" onClick={() => setShowCreateCustomer((value) => !value)} type="button">
                  <Plus size={16} /> New Customer
                </button>
              </div>
            </header>

            <section className="workspace-stat-grid customer-stat-grid">
              <DashboardStatCard icon={UsersRound} title="Total Customers" value={numberFormat(customerSummary?.stats.totalCustomers)} copy="All customer records in scope" />
              <DashboardStatCard icon={UserRound} title="Active" value={numberFormat(customerSummary?.stats.activeCustomers)} copy="Customers currently active" />
              <DashboardStatCard icon={FileHeart} title="Health Profiles" value={numberFormat(customerSummary?.stats.healthProfiles)} copy="Medical notes and cautions" />
              <DashboardStatCard icon={Scale} title="Body Records" value={numberFormat(customerSummary?.stats.bodyCompositionRecords)} copy="Body composition history" />
            </section>

            {customerMessage ? <div className="notice success customer-notice">{customerMessage}</div> : null}

            {showCreateCustomer ? (
              <article className="card customer-form-card">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Create Customer</p>
                    <h2>New customer profile</h2>
                  </div>
                  <span className="badge">Branch: {customerSummary?.branches[0]?.code ?? summary.branches[0]?.code ?? "MAIN"}</span>
                </div>

                <form className="customer-form" onSubmit={handleCreateCustomer}>
                  <label>
                    First name *
                    <input required value={customerForm.firstName} onChange={(event) => setCustomerForm({ ...customerForm, firstName: event.target.value })} />
                  </label>
                  <label>
                    Last name
                    <input value={customerForm.lastName} onChange={(event) => setCustomerForm({ ...customerForm, lastName: event.target.value })} />
                  </label>
                  <label>
                    Nickname
                    <input value={customerForm.nickname} onChange={(event) => setCustomerForm({ ...customerForm, nickname: event.target.value })} />
                  </label>
                  <label>
                    Phone
                    <input value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} />
                  </label>
                  <label>
                    Email
                    <input type="email" value={customerForm.email} onChange={(event) => setCustomerForm({ ...customerForm, email: event.target.value })} />
                  </label>
                  <label>
                    Gender
                    <select value={customerForm.gender} onChange={(event) => setCustomerForm({ ...customerForm, gender: event.target.value })}>
                      <option value="UNSPECIFIED">Unspecified</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label>
                    Birth date
                    <input type="date" value={customerForm.birthDate} onChange={(event) => setCustomerForm({ ...customerForm, birthDate: event.target.value })} />
                  </label>
                  <label>
                    Primary trainer
                    <select value={customerForm.primaryTrainerId} onChange={(event) => setCustomerForm({ ...customerForm, primaryTrainerId: event.target.value })}>
                      <option value="">Unassigned</option>
                      {customerSummary?.trainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>{trainer.displayName} · {trainer.role}</option>
                      ))}
                    </select>
                  </label>
                  <label className="wide-field">
                    Address
                    <textarea value={customerForm.address} onChange={(event) => setCustomerForm({ ...customerForm, address: event.target.value })} />
                  </label>
                  <label>
                    Occupation
                    <input value={customerForm.occupation} onChange={(event) => setCustomerForm({ ...customerForm, occupation: event.target.value })} />
                  </label>
                  <label>
                    Emergency name
                    <input value={customerForm.emergencyContactName} onChange={(event) => setCustomerForm({ ...customerForm, emergencyContactName: event.target.value })} />
                  </label>
                  <label>
                    Emergency phone
                    <input value={customerForm.emergencyContactPhone} onChange={(event) => setCustomerForm({ ...customerForm, emergencyContactPhone: event.target.value })} />
                  </label>
                  <label>
                    Relation
                    <input value={customerForm.emergencyContactRelation} onChange={(event) => setCustomerForm({ ...customerForm, emergencyContactRelation: event.target.value })} />
                  </label>
                  <label className="wide-field">
                    Medical conditions
                    <textarea value={customerForm.medicalConditions} onChange={(event) => setCustomerForm({ ...customerForm, medicalConditions: event.target.value })} />
                  </label>
                  <label className="wide-field">
                    Injuries / limitations
                    <textarea value={customerForm.injuries} onChange={(event) => setCustomerForm({ ...customerForm, injuries: event.target.value })} />
                  </label>
                  <label className="wide-field">
                    Movement limitations
                    <textarea value={customerForm.movementLimitations} onChange={(event) => setCustomerForm({ ...customerForm, movementLimitations: event.target.value })} />
                  </label>
                  <label className="wide-field">
                    Training cautions
                    <textarea value={customerForm.trainingCautions} onChange={(event) => setCustomerForm({ ...customerForm, trainingCautions: event.target.value })} />
                  </label>
                  <label className="wide-field">
                    Notes
                    <textarea value={customerForm.notes} onChange={(event) => setCustomerForm({ ...customerForm, notes: event.target.value })} />
                  </label>

                  <div className="form-actions wide-field">
                    <button className="button primary" disabled={savingCustomer} type="submit">
                      {savingCustomer ? <Loader2 className="spin" size={16} /> : null} Save customer
                    </button>
                    <button className="button" onClick={() => setShowCreateCustomer(false)} type="button">Cancel</button>
                  </div>
                </form>
              </article>
            ) : null}

            <section className="customer-grid">
              <article className="card customer-list-card">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Customer List</p>
                    <h2>{numberFormat(customerList.total)} customers</h2>
                  </div>
                </div>

                <form className="search-row" onSubmit={(event) => { event.preventDefault(); void loadCustomers(customerSearch); }}>
                  <Search size={18} />
                  <input placeholder="Search by name, phone, email or code" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} />
                  <button className="button" type="submit">Search</button>
                </form>

                <div className="customer-list">
                  {customersLoading ? (
                    <div className="empty-inline"><Loader2 className="spin" size={20} /> Loading customers...</div>
                  ) : null}

                  {!customersLoading && customerList.items.length === 0 ? (
                    <div className="empty-inline">No customers yet. Create the first real customer profile.</div>
                  ) : null}

                  {customerList.items.map((customer) => (
                    <button className="customer-row" key={customer.id} onClick={() => void openCustomerDetail(customer.id)} type="button">
                      <div>
                        <strong>{customer.displayName}</strong>
                        <span>{customer.customerCode ?? "No code"} · {customer.phone ?? "No phone"}</span>
                        <small>{customer.branch.code ?? "MAIN"} · Trainer: {customer.trainer?.displayName ?? "Unassigned"}</small>
                      </div>
                      <div className="customer-row-meta">
                        <span className="status-pill">{customer.status}</span>
                        <small>{customer.bodyCompositionCount} body · {customer.bodyMeasurementCount} size</small>
                      </div>
                    </button>
                  ))}
                </div>
              </article>

              <article className="card customer-detail-card">
                {selectedCustomer ? (
                  <>
                    <div className="panel-header">
                      <div>
                        <p className="eyebrow">Customer Detail</p>
                        <h2>{selectedCustomer.customer.displayName}</h2>
                        <p className="muted-text compact-text">{selectedCustomer.customer.customerCode ?? "No code"} · {selectedCustomer.customer.branch.name}</p>
                      </div>
                      <span className="badge">{selectedCustomer.customer.status}</span>
                    </div>

                    <div className="detail-grid">
                      <div><span>Phone</span><strong>{selectedCustomer.customer.phone ?? "-"}</strong></div>
                      <div><span>Email</span><strong>{selectedCustomer.customer.email ?? "-"}</strong></div>
                      <div><span>Trainer</span><strong>{selectedCustomer.customer.trainer?.displayName ?? "Unassigned"}</strong></div>
                      <div><span>Emergency</span><strong>{selectedCustomer.customer.emergencyContact?.phone ?? "-"}</strong></div>
                    </div>

                    <div className="health-box">
                      <p className="eyebrow">Health Profile</p>
                      <p><strong>Medical:</strong> {selectedCustomer.healthProfile?.medical_conditions ?? "-"}</p>
                      <p><strong>Injuries:</strong> {selectedCustomer.healthProfile?.injuries ?? "-"}</p>
                      <p><strong>Limitations:</strong> {selectedCustomer.healthProfile?.movement_limitations ?? "-"}</p>
                      <p><strong>Cautions:</strong> {selectedCustomer.healthProfile?.training_cautions ?? "-"}</p>
                    </div>

                    <div className="record-forms">
                      <form className="mini-form" onSubmit={handleAddBodyComposition}>
                        <div className="mini-form-title"><Scale size={18} /> Body Composition</div>
                        <input placeholder="Weight kg" value={bodyCompositionForm.weightKg} onChange={(event) => setBodyCompositionForm({ ...bodyCompositionForm, weightKg: event.target.value })} />
                        <input placeholder="Body fat %" value={bodyCompositionForm.bodyFatPercent} onChange={(event) => setBodyCompositionForm({ ...bodyCompositionForm, bodyFatPercent: event.target.value })} />
                        <input placeholder="Muscle kg" value={bodyCompositionForm.skeletalMuscleMassKg} onChange={(event) => setBodyCompositionForm({ ...bodyCompositionForm, skeletalMuscleMassKg: event.target.value })} />
                        <input placeholder="BMI" value={bodyCompositionForm.bmi} onChange={(event) => setBodyCompositionForm({ ...bodyCompositionForm, bmi: event.target.value })} />
                        <input placeholder="Visceral fat" value={bodyCompositionForm.visceralFatLevel} onChange={(event) => setBodyCompositionForm({ ...bodyCompositionForm, visceralFatLevel: event.target.value })} />
                        <button className="button primary" disabled={savingBodyRecord} type="submit">Add body record</button>
                      </form>

                      <form className="mini-form" onSubmit={handleAddBodyMeasurement}>
                        <div className="mini-form-title"><Ruler size={18} /> Body Measurement</div>
                        <input placeholder="Chest cm" value={bodyMeasurementForm.chestCm} onChange={(event) => setBodyMeasurementForm({ ...bodyMeasurementForm, chestCm: event.target.value })} />
                        <input placeholder="Waist cm" value={bodyMeasurementForm.waistCm} onChange={(event) => setBodyMeasurementForm({ ...bodyMeasurementForm, waistCm: event.target.value })} />
                        <input placeholder="Hip cm" value={bodyMeasurementForm.hipCm} onChange={(event) => setBodyMeasurementForm({ ...bodyMeasurementForm, hipCm: event.target.value })} />
                        <input placeholder="Left arm cm" value={bodyMeasurementForm.armLeftCm} onChange={(event) => setBodyMeasurementForm({ ...bodyMeasurementForm, armLeftCm: event.target.value })} />
                        <input placeholder="Left thigh cm" value={bodyMeasurementForm.thighLeftCm} onChange={(event) => setBodyMeasurementForm({ ...bodyMeasurementForm, thighLeftCm: event.target.value })} />
                        <button className="button primary" disabled={savingBodyRecord} type="submit">Add size record</button>
                      </form>
                    </div>

                    <div className="history-grid">
                      <div>
                        <h3>Body Composition History</h3>
                        {selectedCustomer.bodyCompositions.length === 0 ? <p className="muted-text">No body composition records yet.</p> : null}
                        {selectedCustomer.bodyCompositions.slice(0, 5).map((record) => (
                          <div className="history-row" key={String(record.id)}>
                            <span>{readableTime(String(record.measured_at))}</span>
                            <strong>{record.weight_kg ?? "-"} kg · {record.body_fat_percent ?? "-"}% fat</strong>
                          </div>
                        ))}
                      </div>
                      <div>
                        <h3>Body Measurement History</h3>
                        {selectedCustomer.bodyMeasurements.length === 0 ? <p className="muted-text">No measurement records yet.</p> : null}
                        {selectedCustomer.bodyMeasurements.slice(0, 5).map((record) => (
                          <div className="history-row" key={String(record.id)}>
                            <span>{readableTime(String(record.measured_at))}</span>
                            <strong>Waist {record.waist_cm ?? "-"} · Hip {record.hip_cm ?? "-"}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="empty-inline detail-empty">
                    <UsersRound size={36} />
                    <strong>Select a customer</strong>
                    <span>Open a customer to view health profile, body history and packages.</span>
                  </div>
                )}
              </article>
            </section>
          </section>
        ) : null}

        {activeSection !== "dashboard" && activeSection !== "customers" ? (
          <section className="card empty-state-card module-placeholder">
            <p className="eyebrow">Coming Soon</p>
            <h1>{navItems.find((item) => item.key === activeSection)?.label} OS</h1>
            <p className="muted-text">This module will be built after Customer OS is verified with real data.</p>
            <button className="button primary" onClick={() => setActiveSection("customers")} type="button">Back to Customer OS</button>
          </section>
        ) : null}
      </section>
    </main>
  );
}
