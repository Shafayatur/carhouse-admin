"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
type Vehicle = {
  id: string; make: string; model: string; year: number; color: string;
  vin: string; chassis_no: string; origin: string; port: string;
  purchase_price: number; selling_price: number; status: string;
  condition: string; mileage: number; engine_cc: number;
  transmission: string; fuel_type: string; import_date: string;
  customs_duty: number; shipping_cost: number; featured: boolean;
};
type Customer = {
  id: string; name: string; phone: string; email: string;
  address: string; nid: string; type: string; status: string; notes: string; join_date: string;
};
type Sale = {
  id: string; car_id: string; customer_id: string; sale_date: string;
  sale_price: number; down_payment: number; payment_method: string;
  status: string; salesperson: string; discount: number; notes: string;
};
type Shipment = {
  id: string; origin: string; destination: string; vessel: string;
  bl_number: string; etd: string; eta: string; status: string; agent: string; freight: number;
};
type Staff = {
  id: string; name: string; role: string; department: string;
  email: string; phone: string; salary: number; status: string; join_date: string;
};
type Expense = {
  id: number; category: string; amount: number; date: string;
  description: string; reference: string; paid_to: string;
};
type Enquiry = {
  id: number; name: string; phone: string; email: string;
  vehicle_id: string; message: string; type: string; status: string; created_at: string;
};

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS — injected once
══════════════════════════════════════════════════════════════ */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* Backgrounds — layered greys, NOT pure black */
    --bg-base:    #0f1117;
    --bg-surface: #161b25;
    --bg-raised:  #1e2535;
    --bg-overlay: #252d40;
    --bg-hover:   #2a3347;

    /* Borders */
    --border-subtle: rgba(255,255,255,0.08);
    --border-default: rgba(255,255,255,0.14);
    --border-strong: rgba(255,255,255,0.24);
    --border-focus: rgba(201,168,76,0.7);

    /* Text — clear hierarchy */
    --text-primary:   #f0f2f7;
    --text-secondary: #9ba3b8;
    --text-tertiary:  #6b7590;
    --text-muted:     #4a5268;

    /* Gold accent */
    --gold:  #c9a84c;
    --gold2: #e8c96b;

    /* Status */
    --green: #34c97a;
    --amber: #f0a030;
    --blue:  #5b9cf6;
    --red:   #e05252;

    --font: 'DM Sans', system-ui, sans-serif;
    --font-mono: 'DM Mono', monospace;
    --radius: 8px;
    --radius-sm: 4px;
  }

  html, body { height: 100%; }
  body {
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font);
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  ::selection { background: rgba(201,168,76,0.3); color: var(--text-primary); }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: var(--bg-base); }
  ::-webkit-scrollbar-thumb { background: var(--bg-overlay); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

  /* Spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.8s linear infinite; }

  /* Fade in */
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .fade-in { animation: fadeIn 0.35s ease both; }

  /* Table row hover */
  .trow:hover { background: var(--bg-hover) !important; }

  /* Input focus ring */
  .field-input:focus { outline: none; border-color: var(--border-focus); background: rgba(201,168,76,0.04); }
  .field-input::placeholder { color: var(--text-muted); }
`;

function injectStyles() {
  if (document.getElementById("chi-sys-styles")) return;
  const s = document.createElement("style");
  s.id = "chi-sys-styles";
  s.textContent = GLOBAL_STYLES;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════════
   SHARED PRIMITIVES
══════════════════════════════════════════════════════════════ */
const fmt = (n: number) => "৳ " + Number(n || 0).toLocaleString("en-BD");

// Status badge with distinct colours per status
const Badge = ({ label }: { label: string }) => {
  const variants: Record<string, { bg: string; color: string; border: string }> = {
    Available: { bg: "rgba(52,201,122,0.12)", color: "#34c97a", border: "rgba(52,201,122,0.3)" },
    Reserved: { bg: "rgba(240,160,48,0.12)", color: "#f0a030", border: "rgba(240,160,48,0.3)" },
    "In Transit": { bg: "rgba(91,156,246,0.12)", color: "#5b9cf6", border: "rgba(91,156,246,0.3)" },
    Sold: { bg: "rgba(160,160,180,0.08)", color: "#9ba3b8", border: "rgba(160,160,180,0.2)" },
    Delivered: { bg: "rgba(52,201,122,0.12)", color: "#34c97a", border: "rgba(52,201,122,0.3)" },
    Completed: { bg: "rgba(52,201,122,0.12)", color: "#34c97a", border: "rgba(52,201,122,0.3)" },
    Cleared: { bg: "rgba(52,201,122,0.12)", color: "#34c97a", border: "rgba(52,201,122,0.3)" },
    Active: { bg: "rgba(52,201,122,0.12)", color: "#34c97a", border: "rgba(52,201,122,0.3)" },
    Processing: { bg: "rgba(240,160,48,0.12)", color: "#f0a030", border: "rgba(240,160,48,0.3)" },
    Corporate: { bg: "rgba(91,156,246,0.12)", color: "#5b9cf6", border: "rgba(91,156,246,0.3)" },
    Individual: { bg: "rgba(160,160,180,0.08)", color: "#9ba3b8", border: "rgba(160,160,180,0.2)" },
    Full: { bg: "rgba(52,201,122,0.12)", color: "#34c97a", border: "rgba(52,201,122,0.3)" },
    Installment: { bg: "rgba(240,160,48,0.12)", color: "#f0a030", border: "rgba(240,160,48,0.3)" },
    new: { bg: "rgba(91,156,246,0.12)", color: "#5b9cf6", border: "rgba(91,156,246,0.3)" },
    contacted: { bg: "rgba(52,201,122,0.12)", color: "#34c97a", border: "rgba(52,201,122,0.3)" },
    pending: { bg: "rgba(240,160,48,0.12)", color: "#f0a030", border: "rgba(240,160,48,0.3)" },
  };
  const v = variants[label] || { bg: "rgba(160,160,180,0.08)", color: "#9ba3b8", border: "rgba(160,160,180,0.2)" };
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: v.bg,
      color: v.color,
      border: `1px solid ${v.border}`,
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
};

// Card container
const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: "var(--bg-surface)",
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius)",
    ...style
  }}>{children}</div>
);

// Section header inside a card
const CardHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)"
  }}>
    <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{title}</p>
    {action}
  </div>
);

// Stat card
const StatCard = ({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) => (
  <Card>
    <div style={{ padding: "20px 24px" }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 500, color: accent || "var(--text-primary)", lineHeight: 1.1, marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  </Card>
);

// Modal
const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)"
  }}>
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border-default)",
      borderRadius: "var(--radius)", width: "100%", maxWidth: 680,
      maxHeight: "90vh", overflowY: "auto",
      boxShadow: "0 24px 80px rgba(0,0,0,0.5)"
    }} className="fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border-subtle)" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{title}</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

// Form field
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

// Input
const inputStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg-raised)", border: "1px solid var(--border-default)",
  color: "var(--text-primary)", fontFamily: "var(--font)", fontSize: 14, padding: "9px 12px",
  borderRadius: "var(--radius-sm)", outline: "none", transition: "border-color 0.2s, background 0.2s",
};
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="field-input" style={inputStyle} />
);
const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className="field-input" style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>{children}</select>
);
const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className="field-input" style={{ ...inputStyle, resize: "vertical" as const }} />
);

// Primary button
const Btn = ({ children, onClick, disabled, variant = "primary" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; variant?: "primary" | "ghost" | "danger" }) => {
  const styles = {
    primary: { background: "var(--gold)", color: "#0f1117", border: "1px solid var(--gold)" },
    ghost: { background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-default)" },
    danger: { background: "rgba(224,82,82,0.15)", color: "var(--red)", border: "1px solid rgba(224,82,82,0.3)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...styles[variant],
      padding: "9px 20px", borderRadius: "var(--radius-sm)", fontSize: 12,
      fontWeight: 600, letterSpacing: "0.04em", cursor: "pointer",
      fontFamily: "var(--font)", opacity: disabled ? 0.5 : 1,
      transition: "opacity 0.2s, filter 0.2s",
    }}
      onMouseEnter={e => { if (!disabled) (e.target as HTMLElement).style.filter = "brightness(1.1)"; }}
      onMouseLeave={e => { (e.target as HTMLElement).style.filter = "none"; }}
    >{children}</button>
  );
};

// Spinner
const Spinner = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
    <div className="spin" style={{ width: 24, height: 24, border: "2px solid var(--border-default)", borderTopColor: "var(--gold)", borderRadius: "50%" }} />
  </div>
);

// Empty state
const Empty = ({ msg }: { msg: string }) => (
  <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>{msg}</div>
);

// Table
const Table = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          {headers.map(h => (
            <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-muted)", padding: "10px 16px", whiteSpace: "nowrap" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const TR = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <tr className="trow" onClick={onClick} style={{ borderBottom: "1px solid var(--border-subtle)", cursor: onClick ? "pointer" : "default", transition: "background 0.15s" }}>
    {children}
  </tr>
);

const TD = ({ children, mono, muted, style }: { children: React.ReactNode; mono?: boolean; muted?: boolean; style?: React.CSSProperties }) => (
  <td style={{ padding: "12px 16px", fontSize: 13, color: muted ? "var(--text-tertiary)" : "var(--text-primary)", fontFamily: mono ? "var(--font-mono)" : "var(--font)", ...style }}>{children}</td>
);

// Page header
const PageHeader = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{title}</h1>
      {sub && <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 3 }}>{sub}</p>}
    </div>
    {action}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("vehicles").select("*"),
      supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(6),
      supabase.from("expenses").select("*"),
      supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(5),
    ]).then(([v, s, e, enq]) => {
      setVehicles(v.data || []);
      setSales(s.data || []);
      setExpenses(e.data || []);
      setEnquiries(enq.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  const rev = sales.reduce((a, s) => a + (s.sale_price || 0), 0);
  const exp = expenses.reduce((a, e) => a + (e.amount || 0), 0);
  const avail = vehicles.filter(v => v.status === "Available").length;
  const transit = vehicles.filter(v => v.status === "In Transit").length;
  const newEnq = enquiries.filter(e => e.status === "new").length;

  return (
    <div className="fade-in">
      <PageHeader title="Dashboard" sub="Car House Imports Ltd. — Live Overview" />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Revenue" value={fmt(rev)} sub="All completed sales" accent="var(--green)" />
        <StatCard label="Available Stock" value={avail} sub="Ready to sell" />
        <StatCard label="In Transit" value={transit} sub="Incoming vehicles" accent="var(--blue)" />
        <StatCard label="Net Profit Est." value={fmt(rev - exp)} sub="Revenue minus expenses" accent="var(--gold)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>
        {/* Recent sales */}
        <Card>
          <CardHeader title="Recent Sales" />
          {sales.length === 0 ? <Empty msg="No sales recorded yet." /> : (
            <div>
              {sales.map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{s.car_id}</p>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{s.salesperson} · {s.sale_date}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>{fmt(s.sale_price)}</p>
                    <div style={{ marginTop: 4 }}><Badge label={s.status} /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Inventory bars */}
          <Card>
            <CardHeader title="Inventory Status" />
            <div style={{ padding: "16px 20px" }}>
              {[
                { label: "Available", color: "var(--green)", count: avail },
                { label: "Reserved", color: "var(--amber)", count: vehicles.filter(v => v.status === "Reserved").length },
                { label: "In Transit", color: "var(--blue)", count: transit },
                { label: "Sold", color: "var(--text-muted)", count: vehicles.filter(v => v.status === "Sold").length },
              ].map(({ label, color, count }) => {
                const pct = vehicles.length ? Math.round((count / vehicles.length) * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{count}</span>
                    </div>
                    <div style={{ height: 5, background: "var(--bg-overlay)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 1s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* New enquiries */}
          <Card>
            <CardHeader title={`Enquiries ${newEnq > 0 ? `· ${newEnq} new` : ""}`} />
            {enquiries.length === 0 ? <Empty msg="No enquiries yet." /> : (
              <div>
                {enquiries.map(e => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{e.name}</p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{e.type}</p>
                    </div>
                    <Badge label={e.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   INVENTORY
══════════════════════════════════════════════════════════════ */
const Inventory = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: "", make: "", model: "", year: "", color: "", vin: "", chassis_no: "", origin: "", port: "", purchase_price: "", selling_price: "", engine_cc: "", transmission: "", fuel_type: "Petrol", condition: "New", mileage: "0", customs_duty: "", shipping_cost: "", import_date: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("vehicles").select("*").order("created_at", { ascending: false });
    setVehicles(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = vehicles.filter(v =>
    (filter === "All" || v.status === filter) &&
    `${v.make} ${v.model} ${v.id}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("vehicles").insert([{
      id: form.id || `INV-${Date.now()}`,
      make: form.make, model: form.model, year: parseInt(form.year), color: form.color,
      vin: form.vin, chassis_no: form.chassis_no, origin: form.origin, port: form.port,
      purchase_price: parseInt(form.purchase_price), selling_price: parseInt(form.selling_price),
      engine_cc: parseInt(form.engine_cc), transmission: form.transmission,
      fuel_type: form.fuel_type, condition: form.condition, mileage: parseInt(form.mileage),
      customs_duty: parseInt(form.customs_duty), shipping_cost: parseInt(form.shipping_cost),
      import_date: form.import_date, status: "Available", featured: false,
    }]);
    setSaving(false);
    if (!error) { setShowAdd(false); load(); }
    else alert("Error: " + error.message);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("vehicles").update({ status }).eq("id", id);
    load(); setSelected(null);
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("vehicles").update({ featured: !current }).eq("id", id);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader
        title="Inventory"
        sub={`${vehicles.length} vehicles · ${vehicles.filter(v => v.status === "Available").length} available`}
        action={<Btn onClick={() => setShowAdd(true)}>+ Add Vehicle</Btn>}
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "7px 12px", flex: 1, minWidth: 200 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 14 }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles…" style={{ background: "none", border: "none", color: "var(--text-primary)", outline: "none", fontSize: 13, width: "100%", fontFamily: "var(--font)" }} />
        </div>
        {["All", "Available", "Reserved", "In Transit", "Sold"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.2s",
            background: filter === f ? "var(--gold)" : "var(--bg-surface)",
            color: filter === f ? "#0f1117" : "var(--text-secondary)",
            border: filter === f ? "1px solid var(--gold)" : "1px solid var(--border-default)",
          }}>{f}</button>
        ))}
      </div>

      <Card>
        <Table headers={["ID", "Vehicle", "Year", "Origin", "Engine", "Purchase Price", "Selling Price", "Status", ""]}>
          {filtered.length === 0 && <TR><td colSpan={9} style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No vehicles found.</td></TR>}
          {filtered.map(car => (
            <TR key={car.id} onClick={() => setSelected(car)}>
              <TD mono muted>{car.id}</TD>
              <TD>
                <p style={{ fontWeight: 500 }}>{car.make} {car.model}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>{car.color}</p>
              </TD>
              <TD muted>{car.year}</TD>
              <TD muted>{car.origin}</TD>
              <TD muted>{car.engine_cc}cc</TD>
              <TD muted>{fmt(car.purchase_price)}</TD>
              <TD style={{ fontWeight: 600, color: "var(--gold)" }}>{fmt(car.selling_price)}</TD>
              <TD><Badge label={car.status} /></TD>
              <TD><span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>View →</span></TD>
            </TR>
          ))}
        </Table>
      </Card>

      {/* Detail Modal */}
      {selected && (
        <Modal title={`${selected.make} ${selected.model}`} onClose={() => setSelected(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {([["ID", selected.id], ["VIN", selected.vin], ["Chassis", selected.chassis_no], ["Year", selected.year], ["Colour", selected.color], ["Origin", selected.origin], ["Port", selected.port], ["Engine", `${selected.engine_cc}cc`], ["Transmission", selected.transmission], ["Fuel", selected.fuel_type], ["Mileage", `${selected.mileage} km`], ["Import Date", selected.import_date], ["Purchase Price", fmt(selected.purchase_price)], ["Selling Price", fmt(selected.selling_price)], ["Customs Duty", fmt(selected.customs_duty)], ["Shipping Cost", fmt(selected.shipping_cost)]] as [string, string | number][]).map(([k, v]) => (
              <div key={k} style={{ padding: "10px 14px", background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>{k}</p>
                <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 500 }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>Change Status</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Available", "Reserved", "In Transit", "Sold"].map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)} style={{
                  padding: "7px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.2s",
                  background: selected.status === s ? "var(--gold)" : "var(--bg-raised)",
                  color: selected.status === s ? "#0f1117" : "var(--text-secondary)",
                  border: selected.status === s ? "1px solid var(--gold)" : "1px solid var(--border-default)",
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "var(--bg-raised)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Featured on Website</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{selected.featured ? "Visible on homepage" : "Not shown on homepage"}</p>
            </div>
            <button onClick={() => toggleFeatured(selected.id, selected.featured)} style={{
              padding: "7px 16px", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "var(--font)",
              background: selected.featured ? "rgba(52,201,122,0.15)" : "var(--bg-overlay)",
              color: selected.featured ? "var(--green)" : "var(--text-secondary)",
              border: selected.featured ? "1px solid rgba(52,201,122,0.3)" : "1px solid var(--border-default)",
            }}>{selected.featured ? "✓ Featured" : "Set Featured"}</button>
          </div>
        </Modal>
      )}

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Add New Vehicle" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {([["Vehicle ID", "id", "INV-009"], ["Make", "make", "Toyota"], ["Model", "model", "Land Cruiser"], ["Year", "year", "2024"], ["Colour", "color", "Pearl White"], ["VIN", "vin", "VIN number"], ["Chassis No", "chassis_no", "CH-XXXXX"], ["Origin", "origin", "Japan"], ["Port", "port", "Chittagong"], ["Engine CC", "engine_cc", "4608"], ["Transmission", "transmission", "Automatic"], ["Purchase Price", "purchase_price", "8500000"], ["Selling Price", "selling_price", "11200000"], ["Customs Duty", "customs_duty", "1200000"], ["Shipping Cost", "shipping_cost", "450000"], ["Mileage", "mileage", "0"]] as [string, string, string][]).map(([label, key, ph]) => (
              <Field key={key} label={label}>
                <Input placeholder={ph} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </Field>
            ))}
            <Field label="Import Date"><Input type="date" value={form.import_date} onChange={e => setForm(p => ({ ...p, import_date: e.target.value }))} /></Field>
            <Field label="Fuel Type">
              <Select value={form.fuel_type} onChange={e => setForm(p => ({ ...p, fuel_type: e.target.value }))}>
                <option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Mild Hybrid</option><option>Electric</option>
              </Select>
            </Field>
            <Field label="Condition">
              <Select value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
                <option>New</option><option>Reconditioned</option><option>Used</option>
              </Select>
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add Vehicle"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   CUSTOMERS
══════════════════════════════════════════════════════════════ */
const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", nid: "", type: "Individual", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    setCustomers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("customers").insert([{ id: `CUS-${Date.now()}`, ...form, join_date: new Date().toISOString().split("T")[0], status: "Active" }]);
    setSaving(false);
    if (!error) { setShowAdd(false); load(); }
    else alert("Error: " + error.message);
  };

  const filtered = customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader title="Customers" sub={`${customers.length} registered clients`} action={<Btn onClick={() => setShowAdd(true)}>+ Add Customer</Btn>} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "7px 12px", marginBottom: 16 }}>
        <span style={{ color: "var(--text-muted)" }}>⌕</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…" style={{ background: "none", border: "none", color: "var(--text-primary)", outline: "none", fontSize: 13, width: "100%", fontFamily: "var(--font)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {filtered.map(c => (
          <Card key={c.id}>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-overlay)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: "var(--gold)" }}>{c.name?.[0]}</div>
                <Badge label={c.type} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{c.name}</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>{c.phone}</p>
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 2 }}>{c.email}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{c.address}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Since {c.join_date}</span>
                <Badge label={c.status} />
              </div>
              {c.notes && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10, fontStyle: "italic", paddingTop: 10, borderTop: "1px solid var(--border-subtle)" }}>"{c.notes}"</p>}
            </div>
          </Card>
        ))}
      </div>
      {showAdd && (
        <Modal title="Add Customer" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {([["Full Name", "name"], ["Phone", "phone"], ["Email", "email"], ["NID / TIN", "nid"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}><Input placeholder={label} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} /></Field>
            ))}
            <div style={{ gridColumn: "1/-1" }}><Field label="Address"><Input placeholder="Full address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></Field></div>
            <Field label="Type"><Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}><option>Individual</option><option>Corporate</option></Select></Field>
            <div style={{ gridColumn: "1/-1" }}><Field label="Notes"><Input placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></Field></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add Customer"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SALES
══════════════════════════════════════════════════════════════ */
const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ car_id: "", customer_id: "", sale_date: "", sale_price: "", down_payment: "", payment_method: "Full", salesperson: "", discount: "0", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [s, v, c] = await Promise.all([
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
      supabase.from("vehicles").select("*"),
      supabase.from("customers").select("*"),
    ]);
    setSales(s.data || []); setVehicles(v.data || []); setCustomers(c.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("sales").insert([{ id: `SAL-${Date.now()}`, car_id: form.car_id, customer_id: form.customer_id, sale_date: form.sale_date, sale_price: parseInt(form.sale_price), down_payment: parseInt(form.down_payment), payment_method: form.payment_method, salesperson: form.salesperson, discount: parseInt(form.discount), notes: form.notes, status: "Completed" }]);
    if (!error) { await supabase.from("vehicles").update({ status: "Sold" }).eq("id", form.car_id); setShowAdd(false); load(); }
    else alert("Error: " + error.message);
    setSaving(false);
  };

  if (loading) return <Spinner />;
  const rev = sales.reduce((a, s) => a + (s.sale_price || 0), 0);

  return (
    <div className="fade-in">
      <PageHeader title="Sales" sub={`${sales.length} transactions`} action={<Btn onClick={() => setShowAdd(true)}>+ New Sale</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Revenue" value={fmt(rev)} accent="var(--green)" />
        <StatCard label="Average Sale" value={sales.length ? fmt(rev / sales.length) : "—"} />
        <StatCard label="Total Discounts" value={fmt(sales.reduce((a, s) => a + (s.discount || 0), 0))} />
      </div>
      <Card>
        <Table headers={["Sale ID", "Vehicle", "Customer", "Date", "Sale Price", "Payment", "Salesperson", "Status"]}>
          {sales.length === 0 && <TR><TD muted>No sales yet.</TD></TR>}
          {sales.map(s => {
            const car = vehicles.find(v => v.id === s.car_id);
            const cust = customers.find(c => c.id === s.customer_id);
            return (
              <TR key={s.id}>
                <TD mono muted>{s.id}</TD>
                <TD>{car ? `${car.make} ${car.model}` : s.car_id}</TD>
                <TD muted>{cust?.name || s.customer_id}</TD>
                <TD muted>{s.sale_date}</TD>
                <TD style={{ fontWeight: 600, color: "var(--green)" }}>{fmt(s.sale_price)}</TD>
                <TD><Badge label={s.payment_method} /></TD>
                <TD muted>{s.salesperson}</TD>
                <TD><Badge label={s.status} /></TD>
              </TR>
            );
          })}
        </Table>
      </Card>
      {showAdd && (
        <Modal title="Record New Sale" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Vehicle">
              <Select value={form.car_id} onChange={e => setForm(p => ({ ...p, car_id: e.target.value }))}>
                <option value="">Select vehicle</option>
                {vehicles.filter(v => v.status === "Available" || v.status === "Reserved").map(v => <option key={v.id} value={v.id}>{v.id} — {v.make} {v.model}</option>)}
              </Select>
            </Field>
            <Field label="Customer">
              <Select value={form.customer_id} onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Sale Date"><Input type="date" value={form.sale_date} onChange={e => setForm(p => ({ ...p, sale_date: e.target.value }))} /></Field>
            <Field label="Sale Price (৳)"><Input placeholder="e.g. 11200000" value={form.sale_price} onChange={e => setForm(p => ({ ...p, sale_price: e.target.value }))} /></Field>
            <Field label="Down Payment (৳)"><Input placeholder="e.g. 5000000" value={form.down_payment} onChange={e => setForm(p => ({ ...p, down_payment: e.target.value }))} /></Field>
            <Field label="Discount (৳)"><Input placeholder="0" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} /></Field>
            <Field label="Salesperson"><Input placeholder="Name" value={form.salesperson} onChange={e => setForm(p => ({ ...p, salesperson: e.target.value }))} /></Field>
            <Field label="Payment Method">
              <Select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                <option>Full</option><option>Installment</option><option>Bank Finance</option>
              </Select>
            </Field>
            <div style={{ gridColumn: "1/-1" }}><Field label="Notes"><Input placeholder="Optional notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></Field></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Record Sale"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   SHIPMENTS
══════════════════════════════════════════════════════════════ */
const Shipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ origin: "", destination: "", vessel: "", bl_number: "", etd: "", eta: "", agent: "", freight: "", status: "In Transit" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
    setShipments(data || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("shipments").insert([{ id: `SHP-${Date.now()}`, ...form, freight: parseInt(form.freight) }]);
    setSaving(false);
    if (!error) { setShowAdd(false); load(); }
    else alert("Error: " + error.message);
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader title="Shipments" sub={`${shipments.length} shipments tracked`} action={<Btn onClick={() => setShowAdd(true)}>+ New Shipment</Btn>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shipments.length === 0 && <Card><Empty msg="No shipments yet." /></Card>}
        {shipments.map(s => (
          <Card key={s.id}>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{s.id}</span>
                    <Badge label={s.status} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{s.origin} → {s.destination}</p>
                  <p style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 3 }}>Vessel: {s.vessel} · B/L: {s.bl_number}</p>
                </div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--gold)" }}>{fmt(s.freight)}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, paddingTop: 14, borderTop: "1px solid var(--border-subtle)" }}>
                {([["ETD", s.etd], ["ETA", s.eta], ["Agent", s.agent], ["Status", s.status]] as [string, string][]).map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 4 }}>{k}</p>
                    <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {showAdd && (
        <Modal title="New Shipment" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {([["Origin Port", "origin"], ["Destination", "destination"], ["Vessel Name", "vessel"], ["B/L Number", "bl_number"], ["Shipping Agent", "agent"], ["Freight Cost (৳)", "freight"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}><Input placeholder={label} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} /></Field>
            ))}
            <Field label="ETD"><Input type="date" value={form.etd} onChange={e => setForm(p => ({ ...p, etd: e.target.value }))} /></Field>
            <Field label="ETA"><Input type="date" value={form.eta} onChange={e => setForm(p => ({ ...p, eta: e.target.value }))} /></Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option>In Transit</option><option>Delivered</option><option>Delayed</option>
              </Select>
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Create Shipment"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   FINANCE
══════════════════════════════════════════════════════════════ */
const Finance = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: "Shipping", amount: "", date: "", description: "", reference: "", paid_to: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [s, e] = await Promise.all([supabase.from("sales").select("*"), supabase.from("expenses").select("*").order("date", { ascending: false })]);
    setSales(s.data || []); setExpenses(e.data || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("expenses").insert([{ ...form, amount: parseInt(form.amount) }]);
    setSaving(false);
    if (!error) { setShowAdd(false); load(); }
    else alert("Error: " + error.message);
  };

  if (loading) return <Spinner />;

  const rev = sales.reduce((a, s) => a + (s.sale_price || 0), 0);
  const exp = expenses.reduce((a, e) => a + (e.amount || 0), 0);
  const cats = [...new Set(expenses.map(e => e.category))];

  return (
    <div className="fade-in">
      <PageHeader title="Finance" sub="Revenue, expenses and profitability" action={<Btn onClick={() => setShowAdd(true)}>+ Add Expense</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Revenue" value={fmt(rev)} accent="var(--green)" />
        <StatCard label="Total Expenses" value={fmt(exp)} accent="var(--red)" />
        <StatCard label="Net Profit" value={fmt(rev - exp)} accent={rev - exp >= 0 ? "var(--green)" : "var(--red)"} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <CardHeader title="Expenses by Category" />
          <div style={{ padding: "16px 20px" }}>
            {cats.map(cat => {
              const total = expenses.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0);
              const pct = exp ? Math.round((total / exp) * 100) : 0;
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{cat}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{fmt(total)}</span>
                  </div>
                  <div style={{ height: 5, background: "var(--bg-overlay)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--gold)", borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent Expenses" />
          <div>
            {expenses.slice(0, 8).map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{e.description}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{e.category} · {e.date}</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--red)" }}>-{fmt(e.amount)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {showAdd && (
        <Modal title="Add Expense" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {["Shipping", "Customs & Taxes", "Staff Salary", "Showroom Rent", "Insurance", "Marketing", "Maintenance", "Other"].map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Amount (৳)"><Input placeholder="Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></Field>
            <Field label="Date"><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></Field>
            <Field label="Paid To"><Input placeholder="Recipient" value={form.paid_to} onChange={e => setForm(p => ({ ...p, paid_to: e.target.value }))} /></Field>
            <Field label="Reference"><Input placeholder="e.g. SHP-001" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} /></Field>
            <div style={{ gridColumn: "1/-1" }}><Field label="Description"><Input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></Field></div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add Expense"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   STAFF
══════════════════════════════════════════════════════════════ */
const Staff = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", department: "Sales", email: "", phone: "", salary: "", join_date: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    setStaff(data || []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("staff").insert([{ id: `STF-${Date.now()}`, ...form, salary: parseInt(form.salary), status: "Active" }]);
    setSaving(false);
    if (!error) { setShowAdd(false); load(); }
    else alert("Error: " + error.message);
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader title="Staff & HR" sub={`${staff.length} employees`} action={<Btn onClick={() => setShowAdd(true)}>+ Add Staff</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 12 }}>
        {staff.map(s => (
          <Card key={s.id}>
            <div style={{ padding: 20, display: "flex", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--bg-overlay)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600, color: "var(--gold)", flexShrink: 0 }}>{s.name?.[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{s.role} · {s.department}</p>
                  </div>
                  <Badge label={s.status} />
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{s.phone}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Since {s.join_date}</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{fmt(s.salary)}<span style={{ fontSize: 11, color: "var(--text-muted)" }}>/mo</span></span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {showAdd && (
        <Modal title="Add Staff Member" onClose={() => setShowAdd(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {([["Full Name", "name"], ["Role", "role"], ["Phone", "phone"], ["Email", "email"], ["Monthly Salary (৳)", "salary"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}><Input placeholder={label} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} /></Field>
            ))}
            <Field label="Join Date"><Input type="date" value={form.join_date} onChange={e => setForm(p => ({ ...p, join_date: e.target.value }))} /></Field>
            <Field label="Department">
              <Select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                <option>Sales</option><option>Import</option><option>Finance</option><option>Operations</option>
              </Select>
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-subtle)" }}>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add Staff"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   ENQUIRIES
══════════════════════════════════════════════════════════════ */
const Enquiries = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("enquiries").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setEnquiries(data || []); setLoading(false); });
  }, []);

  const updateStatus = async (id: number, status: string) => {
    await supabase.from("enquiries").update({ status }).eq("id", id);
    setEnquiries(p => p.map(e => e.id === id ? { ...e, status } : e));
  };

  if (loading) return <Spinner />;

  return (
    <div className="fade-in">
      <PageHeader title="Website Enquiries" sub={`${enquiries.length} total · ${enquiries.filter(e => e.status === "new").length} new`} />
      <Card>
        <Table headers={["Name", "Phone", "Email", "Type", "Vehicle", "Message", "Date", "Status", "Action"]}>
          {enquiries.length === 0 && <TR><TD muted>No enquiries yet. They will appear here when visitors submit the website contact form.</TD></TR>}
          {enquiries.map(e => (
            <TR key={e.id}>
              <TD style={{ fontWeight: 500 }}>{e.name}</TD>
              <TD muted>{e.phone}</TD>
              <TD muted>{e.email}</TD>
              <TD><Badge label={e.type} /></TD>
              <TD mono muted>{e.vehicle_id || "—"}</TD>
              <TD muted style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.message}</TD>
              <TD muted>{new Date(e.created_at).toLocaleDateString()}</TD>
              <TD><Badge label={e.status} /></TD>
              <TD>
                {e.status === "new" && (
                  <button onClick={() => updateStatus(e.id, "contacted")} style={{ fontSize: 11, padding: "4px 10px", background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "var(--font)" }}>
                    Mark Contacted
                  </button>
                )}
              </TD>
            </TR>
          ))}
        </Table>
      </Card>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   WEBSITE CMS
══════════════════════════════════════════════════════════════ */
const WebsiteCMS = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([supabase.from("vehicles").select("*"), supabase.from("site_settings").select("*")]).then(([v, s]) => {
      setVehicles(v.data || []);
      const map: Record<string, string> = {};
      (s.data || []).forEach((r: any) => { map[r.key] = r.value; });
      setSettings(map); setLoading(false);
    });
  }, []);

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("vehicles").update({ featured: !current }).eq("id", id);
    setVehicles(p => p.map(v => v.id === id ? { ...v, featured: !current } : v));
  };

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(Object.entries(settings).map(([key, value]) => supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() })));
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <Spinner />;

  const fieldStyle = { ...inputStyle };

  return (
    <div className="fade-in">
      <PageHeader title="Website CMS" sub="Changes save directly to the live website database" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Card>
          <CardHeader title="Hero Section" />
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Hero Headline">
              <input className="field-input" style={fieldStyle} value={settings.hero_title || ""} onChange={e => setSettings(p => ({ ...p, hero_title: e.target.value }))} placeholder="Hero headline" />
            </Field>
            <Field label="Hero Subtitle">
              <textarea className="field-input" style={{ ...fieldStyle, resize: "vertical" }} rows={3} value={settings.hero_subtitle || ""} onChange={e => setSettings(p => ({ ...p, hero_subtitle: e.target.value }))} placeholder="Hero subtitle" />
            </Field>
          </div>
        </Card>
        <Card>
          <CardHeader title="Contact Info" />
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {([["Showroom Address", "showroom_address"], ["Phone", "phone"], ["Email", "email"], ["Business Hours", "business_hours"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}>
                <input className="field-input" style={fieldStyle} placeholder={label} value={settings[key] || ""} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} />
              </Field>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 12 }}>
        <CardHeader title="Featured Vehicles on Homepage" />
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8 }}>
          {vehicles.map(car => (
            <button key={car.id} onClick={() => toggleFeatured(car.id, car.featured)} style={{
              padding: "12px 14px", textAlign: "left", borderRadius: "var(--radius-sm)", cursor: "pointer", fontFamily: "var(--font)", transition: "all 0.2s",
              background: car.featured ? "rgba(52,201,122,0.1)" : "var(--bg-raised)",
              border: car.featured ? "1px solid rgba(52,201,122,0.35)" : "1px solid var(--border-default)",
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{car.make} {car.model}</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{car.year} · {car.status}</p>
              {car.featured && <p style={{ fontSize: 11, color: "var(--green)", marginTop: 4, fontWeight: 600 }}>✓ Featured</p>}
            </button>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <Card>
          <CardHeader title="Announcement Banner" />
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Banner Text">
              <input className="field-input" style={fieldStyle} placeholder="e.g. New arrivals from Japan — March 2025" value={settings.announcement_text || ""} onChange={e => setSettings(p => ({ ...p, announcement_text: e.target.value }))} />
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={settings.announcement_active === "true"} onChange={e => setSettings(p => ({ ...p, announcement_active: e.target.checked ? "true" : "false" }))} style={{ accentColor: "var(--gold)", width: 14, height: 14 }} />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Show banner on website</span>
            </label>
          </div>
        </Card>
        <Card>
          <CardHeader title="SEO Settings" />
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {([["Page Title", "seo_title"], ["Meta Description", "seo_description"], ["Keywords", "seo_keywords"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}>
                <input className="field-input" style={fieldStyle} placeholder={label} value={settings[key] || ""} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} />
              </Field>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn onClick={saveAll} disabled={saving}>
          {saving ? "Saving…" : saved ? "✓ Saved to Database" : "Save All Changes"}
        </Btn>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   REPORTS & SETTINGS (static UI)
══════════════════════════════════════════════════════════════ */
const Reports = () => (
  <div className="fade-in">
    <PageHeader title="Reports" sub="Generate and export business reports" />
    <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
      {["This Month", "Last Month", "Q1 2025", "FY 2024–25", "Custom Range"].map(r => (
        <button key={r} style={{ padding: "7px 16px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font)" }}>{r}</button>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {[["Monthly Sales Report", "Revenue, units sold, salesperson performance"], ["Inventory Valuation", "Current stock value and holding costs"], ["Import Cost Analysis", "Shipping, customs, duties per unit"], ["Profit & Loss Statement", "Full P&L with all categories"], ["Customer Activity Report", "Leads, conversion, repeat buyers"], ["Tax & Compliance Report", "NBR duties, VAT, advance tax"], ["Staff Payroll Report", "Monthly salary disbursement"], ["Vehicle Aging Report", "Days in stock per vehicle"]].map(([name, desc]) => (
        <Card key={name}>
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>{name}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{desc}</p>
            </div>
            <button style={{ padding: "6px 14px", background: "var(--bg-raised)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", fontSize: 11, cursor: "pointer", fontFamily: "var(--font)", whiteSpace: "nowrap" }}>Export</button>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const Customs = () => (
  <div className="fade-in">
    <PageHeader title="Customs & Duties" />
    <Card><Empty msg="Customs clearance records will appear here. Add records via Supabase or extend this section." /></Card>
  </div>
);

const Settings = () => (
  <div className="fade-in">
    <PageHeader title="Settings" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {[{ title: "Company Profile", fields: ["Company Name", "Trade License No", "TIN Number", "VAT Registration", "Registered Address"] }, { title: "Showroom Details", fields: ["Showroom Name", "Address", "Phone", "Email", "Business Hours"] }, { title: "Bank Accounts", fields: ["Bank Name", "Account No", "Branch", "Routing No", "SWIFT Code"] }, { title: "System Preferences", fields: ["Default Currency", "Timezone", "Date Format", "Language"] }].map(sec => (
        <Card key={sec.title}>
          <CardHeader title={sec.title} />
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {sec.fields.map(f => (
              <Field key={f} label={f}><Input placeholder={f === "Company Name" ? "Car House Imports Ltd." : f} /></Field>
            ))}
            <div style={{ paddingTop: 8 }}><Btn>Save {sec.title}</Btn></div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   NAV CONFIG
══════════════════════════════════════════════════════════════ */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "inventory", label: "Inventory", icon: "◻" },
  { id: "sales", label: "Sales", icon: "◈" },
  { id: "customers", label: "Customers", icon: "○" },
  { id: "shipments", label: "Shipments", icon: "△" },
  { id: "enquiries", label: "Enquiries", icon: "✉" },
  { id: "finance", label: "Finance", icon: "◎" },
  { id: "staff", label: "Staff & HR", icon: "◉" },
  { id: "website", label: "Website CMS", icon: "⊡" },
  { id: "customs", label: "Customs", icon: "⬡" },
  { id: "reports", label: "Reports", icon: "▣" },
  { id: "settings", label: "Settings", icon: "⊙" },
];

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function Page() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    injectStyles();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push("/login");
      else { setUser(session.user); setLoading(false); }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spin" style={{ width: 28, height: 28, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--gold)", borderRadius: "50%" }} />
    </div>
  );

  const PAGES: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />, inventory: <Inventory />, sales: <Sales />,
    customers: <Customers />, shipments: <Shipments />, enquiries: <Enquiries />,
    finance: <Finance />, staff: <Staff />, website: <WebsiteCMS />,
    customs: <Customs />, reports: <Reports />, settings: <Settings />,
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-base)", fontFamily: "var(--font)" }}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 56 : 220,
        flexShrink: 0,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border-default)",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, background: "var(--gold)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#0f1117", flexShrink: 0 }}>H</div>
          {!collapsed && (
            <div style={{ marginLeft: 10, overflow: "hidden" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>Car House</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", letterSpacing: "0.04em" }}>Imports Ltd.</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto", overflowX: "hidden" }}>
          {NAV.map(n => {
            const isActive = active === n.id;
            return (
              <button key={n.id} onClick={() => setActive(n.id)} title={collapsed ? n.label : ""} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "9px 14px" : "9px 12px",
                marginBottom: 2, borderRadius: 6, border: "none", cursor: "pointer",
                background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
                color: isActive ? "var(--gold)" : "var(--text-tertiary)",
                fontFamily: "var(--font)", fontSize: 13, fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s", textAlign: "left",
                borderLeft: isActive ? "2px solid var(--gold)" : "2px solid transparent",
              }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "var(--bg-raised)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)"; } }}
              >
                <span style={{ fontSize: 14, flexShrink: 0, width: 16, textAlign: "center" }}>{n.icon}</span>
                {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: "8px 6px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <button onClick={() => setCollapsed(!collapsed)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font)", fontSize: 12, marginBottom: 2 }}>
            <span style={{ fontSize: 14 }}>{collapsed ? "→" : "←"}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
          <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font)", fontSize: 12 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}
          >
            <span style={{ fontSize: 14 }}>↑</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Topbar */}
        <header style={{ height: 56, background: "var(--bg-surface)", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Car House Imports</span>
            <span style={{ color: "var(--border-default)" }}>›</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{NAV.find(n => n.id === active)?.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-raised)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "5px 12px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>⌕</span>
              <input placeholder="Quick search…" style={{ background: "none", border: "none", color: "var(--text-primary)", outline: "none", fontSize: 12, width: 140, fontFamily: "var(--font)" }} />
            </div>
            {/* User */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{user?.email}</span>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-overlay)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>
                {user?.email?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {PAGES[active]}
        </main>
      </div>
    </div>
  );
}