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
   HELPERS
══════════════════════════════════════════════════════════════ */
const fmt = (n: number) => "৳ " + Number(n || 0).toLocaleString("en-BD");

const Badge = ({ label }: { label: string }) => {
  const map: Record<string, string> = {
    Available: "bg-white text-black",
    Reserved: "bg-zinc-700 text-white border border-zinc-500",
    Sold: "bg-zinc-900 text-zinc-400 border border-zinc-700",
    "In Transit": "bg-zinc-800 text-zinc-300 border border-zinc-600",
    Processing: "bg-zinc-800 text-zinc-300",
    Delivered: "bg-white/10 text-white border border-white/20",
    Completed: "bg-white text-black",
    Active: "bg-white text-black",
    Cleared: "bg-white text-black",
    Corporate: "bg-zinc-800 text-white",
    Individual: "bg-zinc-700 text-white",
    Full: "bg-white text-black",
    Installment: "bg-zinc-700 text-white",
    new: "bg-zinc-700 text-white",
    pending: "bg-zinc-800 text-zinc-300",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium tracking-wider uppercase ${map[label] || "bg-zinc-800 text-zinc-300"}`}>
      {label}
    </span>
  );
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.9)" }}>
    <div className="bg-[#111] border border-white/10 w-full max-w-2xl max-h-[88vh] overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <h2 className="text-base font-semibold text-white tracking-wide">{title}</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
      </div>
      <div className="px-8 py-6">{children}</div>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2">{label}</label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 placeholder-zinc-600 transition-colors" />
);

const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 transition-colors appearance-none">
    {children}
  </select>
);

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="border border-white/10 p-6 bg-[#0a0a0a]">
    <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-3">{label}</p>
    <p className="text-3xl font-light text-white mb-1">{value}</p>
    {sub && <p className="text-xs text-zinc-600">{sub}</p>}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
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
    const load = async () => {
      const [v, s, e, enq] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("expenses").select("*"),
        supabase.from("enquiries").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      setVehicles(v.data || []);
      setSales(s.data || []);
      setExpenses(e.data || []);
      setEnquiries(enq.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  const rev = sales.reduce((a, s) => a + (s.sale_price || 0), 0);
  const exp = expenses.reduce((a, e) => a + (e.amount || 0), 0);
  const avail = vehicles.filter(v => v.status === "Available").length;
  const transit = vehicles.filter(v => v.status === "In Transit").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Car House Imports Ltd. — Live Overview</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
        <StatCard label="Total Revenue" value={fmt(rev)} sub="Completed sales" />
        <StatCard label="Available Stock" value={avail} sub="Ready for sale" />
        <StatCard label="In Transit" value={transit} sub="Incoming" />
        <StatCard label="Net Profit Est." value={fmt(rev - exp)} sub="Rev. minus expenses" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/5">
        <div className="lg:col-span-2 bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Recent Sales</p>
          {sales.length === 0 ? (
            <p className="text-zinc-600 text-sm">No sales recorded yet.</p>
          ) : (
            sales.map(s => {
              const car = vehicles.find(v => v.id === s.car_id);
              return (
                <div key={s.id} className="flex items-center justify-between py-4 border-b border-white/5">
                  <div>
                    <p className="text-white text-sm">{car ? `${car.make} ${car.model}` : s.car_id}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{s.salesperson} · {s.sale_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{fmt(s.sale_price)}</p>
                    <div className="mt-1"><Badge label={s.status} /></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Inventory Status</p>
          {["Available", "Reserved", "In Transit", "Sold"].map(st => {
            const cnt = vehicles.filter(v => v.status === st).length;
            const pct = vehicles.length ? Math.round((cnt / vehicles.length) * 100) : 0;
            return (
              <div key={st} className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400">{st}</span>
                  <span className="text-zinc-600">{cnt}</span>
                </div>
                <div className="h-px bg-white/8">
                  <div className="h-px bg-white" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-4">New Enquiries</p>
            {enquiries.length === 0 ? (
              <p className="text-zinc-600 text-xs">No enquiries yet.</p>
            ) : (
              enquiries.map(e => (
                <div key={e.id} className="flex gap-3 p-3 mb-2 text-xs border border-white/5 text-zinc-400">
                  <span>·</span>{e.name} — {e.type}
                </div>
              ))
            )}
          </div>
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
  const [form, setForm] = useState({
    id: "", make: "", model: "", year: "", color: "", vin: "", chassis_no: "",
    origin: "", port: "", purchase_price: "", selling_price: "", engine_cc: "",
    transmission: "", fuel_type: "Petrol", condition: "New", mileage: "0",
    customs_duty: "", shipping_cost: "", import_date: "",
  });

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
      make: form.make, model: form.model, year: parseInt(form.year),
      color: form.color, vin: form.vin, chassis_no: form.chassis_no,
      origin: form.origin, port: form.port,
      purchase_price: parseInt(form.purchase_price),
      selling_price: parseInt(form.selling_price),
      engine_cc: parseInt(form.engine_cc),
      transmission: form.transmission, fuel_type: form.fuel_type,
      condition: form.condition, mileage: parseInt(form.mileage),
      customs_duty: parseInt(form.customs_duty),
      shipping_cost: parseInt(form.shipping_cost),
      import_date: form.import_date, status: "Available", featured: false,
    }]);
    setSaving(false);
    if (!error) { setShowAdd(false); load(); }
    else alert("Error: " + error.message);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("vehicles").update({ status }).eq("id", id);
    load();
    setSelected(null);
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("vehicles").update({ featured: !current }).eq("id", id);
    load();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-white tracking-wide">Inventory</h1>
          <p className="text-zinc-500 text-sm mt-1">{vehicles.length} vehicles total</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors">
          + Add Vehicle
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-3 border border-white/10 px-4 py-2 flex-1 min-w-48 bg-[#0a0a0a]">
          <span className="text-zinc-600 text-xs">⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicles…" className="bg-transparent text-sm text-white placeholder-zinc-600 outline-none w-full" />
        </div>
        {["All", "Available", "Reserved", "In Transit", "Sold"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase transition-all ${filter === f ? "bg-white text-black" : "bg-[#0a0a0a] text-zinc-500 border border-white/10 hover:border-white/30"}`}>{f}</button>
        ))}
      </div>
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["ID", "Vehicle", "Year", "Origin", "Purchase", "Selling", "Status", ""].map(h => (
                <th key={h} className="text-left text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-600 px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((car, i) => (
              <tr key={car.id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i % 2 === 0 ? "" : "bg-white/1"}`}>
                <td className="px-5 py-4 text-zinc-500 font-mono text-xs">{car.id}</td>
                <td className="px-5 py-4">
                  <p className="text-white">{car.make} {car.model}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{car.color} · {car.engine_cc}cc</p>
                </td>
                <td className="px-5 py-4 text-zinc-400">{car.year}</td>
                <td className="px-5 py-4 text-zinc-500 text-xs">{car.origin}</td>
                <td className="px-5 py-4 text-zinc-300">{fmt(car.purchase_price)}</td>
                <td className="px-5 py-4 text-white font-medium">{fmt(car.selling_price)}</td>
                <td className="px-5 py-4"><Badge label={car.status} /></td>
                <td className="px-5 py-4">
                  <button onClick={() => setSelected(car)} className="text-zinc-600 hover:text-white text-xs tracking-wider uppercase transition-colors">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal title={`${selected.make} ${selected.model}`} onClose={() => setSelected(null)}>
          <div className="grid grid-cols-2 gap-5 mb-6">
            {([
              ["ID", selected.id], ["VIN", selected.vin], ["Chassis", selected.chassis_no],
              ["Year", selected.year], ["Color", selected.color], ["Origin", selected.origin],
              ["Port", selected.port], ["Engine", `${selected.engine_cc}cc`],
              ["Transmission", selected.transmission], ["Fuel", selected.fuel_type],
              ["Mileage", `${selected.mileage} km`], ["Import Date", selected.import_date],
              ["Purchase Price", fmt(selected.purchase_price)], ["Selling Price", fmt(selected.selling_price)],
              ["Customs Duty", fmt(selected.customs_duty)], ["Shipping", fmt(selected.shipping_cost)],
            ] as [string, string | number][]).map(([k, v]) => (
              <div key={k}>
                <p className="text-[9px] tracking-[0.25em] uppercase text-zinc-600 mb-1">{k}</p>
                <p className="text-white text-sm">{v}</p>
              </div>
            ))}
            <div className="col-span-2">
              <p className="text-[9px] tracking-[0.25em] uppercase text-zinc-600 mb-2">Featured on Website</p>
              <button onClick={() => toggleFeatured(selected.id, selected.featured)} className={`text-xs px-3 py-1.5 border transition-colors ${selected.featured ? "border-white text-white bg-white/10" : "border-white/20 text-zinc-500 hover:border-white/40"}`}>
                {selected.featured ? "✓ Featured — click to remove" : "Set as Featured"}
              </button>
            </div>
          </div>
          <div className="border-t border-white/10 pt-5">
            <p className="text-[9px] tracking-[0.25em] uppercase text-zinc-600 mb-3">Change Status</p>
            <div className="flex gap-2 flex-wrap">
              {["Available", "Reserved", "In Transit", "Sold"].map(s => (
                <button key={s} onClick={() => updateStatus(selected.id, s)} className={`px-4 py-2 text-xs tracking-wider uppercase border transition-all ${selected.status === s ? "bg-white text-black border-white" : "border-white/20 text-zinc-400 hover:border-white/50 hover:text-white"}`}>{s}</button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {showAdd && (
        <Modal title="Add New Vehicle" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            {([
              ["Vehicle ID", "id", "e.g. INV-009"],
              ["Make", "make", "e.g. Toyota"],
              ["Model", "model", "e.g. Land Cruiser"],
              ["Year", "year", "2024"],
              ["Color", "color", "Pearl White"],
              ["VIN", "vin", "VIN number"],
              ["Chassis No", "chassis_no", "CH-XXXXX"],
              ["Origin", "origin", "Japan"],
              ["Port", "port", "Chittagong"],
              ["Engine CC", "engine_cc", "4608"],
              ["Transmission", "transmission", "Automatic"],
              ["Purchase Price", "purchase_price", "8500000"],
              ["Selling Price", "selling_price", "11200000"],
              ["Customs Duty", "customs_duty", "1200000"],
              ["Shipping Cost", "shipping_cost", "450000"],
              ["Mileage", "mileage", "0"],
            ] as [string, string, string][]).map(([label, key, placeholder]) => (
              <Field key={key} label={label}>
                <Input
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </Field>
            ))}
            <Field label="Import Date">
              <Input type="date" value={form.import_date} onChange={e => setForm(p => ({ ...p, import_date: e.target.value }))} />
            </Field>
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
          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10 hover:border-white/30">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold hover:bg-zinc-200 disabled:opacity-50">
              {saving ? "Saving…" : "Add Vehicle"}
            </button>
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
    const { error } = await supabase.from("customers").insert([{
      id: `CUS-${Date.now()}`,
      ...form, join_date: new Date().toISOString().split("T")[0], status: "Active",
    }]);
    setSaving(false);
    if (!error) { setShowAdd(false); load(); }
    else alert("Error: " + error.message);
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-white tracking-wide">Customers</h1>
          <p className="text-zinc-500 text-sm mt-1">{customers.length} registered</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200">+ Add</button>
      </div>
      <div className="flex items-center gap-3 border border-white/10 px-4 py-2 bg-[#0a0a0a]">
        <span className="text-zinc-600 text-xs">⌕</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…" className="bg-transparent text-sm text-white placeholder-zinc-600 outline-none w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
        {filtered.map(c => (
          <div key={c.id} className="bg-[#0a0a0a] p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-white font-light text-lg">{c.name?.[0]}</div>
              <Badge label={c.type} />
            </div>
            <p className="text-white font-medium">{c.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{c.phone}</p>
            <p className="text-zinc-600 text-xs">{c.email}</p>
            <p className="text-zinc-700 text-xs mt-1">{c.address}</p>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <span className="text-xs text-zinc-600">Since {c.join_date}</span>
              <Badge label={c.status} />
            </div>
            {c.notes && <p className="text-xs text-zinc-500 mt-2 italic">"{c.notes}"</p>}
          </div>
        ))}
      </div>
      {showAdd && (
        <Modal title="Add Customer" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            {([["Full Name", "name"], ["Phone", "phone"], ["Email", "email"], ["NID / TIN", "nid"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}>
                <Input placeholder={label} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </Field>
            ))}
            <div className="col-span-2">
              <Field label="Address">
                <Input placeholder="Address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </Field>
            </div>
            <Field label="Type">
              <Select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option>Individual</option><option>Corporate</option>
              </Select>
            </Field>
            <div className="col-span-2">
              <Field label="Notes">
                <Input placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </Field>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold disabled:opacity-50">
              {saving ? "Saving…" : "Add"}
            </button>
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
  const [form, setForm] = useState({
    car_id: "", customer_id: "", sale_date: "", sale_price: "",
    down_payment: "", payment_method: "Full", salesperson: "", discount: "0", notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [s, v, c] = await Promise.all([
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
      supabase.from("vehicles").select("*"),
      supabase.from("customers").select("*"),
    ]);
    setSales(s.data || []);
    setVehicles(v.data || []);
    setCustomers(c.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("sales").insert([{
      id: `SAL-${Date.now()}`,
      car_id: form.car_id, customer_id: form.customer_id,
      sale_date: form.sale_date, sale_price: parseInt(form.sale_price),
      down_payment: parseInt(form.down_payment),
      payment_method: form.payment_method, salesperson: form.salesperson,
      discount: parseInt(form.discount), notes: form.notes, status: "Completed",
    }]);
    if (!error) {
      await supabase.from("vehicles").update({ status: "Sold" }).eq("id", form.car_id);
      setShowAdd(false); load();
    } else alert("Error: " + error.message);
    setSaving(false);
  };

  if (loading) return <Spinner />;

  const rev = sales.reduce((a, s) => a + (s.sale_price || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-white tracking-wide">Sales</h1>
          <p className="text-zinc-500 text-sm mt-1">{sales.length} transactions</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200">+ New Sale</button>
      </div>
      <div className="grid grid-cols-3 gap-px bg-white/5">
        <StatCard label="Total Revenue" value={fmt(rev)} />
        <StatCard label="Avg. Sale" value={sales.length ? fmt(rev / sales.length) : "—"} />
        <StatCard label="Total Discounts" value={fmt(sales.reduce((a, s) => a + (s.discount || 0), 0))} />
      </div>
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Sale ID", "Vehicle", "Customer", "Date", "Sale Price", "Method", "Salesperson", "Status"].map(h => (
                <th key={h} className="text-left text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-600 px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map(s => {
              const car = vehicles.find(v => v.id === s.car_id);
              const cust = customers.find(c => c.id === s.customer_id);
              return (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-5 py-4 text-zinc-500 font-mono text-xs">{s.id}</td>
                  <td className="px-5 py-4 text-white">{car ? `${car.make} ${car.model}` : s.car_id}</td>
                  <td className="px-5 py-4 text-zinc-300">{cust?.name || s.customer_id}</td>
                  <td className="px-5 py-4 text-zinc-500 text-xs">{s.sale_date}</td>
                  <td className="px-5 py-4 text-white font-medium">{fmt(s.sale_price)}</td>
                  <td className="px-5 py-4"><Badge label={s.payment_method} /></td>
                  <td className="px-5 py-4 text-zinc-500 text-xs">{s.salesperson}</td>
                  <td className="px-5 py-4"><Badge label={s.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showAdd && (
        <Modal title="Record New Sale" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Vehicle">
              <Select value={form.car_id} onChange={e => setForm(p => ({ ...p, car_id: e.target.value }))}>
                <option value="">Select vehicle</option>
                {vehicles.filter(v => v.status === "Available" || v.status === "Reserved").map(v => (
                  <option key={v.id} value={v.id}>{v.id} — {v.make} {v.model}</option>
                ))}
              </Select>
            </Field>
            <Field label="Customer">
              <Select value={form.customer_id} onChange={e => setForm(p => ({ ...p, customer_id: e.target.value }))}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            {([["Sale Date", "sale_date", "date"], ["Sale Price (৳)", "sale_price", "text"], ["Down Payment (৳)", "down_payment", "text"], ["Discount (৳)", "discount", "text"], ["Salesperson", "salesperson", "text"]] as [string, string, string][]).map(([label, key, type]) => (
              <Field key={key} label={label}>
                <Input type={type} placeholder={label} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </Field>
            ))}
            <Field label="Payment Method">
              <Select value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                <option>Full</option><option>Installment</option><option>Bank Finance</option>
              </Select>
            </Field>
            <div className="col-span-2">
              <Field label="Notes"><Input placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></Field>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold disabled:opacity-50">
              {saving ? "Saving…" : "Record Sale"}
            </button>
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
  const [form, setForm] = useState({
    origin: "", destination: "", vessel: "", bl_number: "",
    etd: "", eta: "", agent: "", freight: "", status: "In Transit",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("shipments").select("*").order("created_at", { ascending: false });
    setShipments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("shipments").insert([{
      id: `SHP-${Date.now()}`, ...form, freight: parseInt(form.freight),
    }]);
    setSaving(false);
    if (!error) { setShowAdd(false); load(); }
    else alert("Error: " + error.message);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-light text-white tracking-wide">Shipments</h1>
        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200">+ New</button>
      </div>
      <div className="space-y-px">
        {shipments.length === 0 && <p className="text-zinc-600 text-sm py-8 text-center">No shipments yet.</p>}
        {shipments.map(s => (
          <div key={s.id} className="bg-[#0a0a0a] border border-white/8 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex gap-3 items-center mb-1">
                  <span className="font-mono text-xs text-zinc-500">{s.id}</span>
                  <Badge label={s.status} />
                </div>
                <p className="text-white font-medium">{s.origin} → {s.destination}</p>
                <p className="text-zinc-500 text-xs mt-1">Vessel: {s.vessel} · B/L: {s.bl_number}</p>
              </div>
              <p className="text-white font-medium text-sm">{fmt(s.freight)}</p>
            </div>
            <div className="grid grid-cols-4 gap-6 text-xs border-t border-white/5 pt-4">
              {([["ETD", s.etd], ["ETA", s.eta], ["Agent", s.agent], ["Status", s.status]] as [string, string][]).map(([k, v]) => (
                <div key={k}>
                  <p className="text-zinc-600 uppercase tracking-wider mb-1 text-[9px]">{k}</p>
                  <p className="text-white">{v}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <Modal title="New Shipment" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            {([["Origin Port", "origin"], ["Destination Port", "destination"], ["Vessel Name", "vessel"], ["B/L Number", "bl_number"], ["Shipping Agent", "agent"], ["Freight Cost (৳)", "freight"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}>
                <Input placeholder={label} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </Field>
            ))}
            <Field label="ETD"><Input type="date" value={form.etd} onChange={e => setForm(p => ({ ...p, etd: e.target.value }))} /></Field>
            <Field label="ETA"><Input type="date" value={form.eta} onChange={e => setForm(p => ({ ...p, eta: e.target.value }))} /></Field>
            <Field label="Status">
              <Select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option>In Transit</option><option>Delivered</option><option>Delayed</option>
              </Select>
            </Field>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold disabled:opacity-50">
              {saving ? "Saving…" : "Create"}
            </button>
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
    setStaff(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("staff").insert([{
      id: `STF-${Date.now()}`, ...form, salary: parseInt(form.salary), status: "Active",
    }]);
    setSaving(false);
    if (!error) { setShowAdd(false); load(); }
    else alert("Error: " + error.message);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-light text-white tracking-wide">Staff & HR</h1>
        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200">+ Add Staff</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
        {staff.map(s => (
          <div key={s.id} className="bg-[#0a0a0a] p-6 flex gap-4">
            <div className="w-12 h-12 border border-white/20 flex items-center justify-center text-white text-lg font-light flex-shrink-0">{s.name?.[0]}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium">{s.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{s.role} · {s.department}</p>
                </div>
                <Badge label={s.status} />
              </div>
              <p className="text-zinc-600 text-xs mt-2">{s.phone}</p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                <span className="text-xs text-zinc-600">Since {s.join_date}</span>
                <span className="text-white text-sm">{fmt(s.salary)}<span className="text-zinc-600 text-xs">/mo</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <Modal title="Add Staff" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            {([["Full Name", "name"], ["Role", "role"], ["Phone", "phone"], ["Email", "email"], ["Monthly Salary (৳)", "salary"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}>
                <Input placeholder={label} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </Field>
            ))}
            <Field label="Join Date"><Input type="date" value={form.join_date} onChange={e => setForm(p => ({ ...p, join_date: e.target.value }))} /></Field>
            <Field label="Department">
              <Select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                <option>Sales</option><option>Import</option><option>Finance</option><option>Operations</option>
              </Select>
            </Field>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold disabled:opacity-50">
              {saving ? "Saving…" : "Add Staff"}
            </button>
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
    const [s, e] = await Promise.all([
      supabase.from("sales").select("*"),
      supabase.from("expenses").select("*").order("date", { ascending: false }),
    ]);
    setSales(s.data || []);
    setExpenses(e.data || []);
    setLoading(false);
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
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-light text-white tracking-wide">Finance</h1>
        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200">+ Add Expense</button>
      </div>
      <div className="grid grid-cols-3 gap-px bg-white/5">
        <StatCard label="Total Revenue" value={fmt(rev)} />
        <StatCard label="Total Expenses" value={fmt(exp)} />
        <StatCard label="Net Profit" value={fmt(rev - exp)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Expenses by Category</p>
          {cats.map(cat => {
            const total = expenses.filter(e => e.category === cat).reduce((a, e) => a + e.amount, 0);
            const pct = exp ? Math.round((total / exp) * 100) : 0;
            return (
              <div key={cat} className="mb-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-300">{cat}</span>
                  <span className="text-zinc-600">{fmt(total)}</span>
                </div>
                <div className="h-px bg-white/8"><div className="h-px bg-white" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Recent Expenses</p>
          {expenses.slice(0, 8).map(e => (
            <div key={e.id} className="flex justify-between items-center py-3 border-b border-white/5">
              <div>
                <p className="text-zinc-300 text-xs">{e.description}</p>
                <p className="text-zinc-600 text-xs">{e.category} · {e.date}</p>
              </div>
              <p className="text-white text-sm">-{fmt(e.amount)}</p>
            </div>
          ))}
        </div>
      </div>
      {showAdd && (
        <Modal title="Add Expense" onClose={() => setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {["Shipping", "Customs & Taxes", "Staff Salary", "Showroom Rent", "Insurance", "Marketing", "Maintenance", "Other"].map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Amount (৳)"><Input placeholder="Amount" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></Field>
            <Field label="Date"><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></Field>
            <Field label="Paid To"><Input placeholder="Recipient" value={form.paid_to} onChange={e => setForm(p => ({ ...p, paid_to: e.target.value }))} /></Field>
            <Field label="Reference"><Input placeholder="e.g. SHP-001" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} /></Field>
            <div className="col-span-2"><Field label="Description"><Input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></Field></div>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10">Cancel</button>
            <button onClick={handleAdd} disabled={saving} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold disabled:opacity-50">
              {saving ? "Saving…" : "Add Expense"}
            </button>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">Website Enquiries</h1>
        <p className="text-zinc-500 text-sm mt-1">{enquiries.length} total · {enquiries.filter(e => e.status === "new").length} new</p>
      </div>
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Name", "Phone", "Email", "Type", "Vehicle", "Message", "Date", "Status", ""].map(h => (
                <th key={h} className="text-left text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-600 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enquiries.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-600 text-sm">No enquiries yet.</td></tr>
            )}
            {enquiries.map(e => (
              <tr key={e.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="px-4 py-3 text-white text-xs font-medium">{e.name}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{e.phone}</td>
                <td className="px-4 py-3 text-zinc-400 text-xs">{e.email}</td>
                <td className="px-4 py-3"><Badge label={e.type} /></td>
                <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{e.vehicle_id || "—"}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs max-w-xs truncate">{e.message}</td>
                <td className="px-4 py-3 text-zinc-600 text-xs">{new Date(e.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3"><Badge label={e.status} /></td>
                <td className="px-4 py-3">
                  {e.status === "new" && (
                    <button onClick={() => updateStatus(e.id, "contacted")} className="text-[9px] uppercase tracking-wider text-zinc-600 border border-white/10 px-2 py-1 hover:border-white/30 hover:text-white transition-all">
                      Mark Contacted
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    const load = async () => {
      const [v, s] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("site_settings").select("*"),
      ]);
      setVehicles(v.data || []);
      const map: Record<string, string> = {};
      (s.data || []).forEach((r: any) => { map[r.key] = r.value; });
      setSettings(map);
      setLoading(false);
    };
    load();
  }, []);

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("vehicles").update({ featured: !current }).eq("id", id);
    setVehicles(p => p.map(v => v.id === id ? { ...v, featured: !current } : v));
  };

  const saveSetting = async (key: string, value: string) => {
    setSettings(p => ({ ...p, [key]: value }));
    await supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  };

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(Object.entries(settings).map(([key, value]) =>
      supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() })
    ));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">Website CMS</h1>
        <p className="text-zinc-500 text-sm mt-1">Changes save directly to the live website database</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Hero Section</p>
          <div className="space-y-4">
            <Field label="Hero Headline">
              <input className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 placeholder-zinc-600" value={settings.hero_title || ""} onChange={e => setSettings(p => ({ ...p, hero_title: e.target.value }))} />
            </Field>
            <Field label="Hero Subtitle">
              <textarea rows={3} className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 resize-none" value={settings.hero_subtitle || ""} onChange={e => setSettings(p => ({ ...p, hero_subtitle: e.target.value }))} />
            </Field>
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Contact Info</p>
          <div className="space-y-3">
            {([["Showroom Address", "showroom_address"], ["Phone Number", "phone"], ["Email Address", "email"], ["Business Hours", "business_hours"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}>
                <input className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 placeholder-zinc-600" placeholder={label} value={settings[key] || ""} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} />
              </Field>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Featured Vehicles on Homepage</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {vehicles.map(car => (
              <button key={car.id} onClick={() => toggleFeatured(car.id, car.featured)} className={`p-3 text-left border transition-all ${car.featured ? "border-white bg-white/8" : "border-white/10 hover:border-white/30"}`}>
                <p className="text-white text-xs font-medium">{car.make} {car.model}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{car.year} · {car.status}</p>
                {car.featured && <p className="text-white text-xs mt-1 font-semibold">✓ Featured</p>}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Announcement Banner</p>
          <div className="space-y-3">
            <Field label="Banner Text">
              <input className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 placeholder-zinc-600" placeholder="e.g. New arrivals — March 2025" value={settings.announcement_text || ""} onChange={e => setSettings(p => ({ ...p, announcement_text: e.target.value }))} />
            </Field>
            <div className="flex items-center gap-3 mt-2">
              <input type="checkbox" id="annActive" checked={settings.announcement_active === "true"} onChange={e => setSettings(p => ({ ...p, announcement_active: e.target.checked ? "true" : "false" }))} className="accent-white" />
              <label htmlFor="annActive" className="text-xs text-zinc-500 tracking-wider uppercase cursor-pointer">Show Banner on Website</label>
            </div>
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">SEO</p>
          <div className="space-y-3">
            {([["Page Title", "seo_title"], ["Meta Description", "seo_description"], ["Keywords", "seo_keywords"]] as [string, string][]).map(([label, key]) => (
              <Field key={key} label={label}>
                <input className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 placeholder-zinc-600" placeholder={label} value={settings[key] || ""} onChange={e => setSettings(p => ({ ...p, [key]: e.target.value }))} />
              </Field>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={saveAll} disabled={saving} className={`px-8 py-3 text-xs font-semibold tracking-[0.25em] uppercase transition-all disabled:opacity-50 ${saved ? "bg-zinc-700 text-zinc-300" : "bg-white text-black hover:bg-zinc-200"}`}>
          {saving ? "Saving…" : saved ? "✓ Saved to Database" : "Save All Changes"}
        </button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   CUSTOMS, REPORTS, SETTINGS (static UI)
══════════════════════════════════════════════════════════════ */
const Customs = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-light text-white tracking-wide">Customs & Duties</h1>
    <p className="text-zinc-600 text-sm">Link customs clearance records to shipments. Add via Supabase dashboard or extend this section.</p>
  </div>
);

const Reports = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-light text-white tracking-wide">Reports</h1>
    <div className="flex gap-2 flex-wrap">
      {["This Month", "Last Month", "Q1 2025", "FY 2024–25"].map(r => (
        <button key={r} className="px-4 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase bg-[#0a0a0a] text-zinc-500 border border-white/10 hover:border-white/30 hover:text-white transition-all">{r}</button>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
      {[["Monthly Sales Report", "Revenue, units sold, salesperson performance"], ["Inventory Valuation", "Current stock value and holding costs"], ["Import Cost Analysis", "Shipping, customs, duties per unit"], ["Profit & Loss Statement", "Full P&L with all categories"], ["Customer Activity Report", "Leads, conversion, repeat buyers"], ["Tax & Compliance Report", "NBR duties, VAT, advance tax"], ["Staff Payroll Report", "Monthly salary disbursement"], ["Vehicle Aging Report", "Days in stock per vehicle"]].map(([name, desc]) => (
        <div key={name} className="bg-[#0a0a0a] p-6 flex items-center justify-between group hover:bg-white/2 transition-colors cursor-pointer">
          <div>
            <p className="text-white text-sm font-medium">{name}</p>
            <p className="text-zinc-600 text-xs mt-1">{desc}</p>
          </div>
          <button className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 border border-white/10 px-3 py-1.5 group-hover:border-white/30 group-hover:text-white transition-all">Export</button>
        </div>
      ))}
    </div>
  </div>
);

const Settings = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-light text-white tracking-wide">Settings</h1>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
      {[{ title: "Company Profile", fields: ["Company Name", "Trade License No", "TIN Number", "VAT Registration", "Registered Address"] }, { title: "Showroom Details", fields: ["Showroom Name", "Address", "Phone", "Email", "Business Hours"] }, { title: "Bank Accounts", fields: ["Bank Name", "Account No", "Branch", "Routing No", "SWIFT Code"] }, { title: "System Preferences", fields: ["Default Currency", "Timezone", "Date Format", "Language"] }].map(sec => (
        <div key={sec.title} className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">{sec.title}</p>
          <div className="space-y-4">
            {sec.fields.map(f => (
              <div key={f}>
                <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-2">{f}</label>
                <input placeholder={f === "Company Name" ? "Car House Imports Ltd." : f} className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 placeholder-zinc-600" />
              </div>
            ))}
          </div>
          <button className="mt-5 px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors">Save</button>
        </div>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   NAV
══════════════════════════════════════════════════════════════ */
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "inventory", label: "Inventory", icon: "◻" },
  { id: "sales", label: "Sales", icon: "◇" },
  { id: "customers", label: "Customers", icon: "○" },
  { id: "shipments", label: "Shipments", icon: "△" },
  { id: "enquiries", label: "Enquiries", icon: "✉" },
  { id: "finance", label: "Finance", icon: "◎" },
  { id: "staff", label: "Staff & HR", icon: "◉" },
  { id: "website", label: "Website CMS", icon: "⊞" },
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push("/login"); }
      else { setUser(session.user); setLoading(false); }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );

  const PAGES: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />, inventory: <Inventory />, sales: <Sales />,
    customers: <Customers />, shipments: <Shipments />, enquiries: <Enquiries />,
    finance: <Finance />, staff: <Staff />, website: <WebsiteCMS />,
    customs: <Customs />, reports: <Reports />, settings: <Settings />,
  };

  return (
    <div className="min-h-screen flex bg-black text-white" style={{ fontFamily: "'Barlow',system-ui,sans-serif" }}>
      <aside className={`${collapsed ? "w-14" : "w-56"} flex-shrink-0 border-r border-white/8 flex flex-col transition-all duration-300 bg-[#080808]`}>
        <div className="p-4 border-b border-white/8 flex items-center gap-3 h-16">
          {!collapsed && (
            <div>
              <p className="text-white text-xs font-semibold tracking-[0.15em] uppercase">Car House</p>
              <p className="text-zinc-600 text-[9px] tracking-[0.2em] uppercase">Imports Ltd.</p>
            </div>
          )}
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setActive(n.id)} title={collapsed ? n.label : ""} className={`w-full flex items-center gap-3 px-3 py-2.5 mb-0.5 transition-all text-left ${active === n.id ? "bg-white text-black" : "text-zinc-500 hover:text-white hover:bg-white/5"}`}>
              <span className="text-sm flex-shrink-0">{n.icon}</span>
              {!collapsed && <span className="text-[11px] font-medium tracking-[0.12em] uppercase">{n.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-white/8">
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-600 hover:text-white hover:bg-white/5 transition-all">
            <span className="text-sm">{collapsed ? "→" : "←"}</span>
            {!collapsed && <span className="text-[10px] tracking-[0.15em] uppercase">Collapse</span>}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-600 hover:text-white hover:bg-white/5 transition-all">
            <span className="text-sm">↑</span>
            {!collapsed && <span className="text-[10px] tracking-[0.15em] uppercase">Logout</span>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/8 flex items-center justify-between px-8 bg-[#080808]">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500">
            {NAV.find(n => n.id === active)?.label}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-zinc-600 text-xs hidden md:block">{user?.email}</span>
            <div className="w-7 h-7 border border-white/20 flex items-center justify-center text-white text-xs font-light">
              {user?.email?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {PAGES[active]}
        </main>
      </div>
    </div>
  );
}
