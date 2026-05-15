"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";


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
  image_url: string; gallery_urls: string[];
  show_horizontal: boolean; show_vault_feature: boolean;
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

const StatCard = ({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) => (
  <div className="border border-white/10 p-6 bg-[#0a0a0a]">
    <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-3">{label}</p>
    <p className="text-3xl font-light mb-1" style={{ color: accent || 'white' }}>{value}</p>
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
    customs_duty: "", shipping_cost: "", import_date: "", image_url: "",
  });
  const [imgUploading, setImgUploading] = useState(false);
  const vehicleImgRef = useRef<HTMLInputElement>(null);

  const handleVehicleImageUpload = async (file: File) => {
    setImgUploading(true);
    const path = `vehicles/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("car-images").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("car-images").getPublicUrl(path);
      setForm(p => ({ ...p, image_url: data.publicUrl }));
    }
    setImgUploading(false);
  };

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
      image_url: form.image_url,
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
            <div className="col-span-2">
              <Field label="Cover Image">
                <div className="flex gap-3 items-center">
                  <input ref={vehicleImgRef} type="file" accept="image/*" className="hidden"
                    onChange={e => e.target.files?.[0] && handleVehicleImageUpload(e.target.files[0])} />
                  <button
                    type="button"
                    onClick={() => vehicleImgRef.current?.click()}
                    disabled={imgUploading}
                    className="border border-white/10 text-zinc-400 text-xs px-4 py-2 hover:border-white/30 hover:text-white transition-all disabled:opacity-40"
                  >
                    {imgUploading ? "Uploading…" : "Upload Image"}
                  </button>
                  {form.image_url && (
                    <img src={form.image_url} className="h-9 w-14 object-cover border border-white/10" alt="preview" />
                  )}
                  {form.image_url && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, image_url: "" }))}
                      className="text-[10px] text-red-500/60 hover:text-red-400 uppercase tracking-wider">
                      Remove
                    </button>
                  )}
                </div>
              </Field>
            </div>
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
/* ══════════════════════════════════════════════════════════════
   WEBSITE CMS
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   WEBSITE CMS  — full version
   Covers: Hero · Slides · Featured · About · Network · Advisory
           Partners · Market Updates · FAQ · Contact · Social
           Heritage · AI Concierge · SEO · Announcement
══════════════════════════════════════════════════════════════ */
const WebsiteCMS = () => {
  type Tab = "hero" | "slides" | "featured" | "horizontal" | "vault" | "about" | "network" | "advisory" | "partners" | "updates" | "faq" | "contact" | "social" | "heritage" | "ai" | "seo" | "announcement";
  const [tab, setTab] = useState<Tab>("hero");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [slides, setSlides] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // slide form
  const [slideForm, setSlideForm] = useState({ title: "", subtitle: "", image_url: "", cta_text: "View Inventory", cta_link: "/inventory", sort_order: "0", is_active: true });
  const [editingSlide, setEditingSlide] = useState<any>(null);
  const [slideSaving, setSlideSaving] = useState(false);
  const [slideUploading, setSlideUploading] = useState(false);
  const slideFileRef = useRef<HTMLInputElement>(null);

  // about upload
  const [aboutUploading, setAboutUploading] = useState(false);
  const aboutFileRef = useRef<HTMLInputElement>(null);

  // advisory upload
  const [advUploading, setAdvUploading] = useState(false);
  const advFileRef = useRef<HTMLInputElement>(null);

  // update form
  const UPDATE_TYPES = ["Market Alert", "Logistics", "Global News", "Auction Result"];
  const [updateForm, setUpdateForm] = useState({ type: "Market Alert", title: "", description: "", urgent: false, sort_order: "0" });
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  const [updateSaving, setUpdateSaving] = useState(false);

  // partner form
  const [partnerForm, setPartnerForm] = useState({ name: "", region: "", sort_order: "0" });
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [partnerSaving, setPartnerSaving] = useState(false);

  // faq form
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", sort_order: "0" });
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [faqSaving, setFaqSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Homepage", "Pages", "Global"]);

  // ── load ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [v, s, sl, u, p, f] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("site_settings").select("*"),
        supabase.from("hero_slides").select("*").order("sort_order"),
        supabase.from("market_updates").select("*").order("sort_order"),
        supabase.from("partners").select("*").order("sort_order"),
        supabase.from("faq_items").select("*").order("sort_order"),
      ]);
      setVehicles(v.data || []);
      const map: Record<string, string> = {};
      (s.data || []).forEach((r: any) => { map[r.key] = r.value; });
      setSettings(map);
      setSlides(sl.data || []);
      setUpdates(u.data || []);
      setPartners(p.data || []);
      setFaqs(f.data || []);
      setLoading(false);
    })();
  }, []);

  // ── helpers ───────────────────────────────────────────────────
  const S = (key: string, val: string) => setSettings(p => ({ ...p, [key]: val }));

  const saveAll = async () => {
    setSaving(true);
    await Promise.all(Object.entries(settings).map(([key, value]) =>
      supabase.from("site_settings").upsert({ key, value, updated_at: new Date().toISOString() })
    ));
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
  };

  const toggleFeatured = async (id: string, cur: boolean) => {
    await supabase.from("vehicles").update({ featured: !cur }).eq("id", id);
    setVehicles(p => p.map(v => v.id === id ? { ...v, featured: !cur } : v));
  };
  const toggleHorizontal = async (id: string, cur: boolean) => {
    await supabase.from("vehicles").update({ show_horizontal: !cur }).eq("id", id);
    setVehicles(p => p.map(v => v.id === id ? { ...v, show_horizontal: !cur } : v));
  };

  const toggleVaultFeature = async (id: string, cur: boolean) => {
    await supabase.from("vehicles").update({ show_vault_feature: !cur }).eq("id", id);
    setVehicles(p => p.map(v => v.id === id ? { ...v, show_vault_feature: !cur } : v));
  };

  // ── image upload util ─────────────────────────────────────────
  const uploadImg = async (file: File, folder: string, onDone: (url: string) => void, setLoading: (v: boolean) => void) => {
    setLoading(true);
    const path = `${folder}/${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("car-images").upload(path, file, { upsert: true });
    if (!error) { const { data } = supabase.storage.from("car-images").getPublicUrl(path); onDone(data.publicUrl); }
    setLoading(false);
  };

  // ── slide CRUD ────────────────────────────────────────────────
  const openNewSlide = () => { setEditingSlide(null); setSlideForm({ title: "", subtitle: "", image_url: "", cta_text: "View Inventory", cta_link: "/inventory", sort_order: String(slides.length), is_active: true }); };
  const openEditSlide = (s: any) => { setEditingSlide(s); setSlideForm({ title: s.title, subtitle: s.subtitle || "", image_url: s.image_url, cta_text: s.cta_text, cta_link: s.cta_link, sort_order: String(s.sort_order), is_active: s.is_active }); };
  const saveSlide = async () => {
    if (!slideForm.title || !slideForm.image_url) return;
    setSlideSaving(true);
    const payload = { ...slideForm, sort_order: parseInt(slideForm.sort_order) || 0 };
    if (editingSlide) await supabase.from("hero_slides").update(payload).eq("id", editingSlide.id);
    else await supabase.from("hero_slides").insert([payload]);
    const { data } = await supabase.from("hero_slides").select("*").order("sort_order");
    setSlides(data || []); setEditingSlide(null); openNewSlide(); setSlideSaving(false);
  };
  const deleteSlide = async (id: number) => {
    if (!confirm("Delete slide?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    setSlides(p => p.filter(s => s.id !== id));
  };
  const toggleSlideActive = async (s: any) => {
    await supabase.from("hero_slides").update({ is_active: !s.is_active }).eq("id", s.id);
    setSlides(p => p.map(sl => sl.id === s.id ? { ...sl, is_active: !s.is_active } : sl));
  };

  // ── update CRUD ───────────────────────────────────────────────
  const openNewUpdate = () => { setEditingUpdate(null); setUpdateForm({ type: "Market Alert", title: "", description: "", urgent: false, sort_order: String(updates.length) }); };
  const openEditUpdate = (u: any) => { setEditingUpdate(u); setUpdateForm({ type: u.type, title: u.title, description: u.description, urgent: u.urgent, sort_order: String(u.sort_order) }); };
  const saveUpdate = async () => {
    if (!updateForm.title || !updateForm.description) return;
    setUpdateSaving(true);
    const payload = { ...updateForm, sort_order: parseInt(updateForm.sort_order) || 0, published: true };
    if (editingUpdate) await supabase.from("market_updates").update(payload).eq("id", editingUpdate.id);
    else await supabase.from("market_updates").insert([payload]);
    const { data } = await supabase.from("market_updates").select("*").order("sort_order");
    setUpdates(data || []); setEditingUpdate(null); openNewUpdate(); setUpdateSaving(false);
  };
  const deleteUpdate = async (id: number) => {
    if (!confirm("Delete this update?")) return;
    await supabase.from("market_updates").delete().eq("id", id);
    setUpdates(p => p.filter(u => u.id !== id));
  };
  const toggleUpdatePublished = async (u: any) => {
    await supabase.from("market_updates").update({ published: !u.published }).eq("id", u.id);
    setUpdates(p => p.map(x => x.id === u.id ? { ...x, published: !u.published } : x));
  };

  // ── partner CRUD ──────────────────────────────────────────────
  const openNewPartner = () => { setEditingPartner(null); setPartnerForm({ name: "", region: "", sort_order: String(partners.length) }); };
  const openEditPartner = (p: any) => { setEditingPartner(p); setPartnerForm({ name: p.name, region: p.region, sort_order: String(p.sort_order) }); };
  const savePartner = async () => {
    if (!partnerForm.name) return;
    setPartnerSaving(true);
    const payload = { ...partnerForm, sort_order: parseInt(partnerForm.sort_order) || 0, is_active: true };
    if (editingPartner) await supabase.from("partners").update(payload).eq("id", editingPartner.id);
    else await supabase.from("partners").insert([payload]);
    const { data } = await supabase.from("partners").select("*").order("sort_order");
    setPartners(data || []); setEditingPartner(null); openNewPartner(); setPartnerSaving(false);
  };
  const deletePartner = async (id: number) => {
    if (!confirm("Delete partner?")) return;
    await supabase.from("partners").delete().eq("id", id);
    setPartners(p => p.filter(x => x.id !== id));
  };
  const togglePartnerActive = async (p: any) => {
    await supabase.from("partners").update({ is_active: !p.is_active }).eq("id", p.id);
    setPartners(x => x.map(r => r.id === p.id ? { ...r, is_active: !p.is_active } : r));
  };

  // ── faq CRUD ──────────────────────────────────────────────────
  const openNewFaq = () => { setEditingFaq(null); setFaqForm({ question: "", answer: "", sort_order: String(faqs.length) }); };
  const openEditFaq = (f: any) => { setEditingFaq(f); setFaqForm({ question: f.question, answer: f.answer, sort_order: String(f.sort_order) }); };
  const saveFaq = async () => {
    if (!faqForm.question || !faqForm.answer) return;
    setFaqSaving(true);
    const payload = { ...faqForm, sort_order: parseInt(faqForm.sort_order) || 0, is_active: true };
    if (editingFaq) await supabase.from("faq_items").update(payload).eq("id", editingFaq.id);
    else await supabase.from("faq_items").insert([payload]);
    const { data } = await supabase.from("faq_items").select("*").order("sort_order");
    setFaqs(data || []); setEditingFaq(null); openNewFaq(); setFaqSaving(false);
  };
  const deleteFaq = async (id: number) => {
    if (!confirm("Delete FAQ?")) return;
    await supabase.from("faq_items").delete().eq("id", id);
    setFaqs(p => p.filter(x => x.id !== id));
  };

  if (loading) return <Spinner />;

  // ── shared styles ─────────────────────────────────────────────
  const inp = "w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 placeholder-zinc-600";
  const ta = "w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 resize-none";
  const btn = "px-6 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-all disabled:opacity-40";
  const btnGhost = "px-5 py-2.5 border border-white/10 text-zinc-500 text-xs tracking-[0.2em] uppercase hover:border-white/30 hover:text-white transition-all";

  const UploadBtn = ({ uploading, onClick, label = "Upload Image" }: { uploading: boolean, onClick: () => void, label?: string }) => (
    <button onClick={onClick} disabled={uploading}
      className="border border-white/10 text-zinc-400 text-xs px-4 py-2 hover:border-white/30 hover:text-white transition-all disabled:opacity-40">
      {uploading ? "Uploading…" : label}
    </button>
  );

  const DeleteBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="text-[10px] uppercase tracking-wider text-red-500/60 border border-red-500/20 px-2 py-1 hover:border-red-500/40 hover:text-red-400 transition-all">Delete</button>
  );
  const EditBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className="text-[10px] uppercase tracking-wider text-zinc-400 border border-white/10 px-2 py-1 hover:border-white/30 hover:text-white transition-all">Edit</button>
  );
  const ActiveBadge = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
    <button onClick={onToggle}
      className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border transition-all ${active ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-white/10 text-zinc-600"}`}>
      {active ? "Live" : "Hidden"}
    </button>
  );



  // ── Tab groups config (same as before, used for sidebar) ─────
  const TAB_GROUPS = [
    {
      label: "Homepage", items: [
        { id: "hero", label: "Hero", icon: "▣" },
        { id: "slides", label: "Hero Slides", icon: "◫" },
        { id: "featured", label: "Featured Cars", icon: "★" },
        { id: "horizontal", label: "Horizontal", icon: "↔" },
        { id: "vault", label: "Vault Feature", icon: "◈" },
        { id: "network", label: "Network", icon: "◎" },
        { id: "advisory", label: "Advisory", icon: "◇" },
        { id: "partners", label: "Partners", icon: "⊕" },
      ]
    },
    {
      label: "Pages", items: [
        { id: "updates", label: "Market Updates", icon: "⚡" },
        { id: "heritage", label: "Heritage", icon: "◷" },
        { id: "faq", label: "FAQ", icon: "?" },
      ]
    },
    {
      label: "Global", items: [
        { id: "about", label: "About", icon: "◉" },
        { id: "contact", label: "Contact", icon: "○" },
        { id: "social", label: "Social", icon: "◌" },
        { id: "announcement", label: "Banner", icon: "▤" },
        { id: "ai", label: "AI Concierge", icon: "✦" },
        { id: "seo", label: "SEO", icon: "⊕" },
      ]
    },
  ];

  const toggleGroup = (label: string) =>
    setExpandedGroups(p => p.includes(label) ? p.filter(g => g !== label) : [...p, label]);

  const activeLabel = TAB_GROUPS.flatMap(g => g.items).find(i => i.id === tab)?.label ?? "";

  return (
    <div className="space-y-4">

      {/* ── Page header ── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-white tracking-wide">Website CMS</h1>
          <p className="text-zinc-500 text-sm mt-1">Changes save directly to the live website database</p>
        </div>
        <button onClick={saveAll} disabled={saving}
          className={`px-8 py-3 text-xs font-semibold tracking-[0.25em] uppercase transition-all disabled:opacity-50 ${saved ? "bg-zinc-700 text-zinc-300" : "bg-white text-black hover:bg-zinc-200"}`}>
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save All Changes"}
        </button>
      </div>

      {/* ── Main layout: sidebar + content ── */}
      <div className="flex gap-px min-h-[70vh]">

        {/* Sidebar */}
        <aside className="w-48 shrink-0 bg-[#080808] border border-white/8 flex flex-col">
          <nav className="flex-1 py-2">
            {TAB_GROUPS.map(group => {
              const isExpanded = expandedGroups.includes(group.label);
              const hasActive = group.items.some(i => i.id === tab);
              return (
                <div key={group.label} className="mb-1">
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-4 py-2 transition-all hover:bg-white/5"
                  >
                    <span className={`text-[9px] font-bold tracking-[0.2em] uppercase transition-colors ${hasActive && !isExpanded ? "text-[#c9a84c]" : "text-zinc-600"}`}>
                      {group.label}
                    </span>
                    <span className={`text-[9px] text-zinc-700 transition-transform duration-200 inline-block ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </button>

                  {/* Items */}
                  {isExpanded && (
                    <div>
                      {group.items.map(item => {
                        const isActive = tab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setTab(item.id as Tab)}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-left transition-all"
                            style={{
                              borderLeft: isActive ? "2px solid #c9a84c" : "2px solid transparent",
                              background: isActive ? "rgba(201,168,76,0.10)" : "transparent",
                              color: isActive ? "#e8c96b" : "rgba(255,255,255,0.5)",
                            }}
                            onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)"; } }}
                            onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; } }}
                          >
                            <span className="text-[11px] w-4 text-center shrink-0">{item.icon}</span>
                            <span className="text-[11px] tracking-wide whitespace-nowrap">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Content panel */}
        <div className="flex-1 min-w-0 bg-[#0a0a0a] border border-white/8 border-l-0">

          {/* Panel header */}
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-400">{activeLabel}</p>
            <p className="text-[10px] text-zinc-700 tracking-widest uppercase">Website CMS</p>
          </div>

          <div className="p-6 space-y-5">

            {/* ══ HERO ══════════════════════════════════════════ */}
            {tab === "hero" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Tagline (above headline)">
                    <input className={inp} placeholder="Automotive Excellence Since 1995" value={settings.hero_tagline || ""} onChange={e => S("hero_tagline", e.target.value)} />
                  </Field>
                  <Field label="CTA Button Text">
                    <input className={inp} placeholder="Explore Collection" value={settings.hero_cta_text || ""} onChange={e => S("hero_cta_text", e.target.value)} />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Main Headline">
                      <input className={inp} placeholder="The Art of Superiority" value={settings.hero_title || ""} onChange={e => S("hero_title", e.target.value)} />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Subtitle">
                      <textarea rows={2} className={ta} value={settings.hero_subtitle || ""} onChange={e => S("hero_subtitle", e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Background Video URL">
                    <input className={inp} placeholder="https://…mp4" value={settings.hero_video_url || ""} onChange={e => S("hero_video_url", e.target.value)} />
                  </Field>
                  <Field label="Showreel Video URL">
                    <input className={inp} placeholder="https://…mp4" value={settings.hero_showreel_url || ""} onChange={e => S("hero_showreel_url", e.target.value)} />
                  </Field>
                </div>
              </div>
            )}

            {/* ══ HERO SLIDES ═══════════════════════════════════ */}
            {tab === "slides" && (
              <div className="space-y-5">
                {/* Form */}
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">{editingSlide ? "Editing Slide" : "Add New Slide"}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Title *"><input className={inp} value={slideForm.title} onChange={e => setSlideForm(f => ({ ...f, title: e.target.value }))} placeholder="Exquisite Imports, Delivered." /></Field>
                    <Field label="Subtitle"><input className={inp} value={slideForm.subtitle} onChange={e => setSlideForm(f => ({ ...f, subtitle: e.target.value }))} /></Field>
                    <Field label="CTA Text"><input className={inp} value={slideForm.cta_text} onChange={e => setSlideForm(f => ({ ...f, cta_text: e.target.value }))} /></Field>
                    <Field label="CTA Link"><input className={inp} value={slideForm.cta_link} onChange={e => setSlideForm(f => ({ ...f, cta_link: e.target.value }))} /></Field>
                    <Field label="Sort Order"><input type="number" className={inp} value={slideForm.sort_order} onChange={e => setSlideForm(f => ({ ...f, sort_order: e.target.value }))} /></Field>
                    <Field label="Active">
                      <div className="flex items-center gap-3 h-10">
                        <input type="checkbox" checked={slideForm.is_active} onChange={e => setSlideForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-white" />
                        <label className="text-xs text-zinc-500 uppercase tracking-wider">Show on website</label>
                      </div>
                    </Field>
                    <div className="col-span-2">
                      <Field label="Background Image *">
                        <div className="flex gap-3 items-center">
                          <input ref={slideFileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImg(e.target.files[0], "hero", (url) => setSlideForm(f => ({ ...f, image_url: url })), setSlideUploading)} />
                          <UploadBtn uploading={slideUploading} onClick={() => slideFileRef.current?.click()} />
                          {slideForm.image_url && <img src={slideForm.image_url} className="h-9 w-14 object-cover border border-white/10" alt="" />}
                          <input className={`${inp} flex-1`} placeholder="or paste URL" value={slideForm.image_url} onChange={e => setSlideForm(f => ({ ...f, image_url: e.target.value }))} />
                        </div>
                      </Field>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={saveSlide} disabled={slideSaving || !slideForm.title || !slideForm.image_url} className={btn}>{slideSaving ? "Saving…" : editingSlide ? "Update Slide" : "Add Slide"}</button>
                    {editingSlide && <button onClick={() => { setEditingSlide(null); openNewSlide(); }} className={btnGhost}>Cancel</button>}
                  </div>
                </div>
                {/* List */}
                {slides.length > 0 && (
                  <div className="border border-white/8 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/8 bg-black/20">
                      <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600">{slides.length} slide{slides.length !== 1 ? "s" : ""}</p>
                    </div>
                    {slides.map((s, i) => (
                      <div key={s.id} className={`flex items-center gap-4 px-4 py-3 hover:bg-white/2 ${i > 0 ? "border-t border-white/5" : ""}`}>
                        <img src={s.image_url} className="w-14 h-9 object-cover shrink-0 border border-white/10" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{s.title}</p>
                          <p className="text-zinc-600 text-xs">order {s.sort_order} · {s.cta_text}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ActiveBadge active={s.is_active} onToggle={() => toggleSlideActive(s)} />
                          <EditBtn onClick={() => openEditSlide(s)} />
                          <DeleteBtn onClick={() => deleteSlide(s.id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ FEATURED CARS ═════════════════════════════════ */}
            {tab === "featured" && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Section Label"><input className={inp} placeholder="Curated Masterpieces" value={settings.featured_label || ""} onChange={e => S("featured_label", e.target.value)} /></Field>
                  <Field label="Section Heading"><input className={inp} placeholder="The Modern Collection" value={settings.featured_heading || ""} onChange={e => S("featured_heading", e.target.value)} /></Field>
                  <Field label="Button Text"><input className={inp} placeholder="View Private Inventory" value={settings.featured_btn_text || ""} onChange={e => S("featured_btn_text", e.target.value)} /></Field>
                </div>
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-3">Toggle Featured Vehicles</p>
                  <div className="grid grid-cols-3 gap-2">
                    {vehicles.map(car => (
                      <button key={car.id} onClick={() => toggleFeatured(car.id, car.featured)}
                        className={`p-3 text-left border transition-all ${car.featured ? "border-[#c9a84c] bg-[#c9a84c]/8" : "border-white/10 hover:border-white/25"}`}>
                        <p className="text-white text-xs font-medium truncate">{car.make} {car.model}</p>
                        <p className="text-zinc-500 text-[10px] mt-0.5">{car.year} · {car.status}</p>
                        {car.featured && <p className="text-[#c9a84c] text-[10px] mt-1 font-semibold">✓ Featured</p>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab === "horizontal" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-1">Homepage Horizontal Scroll Section</p>
                  <p className="text-zinc-700 text-xs mb-4">Select up to 7 cars. These appear in the horizontal scrolling section directly below the hero.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {vehicles.map(car => (
                    <button
                      key={car.id}
                      onClick={() => toggleHorizontal(car.id, car.show_horizontal)}
                      className={`p-3 text-left border transition-all flex items-center justify-between gap-3 ${car.show_horizontal ? "border-[#c9a84c] bg-[#c9a84c]/8" : "border-white/8 hover:border-white/20"}`}
                    >
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">{car.make} {car.model}</p>
                        <p className="text-zinc-600 text-[10px]">{car.year} · {car.status}</p>
                      </div>
                      {car.show_horizontal && <span className="text-[#c9a84c] text-[10px] font-bold shrink-0">✓ Selected</span>}
                    </button>
                  ))}
                </div>
                <p className="text-zinc-700 text-xs">{vehicles.filter(v => v.show_horizontal).length} / 7 selected</p>
              </div>
            )}

            {tab === "vault" && (
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-1">Homepage Vault Feature (Sticky Scroll)</p>
                  <p className="text-zinc-700 text-xs mb-4">Select 3–4 cars. Full-screen sticky scroll section. Requires a cover image on each car.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {vehicles.map(car => (
                    <button
                      key={car.id}
                      onClick={() => toggleVaultFeature(car.id, car.show_vault_feature)}
                      className={`p-3 text-left border transition-all flex items-center justify-between gap-3 ${car.show_vault_feature ? "border-[#c9a84c] bg-[#c9a84c]/8" : "border-white/8 hover:border-white/20"}`}
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        {car.image_url ? (
                          <img src={car.image_url} className="w-10 h-7 object-cover shrink-0 border border-white/10" alt="" />
                        ) : (
                          <div className="w-10 h-7 bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                            <span className="text-[8px] text-zinc-700">No img</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-white text-xs font-medium truncate">{car.make} {car.model}</p>
                          <p className="text-zinc-600 text-[10px]">{car.year} · {car.status}</p>
                        </div>
                      </div>
                      {car.show_vault_feature && <span className="text-[#c9a84c] text-[10px] font-bold shrink-0">✓</span>}
                    </button>
                  ))}
                </div>
                <p className="text-zinc-700 text-xs">
                  {vehicles.filter(v => v.show_vault_feature).length} / 4 selected
                  {vehicles.filter(v => v.show_vault_feature && !v.image_url).length > 0 && (
                    <span className="text-yellow-600 ml-2">⚠ {vehicles.filter(v => v.show_vault_feature && !v.image_url).length} car(s) have no image</span>
                  )}
                </p>
              </div>
            )}
            {/* ══ NETWORK ═══════════════════════════════════════ */}
            {tab === "network" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Imports Counter"><input className={inp} placeholder="12k+" value={settings.network_imports_count || ""} onChange={e => S("network_imports_count", e.target.value)} /></Field>
                  <Field label="Background Image URL"><input className={inp} value={settings.network_bg_image_url || ""} onChange={e => S("network_bg_image_url", e.target.value)} /></Field>
                  <div className="col-span-2">
                    <Field label="Philosophy Quote">
                      <input className={inp} value={settings.network_philosophy_quote || ""} onChange={e => S("network_philosophy_quote", e.target.value)} />
                    </Field>
                  </div>
                </div>
                <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600">4 Stat Cards</p>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="border border-white/8 p-4 space-y-3">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-700">Card {n}</p>
                      <Field label="Title"><input className={inp} value={settings[`network_stat${n}_title`] || ""} onChange={e => S(`network_stat${n}_title`, e.target.value)} /></Field>
                      <Field label="Description"><input className={inp} value={settings[`network_stat${n}_desc`] || ""} onChange={e => S(`network_stat${n}_desc`, e.target.value)} /></Field>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ ADVISORY ══════════════════════════════════════ */}
            {tab === "advisory" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Performance Stat (e.g. +142%)"><input className={inp} value={settings.advisory_stat_value || ""} onChange={e => S("advisory_stat_value", e.target.value)} /></Field>
                  <Field label="Stat Description"><input className={inp} value={settings.advisory_stat_desc || ""} onChange={e => S("advisory_stat_desc", e.target.value)} /></Field>
                  <div className="col-span-2">
                    <Field label="Body Paragraph"><textarea rows={4} className={ta} value={settings.advisory_body || ""} onChange={e => S("advisory_body", e.target.value)} /></Field>
                  </div>
                  <Field label="Feature 1 Title"><input className={inp} value={settings.advisory_feature1_title || ""} onChange={e => S("advisory_feature1_title", e.target.value)} /></Field>
                  <Field label="Feature 1 Description"><input className={inp} value={settings.advisory_feature1_desc || ""} onChange={e => S("advisory_feature1_desc", e.target.value)} /></Field>
                  <Field label="Feature 2 Title"><input className={inp} value={settings.advisory_feature2_title || ""} onChange={e => S("advisory_feature2_title", e.target.value)} /></Field>
                  <Field label="Feature 2 Description"><input className={inp} value={settings.advisory_feature2_desc || ""} onChange={e => S("advisory_feature2_desc", e.target.value)} /></Field>
                  <div className="col-span-2">
                    <Field label="Section Image">
                      <div className="flex gap-3 items-center">
                        <input ref={advFileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImg(e.target.files[0], "advisory", (url) => { S("advisory_image_url", url); supabase.from("site_settings").upsert({ key: "advisory_image_url", value: url, updated_at: new Date().toISOString() }); }, setAdvUploading)} />
                        <UploadBtn uploading={advUploading} onClick={() => advFileRef.current?.click()} />
                        {settings.advisory_image_url && <img src={settings.advisory_image_url} className="h-9 w-14 object-cover border border-white/10" alt="" />}
                        <input className={`${inp} flex-1`} placeholder="or paste URL" value={settings.advisory_image_url || ""} onChange={e => S("advisory_image_url", e.target.value)} />
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* ══ PARTNERS ══════════════════════════════════════ */}
            {tab === "partners" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">{editingPartner ? "Editing Partner" : "Add Partner"}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="Name *"><input className={inp} placeholder="RM SOTHEBY'S" value={partnerForm.name} onChange={e => setPartnerForm(f => ({ ...f, name: e.target.value }))} /></Field>
                    <Field label="Region"><input className={inp} placeholder="London / NY" value={partnerForm.region} onChange={e => setPartnerForm(f => ({ ...f, region: e.target.value }))} /></Field>
                    <Field label="Sort Order"><input type="number" className={inp} value={partnerForm.sort_order} onChange={e => setPartnerForm(f => ({ ...f, sort_order: e.target.value }))} /></Field>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={savePartner} disabled={partnerSaving || !partnerForm.name} className={btn}>{partnerSaving ? "Saving…" : editingPartner ? "Update" : "Add Partner"}</button>
                    {editingPartner && <button onClick={() => { setEditingPartner(null); openNewPartner(); }} className={btnGhost}>Cancel</button>}
                  </div>
                </div>
                {partners.length > 0 && (
                  <div className="border border-white/8 overflow-hidden">
                    {partners.map((p, i) => (
                      <div key={p.id} className={`flex items-center gap-4 px-4 py-3 hover:bg-white/2 ${i > 0 ? "border-t border-white/5" : ""}`}>
                        <div className="flex-1">
                          <p className="text-white text-xs font-medium">{p.name}</p>
                          <p className="text-zinc-600 text-[10px]">{p.region}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ActiveBadge active={p.is_active} onToggle={() => togglePartnerActive(p)} />
                          <EditBtn onClick={() => openEditPartner(p)} />
                          <DeleteBtn onClick={() => deletePartner(p.id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ MARKET UPDATES ════════════════════════════════ */}
            {tab === "updates" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">{editingUpdate ? "Editing Update" : "Publish New Update"}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Type">
                      <select className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 appearance-none" value={updateForm.type} onChange={e => setUpdateForm(f => ({ ...f, type: e.target.value }))}>
                        {UPDATE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </Field>
                    <Field label="Sort Order"><input type="number" className={inp} value={updateForm.sort_order} onChange={e => setUpdateForm(f => ({ ...f, sort_order: e.target.value }))} /></Field>
                    <div className="col-span-2"><Field label="Title *"><input className={inp} placeholder="Price Shift: 1967 Ferrari 330 P4" value={updateForm.title} onChange={e => setUpdateForm(f => ({ ...f, title: e.target.value }))} /></Field></div>
                    <div className="col-span-2"><Field label="Description *"><textarea rows={3} className={ta} value={updateForm.description} onChange={e => setUpdateForm(f => ({ ...f, description: e.target.value }))} /></Field></div>
                    <div className="col-span-2 flex items-center gap-3">
                      <input type="checkbox" id="urgent" checked={updateForm.urgent} onChange={e => setUpdateForm(f => ({ ...f, urgent: e.target.checked }))} className="accent-white" />
                      <label htmlFor="urgent" className="text-xs text-zinc-500 uppercase tracking-wider cursor-pointer">Mark as URGENT (red pulse on website)</label>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={saveUpdate} disabled={updateSaving || !updateForm.title || !updateForm.description} className={btn}>{updateSaving ? "Saving…" : editingUpdate ? "Update" : "Publish"}</button>
                    {editingUpdate && <button onClick={() => { setEditingUpdate(null); openNewUpdate(); }} className={btnGhost}>Cancel</button>}
                  </div>
                </div>
                {updates.length > 0 && (
                  <div className="border border-white/8 overflow-hidden">
                    {updates.map((u, i) => (
                      <div key={u.id} className={`flex items-center gap-4 px-4 py-3 hover:bg-white/2 ${i > 0 ? "border-t border-white/5" : ""}`}>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 border border-white/10 px-2 py-0.5 shrink-0">{u.type}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{u.title}</p>
                          {u.urgent && <span className="text-[9px] text-[#c9a84c] uppercase tracking-wider">● Urgent</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ActiveBadge active={u.published} onToggle={() => toggleUpdatePublished(u)} />
                          <EditBtn onClick={() => openEditUpdate(u)} />
                          <DeleteBtn onClick={() => deleteUpdate(u.id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ HERITAGE ══════════════════════════════════════ */}
            {tab === "heritage" && (
              <Field label="Background Video URL">
                <input className={inp} placeholder="https://…mp4" value={settings.heritage_video_url || ""} onChange={e => S("heritage_video_url", e.target.value)} />
                <p className="text-zinc-700 text-xs mt-1">Plays in the cinematic hero of the Heritage page.</p>
              </Field>
            )}

            {/* ══ FAQ ═══════════════════════════════════════════ */}
            {tab === "faq" && (
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-zinc-600 mb-4">{editingFaq ? "Editing FAQ" : "Add FAQ Item"}</p>
                  <div className="space-y-3">
                    <Field label="Question *"><input className={inp} placeholder="How do you verify provenance?" value={faqForm.question} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))} /></Field>
                    <Field label="Answer *"><textarea rows={4} className={ta} value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} /></Field>
                    <Field label="Sort Order"><input type="number" className={`${inp} w-28`} value={faqForm.sort_order} onChange={e => setFaqForm(f => ({ ...f, sort_order: e.target.value }))} /></Field>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={saveFaq} disabled={faqSaving || !faqForm.question || !faqForm.answer} className={btn}>{faqSaving ? "Saving…" : editingFaq ? "Update" : "Add FAQ"}</button>
                    {editingFaq && <button onClick={() => { setEditingFaq(null); openNewFaq(); }} className={btnGhost}>Cancel</button>}
                  </div>
                </div>
                {faqs.length > 0 && (
                  <div className="border border-white/8 overflow-hidden">
                    {faqs.map((f, i) => (
                      <div key={f.id} className={`flex items-start gap-4 px-4 py-3 hover:bg-white/2 ${i > 0 ? "border-t border-white/5" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium">{f.question}</p>
                          <p className="text-zinc-600 text-xs mt-0.5 line-clamp-1">{f.answer}</p>
                        </div>
                        <div className="flex gap-2 shrink-0 mt-0.5">
                          <EditBtn onClick={() => openEditFaq(f)} />
                          <DeleteBtn onClick={() => deleteFaq(f.id)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ ABOUT ═════════════════════════════════════════ */}
            {tab === "about" && (
              <div className="space-y-4">
                <Field label="Heading"><input className={inp} placeholder="Who We Are" value={settings.about_heading || ""} onChange={e => S("about_heading", e.target.value)} /></Field>
                <Field label="Body Text"><textarea rows={6} className={ta} value={settings.about_body || ""} onChange={e => S("about_body", e.target.value)} /></Field>
                <Field label="Section Image">
                  <div className="flex gap-3 items-center">
                    <input ref={aboutFileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImg(e.target.files[0], "about", (url) => { S("about_image_url", url); supabase.from("site_settings").upsert({ key: "about_image_url", value: url, updated_at: new Date().toISOString() }); }, setAboutUploading)} />
                    <UploadBtn uploading={aboutUploading} onClick={() => aboutFileRef.current?.click()} />
                    {settings.about_image_url && <img src={settings.about_image_url} className="h-9 w-14 object-cover border border-white/10" alt="" />}
                    <input className={`${inp} flex-1`} placeholder="or paste URL" value={settings.about_image_url || ""} onChange={e => S("about_image_url", e.target.value)} />
                  </div>
                </Field>
              </div>
            )}

            {/* ══ CONTACT ═══════════════════════════════════════ */}
            {tab === "contact" && (
              <div className="space-y-3">
                {([
                  ["Showroom Address", "showroom_address", "text", "123 Gulshan Avenue, Dhaka"],
                  ["Phone Number", "phone", "text", "+880 1X XXXX XXXX"],
                  ["WhatsApp Number", "whatsapp", "text", "+880 1X XXXX XXXX"],
                  ["Email Address", "email", "email", "info@carhouseimports.com"],
                  ["Business Hours", "business_hours", "text", "Sun–Thu 10am–7pm"],
                ] as [string, string, string, string][]).map(([label, key, type, ph]) => (
                  <Field key={key} label={label}><input type={type} className={inp} placeholder={ph} value={settings[key] || ""} onChange={e => S(key, e.target.value)} /></Field>
                ))}
              </div>
            )}

            {/* ══ SOCIAL ════════════════════════════════════════ */}
            {tab === "social" && (
              <div className="space-y-3">
                {([
                  ["Facebook", "facebook_url", "https://facebook.com/carhouseimports"],
                  ["Instagram", "instagram_url", "https://instagram.com/carhouseimports"],
                  ["YouTube", "youtube_url", "https://youtube.com/@carhouseimports"],
                ] as [string, string, string][]).map(([label, key, ph]) => (
                  <Field key={key} label={label}><input type="url" className={inp} placeholder={ph} value={settings[key] || ""} onChange={e => S(key, e.target.value)} /></Field>
                ))}
                <p className="text-zinc-700 text-xs pt-1">Leave blank to hide the icon on the website.</p>
              </div>
            )}

            {/* ══ ANNOUNCEMENT ══════════════════════════════════ */}
            {tab === "announcement" && (
              <div className="space-y-4">
                <Field label="Banner Text">
                  <input className={inp} placeholder="New arrivals — March 2025" value={settings.announcement_text || ""} onChange={e => S("announcement_text", e.target.value)} />
                </Field>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="annActive" checked={settings.announcement_active === "true"} onChange={e => S("announcement_active", e.target.checked ? "true" : "false")} className="accent-white" />
                  <label htmlFor="annActive" className="text-xs text-zinc-500 uppercase tracking-wider cursor-pointer">Show banner on website</label>
                </div>
                <p className="text-zinc-700 text-xs">Appears at the top of every page when active.</p>
              </div>
            )}

            {/* ══ AI CONCIERGE ══════════════════════════════════ */}
            {tab === "ai" && (
              <div className="space-y-4">
                <Field label="Welcome Message">
                  <textarea rows={3} className={ta} value={settings.ai_welcome_message || ""} onChange={e => S("ai_welcome_message", e.target.value)} />
                </Field>
                <Field label="System Instruction (AI persona & behaviour)">
                  <textarea rows={8} className={ta} value={settings.ai_system_instruction || ""} onChange={e => S("ai_system_instruction", e.target.value)} />
                  <p className="text-zinc-700 text-xs mt-1">The hidden prompt defining the AI's tone and rules. Current inventory is appended automatically.</p>
                </Field>
              </div>
            )}

            {/* ══ SEO ═══════════════════════════════════════════ */}
            {tab === "seo" && (
              <div className="space-y-3">
                <Field label="Page Title">
                  <input className={inp} placeholder="Car House Imports — Luxury Car Imports Bangladesh" value={settings.seo_title || ""} onChange={e => S("seo_title", e.target.value)} />
                  <p className="text-zinc-700 text-xs mt-1">Keep under 60 characters.</p>
                </Field>
                <Field label="Meta Description">
                  <textarea rows={3} className={ta} value={settings.seo_description || ""} onChange={e => S("seo_description", e.target.value)} />
                  <p className="text-zinc-700 text-xs mt-1">Aim for 140–160 characters.</p>
                </Field>
                <Field label="Keywords">
                  <input className={inp} placeholder="luxury car import bangladesh, reconditioned cars dhaka" value={settings.seo_keywords || ""} onChange={e => S("seo_keywords", e.target.value)} />
                </Field>
              </div>
            )}

          </div>{/* end p-6 */}
        </div>{/* end content panel */}
      </div>{/* end flex layout */}

      {/* ── Save footer ── */}
      <div className="flex justify-end pt-2 border-t border-white/5">
        <button onClick={saveAll} disabled={saving}
          className={`px-8 py-3 text-xs font-semibold tracking-[0.25em] uppercase transition-all disabled:opacity-50 ${saved ? "bg-zinc-700 text-zinc-300" : "bg-white text-black hover:bg-zinc-200"}`}>
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
// ═══════════════════════════════════════════════════════════════
// ANALYTICS SECTION
// Add this to app/page.tsx
// 
// STEP 1: Add this import at the top of page.tsx (after existing imports):
// import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
//
// STEP 2: Add "analytics" to the NAV array:
// { id: "analytics", label: "Analytics", icon: "◉" },
//
// STEP 3: Add to PAGES object:
// analytics: <Analytics />,
//
// STEP 4: Paste the Analytics component below into page.tsx
//         (before the NAV const, after the Staff component)
// ═══════════════════════════════════════════════════════════════

const Analytics = () => {
  const PageHeader = ({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "white", letterSpacing: "-0.01em" }}>{title}</h1>
        {sub && <p style={{ fontSize: 13, color: "#6b7590", marginTop: 3 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
  const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, ...style }}>{children}</div>
  );
  const CardHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4a5268" }}>{title}</p>
      {action}
    </div>
  );
  const Empty = ({ msg }: { msg: string }) => (
    <div style={{ padding: "40px 24px", textAlign: "center", color: "#4a5268", fontSize: 13 }}>{msg}</div>
  );
  const Table = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          {headers.map(h => <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#4a5268", padding: "10px 16px", whiteSpace: "nowrap" }}>{h}</th>)}
        </tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
  const TR = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <tr onClick={onClick} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", cursor: onClick ? "pointer" : "default" }}>{children}</tr>
  );
  const TD = ({ children, mono, muted, style }: { children: React.ReactNode; mono?: boolean; muted?: boolean; style?: React.CSSProperties }) => (
    <td style={{ padding: "12px 16px", fontSize: 13, color: muted ? "#6b7590" : "#f0f2f7", fontFamily: mono ? "monospace" : "inherit", ...style }}>{children}</td>
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("vehicles").select("*"),
      supabase.from("sales").select("*").order("sale_date", { ascending: true }),
      supabase.from("expenses").select("*"),
    ]).then(([v, s, e]) => {
      setVehicles(v.data || []);
      setSales(s.data || []);
      setExpenses(e.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  // ── COMPUTED DATA ──────────────────────────────────────────

  // Revenue by month
  const revenueByMonth: Record<string, { month: string; revenue: number; expenses: number; profit: number }> = {};
  sales.forEach(s => {
    if (!s.sale_date) return;
    const month = s.sale_date.slice(0, 7); // "2024-11"
    const label = new Date(s.sale_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!revenueByMonth[month]) revenueByMonth[month] = { month: label, revenue: 0, expenses: 0, profit: 0 };
    revenueByMonth[month].revenue += s.sale_price || 0;
  });
  expenses.forEach(e => {
    if (!e.date) return;
    const month = e.date.slice(0, 7);
    const label = new Date(e.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    if (!revenueByMonth[month]) revenueByMonth[month] = { month: label, revenue: 0, expenses: 0, profit: 0 };
    revenueByMonth[month].expenses += e.amount || 0;
  });
  const monthlyData = Object.values(revenueByMonth).map(d => ({ ...d, profit: d.revenue - d.expenses })).sort((a, b) => a.month.localeCompare(b.month));

  // Inventory by status
  const statusCounts = [
    { name: "Available", value: vehicles.filter(v => v.status === "Available").length, color: "#34c97a" },
    { name: "Reserved", value: vehicles.filter(v => v.status === "Reserved").length, color: "#f0a030" },
    { name: "In Transit", value: vehicles.filter(v => v.status === "In Transit").length, color: "#5b9cf6" },
    { name: "Sold", value: vehicles.filter(v => v.status === "Sold").length, color: "#6b7590" },
  ].filter(s => s.value > 0);

  // Stock by origin
  const originMap: Record<string, number> = {};
  vehicles.forEach(v => { if (v.origin) originMap[v.origin] = (originMap[v.origin] || 0) + 1; });
  const originData = Object.entries(originMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Expenses by category
  const expMap: Record<string, number> = {};
  expenses.forEach(e => { if (e.category) expMap[e.category] = (expMap[e.category] || 0) + e.amount; });
  const expCatData = Object.entries(expMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Brand performance
  const brandMap: Record<string, { brand: string; units: number; revenue: number; avgPrice: number }> = {};
  sales.forEach(s => {
    const car = vehicles.find(v => v.id === s.car_id);
    if (!car) return;
    const brand = car.make;
    if (!brandMap[brand]) brandMap[brand] = { brand, units: 0, revenue: 0, avgPrice: 0 };
    brandMap[brand].units += 1;
    brandMap[brand].revenue += s.sale_price || 0;
  });
  Object.values(brandMap).forEach(b => { b.avgPrice = b.units ? Math.round(b.revenue / b.units) : 0; });
  const brandData = Object.values(brandMap).sort((a, b) => b.revenue - a.revenue);

  // Vehicle profit margins
  const margins = vehicles.filter(v => v.status === "Sold").map(v => {
    const sale = sales.find(s => s.car_id === v.id);
    const cost = (v.purchase_price || 0) + (v.customs_duty || 0) + (v.shipping_cost || 0);
    const revenue = sale?.sale_price || v.selling_price || 0;
    const profit = revenue - cost;
    const margin = cost > 0 ? Math.round((profit / cost) * 100) : 0;
    return { name: `${v.make} ${v.model}`, profit, margin, cost, revenue };
  }).sort((a, b) => b.profit - a.profit);

  // KPIs
  const totalRev = sales.reduce((a, s) => a + (s.sale_price || 0), 0);
  const totalExp = expenses.reduce((a, e) => a + (e.amount || 0), 0);
  const totalCost = vehicles.filter(v => v.status === "Sold").reduce((a, v) => a + (v.purchase_price || 0) + (v.customs_duty || 0) + (v.shipping_cost || 0), 0);
  const grossMargin = totalCost > 0 ? Math.round(((totalRev - totalCost) / totalRev) * 100) : 0;
  const avgSalePrice = sales.length ? Math.round(totalRev / sales.length) : 0;
  const availableValue = vehicles.filter(v => v.status === "Available").reduce((a, v) => a + (v.selling_price || 0), 0);
  const soldCount = vehicles.filter(v => v.status === "Sold").length;

  // Tooltip formatter
  const fmtTick = (v: number) => v >= 10000000 ? `৳${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `৳${(v / 100000).toFixed(0)}L` : `৳${v.toLocaleString()}`;

  const CHART_COLORS = ["#c9a84c", "#34c97a", "#5b9cf6", "#f0a030", "#e05252", "#a78bfa", "#34d399", "#f472b6"];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#1e2535", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
        <p style={{ color: "#9ba3b8", marginBottom: 6, fontWeight: 600 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {typeof p.value === "number" && p.value > 10000 ? fmtTick(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <PageHeader title="Analytics" sub="Business intelligence and performance metrics" />

      {/* ── KPI CARDS ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
        <StatCard label="Total Revenue" value={fmtTick(totalRev)} accent="var(--green)" />
        <StatCard label="Net Profit" value={fmtTick(totalRev - totalExp)} accent={totalRev - totalExp >= 0 ? "var(--green)" : "var(--red)"} />
        <StatCard label="Gross Margin" value={`${grossMargin}%`} accent="var(--gold)" />
        <StatCard label="Avg. Sale Price" value={fmtTick(avgSalePrice)} />
        <StatCard label="Stock Value" value={fmtTick(availableValue)} sub={`${vehicles.filter(v => v.status === "Available").length} vehicles`} accent="var(--blue)" />
      </div>

      {/* ── ROW 1: Revenue vs Expenses + Inventory Donut ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 12, marginBottom: 12 }}>

        {/* Monthly Revenue vs Expenses */}
        <Card>
          <CardHeader title="Monthly Revenue vs Expenses" />
          <div style={{ padding: "20px 16px 12px" }}>
            {monthlyData.length === 0 ? (
              <Empty msg="No sales or expense data yet." />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#6b7590", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtTick} tick={{ fill: "#6b7590", fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#9ba3b8", paddingTop: 12 }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#34c97a" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#e05252" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#c9a84c" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Inventory Donut */}
        <Card>
          <CardHeader title="Inventory by Status" />
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {statusCounts.length === 0 ? <Empty msg="No inventory data." /> : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {statusCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", marginTop: 8 }}>
                  {statusCounts.map(s => (
                    <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* ── ROW 2: Profit Trend + Origin Breakdown ─────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

        {/* Profit trend line */}
        <Card>
          <CardHeader title="Profit Trend" />
          <div style={{ padding: "20px 16px 12px" }}>
            {monthlyData.length === 0 ? <Empty msg="No data yet." /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#6b7590", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtTick} tick={{ fill: "#6b7590", fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#c9a84c" strokeWidth={2.5} dot={{ fill: "#c9a84c", r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#34c97a" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Stock by origin */}
        <Card>
          <CardHeader title="Stock by Origin Country" />
          <div style={{ padding: "20px 16px 12px" }}>
            {originData.length === 0 ? <Empty msg="No inventory data." /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={originData} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#6b7590", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#9ba3b8", fontSize: 12 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="value" name="Vehicles" radius={[0, 4, 4, 0]}>
                    {originData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ── ROW 3: Expense breakdown + Brand performance ── */}
      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 12, marginBottom: 12 }}>

        {/* Expense pie */}
        <Card>
          <CardHeader title="Expense Breakdown" />
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {expCatData.length === 0 ? <Empty msg="No expenses yet." /> : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={expCatData} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value">
                      {expCatData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", marginTop: 8 }}>
                  {expCatData.map((e, i) => (
                    <div key={e.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{e.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{fmtTick(e.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Brand performance table */}
        <Card>
          <CardHeader title="Brand Performance" />
          {brandData.length === 0 ? <Empty msg="No sales data yet." /> : (
            <Table headers={["Brand", "Units Sold", "Total Revenue", "Avg. Sale Price"]}>
              {brandData.map((b, i) => (
                <TR key={b.brand}>
                  <TD>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>{b.brand}</span>
                    </div>
                  </TD>
                  <TD muted>{b.units}</TD>
                  <TD style={{ color: "var(--green)", fontWeight: 600 }}>{fmtTick(b.revenue)}</TD>
                  <TD muted>{fmtTick(b.avgPrice)}</TD>
                </TR>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {/* ── ROW 4: Vehicle profit margins ──────────────── */}
      {margins.length > 0 && (
        <Card>
          <CardHeader title="Vehicle Profit Margins (Sold Vehicles)" />
          <div style={{ padding: "20px 16px 12px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={margins.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#6b7590", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tickFormatter={fmtTick} tick={{ fill: "#6b7590", fontSize: 10 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
                  {margins.slice(0, 8).map((m, i) => <Cell key={i} fill={m.profit >= 0 ? "#34c97a" : "#e05252"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Table headers={["Vehicle", "Cost", "Sale Price", "Profit", "Margin %"]}>
            {margins.slice(0, 6).map(m => (
              <TR key={m.name}>
                <TD style={{ fontWeight: 500 }}>{m.name}</TD>
                <TD muted>{fmtTick(m.cost)}</TD>
                <TD muted>{fmtTick(m.revenue)}</TD>
                <TD style={{ fontWeight: 600, color: m.profit >= 0 ? "var(--green)" : "var(--red)" }}>{fmtTick(m.profit)}</TD>
                <TD>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: m.margin >= 20 ? "rgba(52,201,122,0.12)" : m.margin >= 10 ? "rgba(240,160,48,0.12)" : "rgba(224,82,82,0.12)", color: m.margin >= 20 ? "var(--green)" : m.margin >= 10 ? "var(--amber)" : "var(--red)" }}>
                    {m.margin}%
                  </span>
                </TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
};
/* ══════════════════════════════════════════════════════════════
   LANDED COST CALCULATOR
══════════════════════════════════════════════════════════════ */
const LandedCost = () => {
  const [form, setForm] = useState({
    auctionPrice: "", auctionFee: "", inlandTransport: "",
    oceanFreight: "", insurance: "", customsDuty: "",
    cfAgentFee: "", portCharges: "", prep: "", other: "",
  });
  const [result, setResult] = useState<any>(null);
  const [sellingPrice, setSellingPrice] = useState("");

  const f = (k: string) => parseFloat((form as any)[k] || "0") || 0;
  const fmtN = (n: number) => "৳ " + Math.round(n).toLocaleString("en-BD");

  const calculate = () => {
    const totalCost = f("auctionPrice") + f("auctionFee") + f("inlandTransport") +
      f("oceanFreight") + f("insurance") + f("customsDuty") +
      f("cfAgentFee") + f("portCharges") + f("prep") + f("other");
    const suggested = Math.round(totalCost * 1.25);
    const minimum = Math.round(totalCost * 1.08);
    const customSelling = parseFloat(sellingPrice) || 0;
    const customProfit = customSelling - totalCost;
    const customMargin = totalCost > 0 ? ((customProfit / totalCost) * 100).toFixed(1) : "0";
    setResult({ totalCost, suggested, minimum, profit25: suggested - totalCost, customSelling, customProfit, customMargin });
  };

  const costFields: [string, string][] = [
    ["Auction Price", "auctionPrice"], ["Auction Fee", "auctionFee"],
    ["Inland Transport (Origin)", "inlandTransport"], ["Ocean Freight", "oceanFreight"],
    ["Marine Insurance", "insurance"], ["Customs Duty", "customsDuty"],
    ["C&F Agent Fee", "cfAgentFee"], ["Port Charges", "portCharges"],
    ["Showroom Preparation", "prep"], ["Other Costs", "other"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">Landed Cost Calculator</h1>
        <p className="text-zinc-500 text-sm mt-1">Calculate total import cost and optimal selling price</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-5">Cost Inputs (৳)</p>
          <div className="grid grid-cols-2 gap-4">
            {costFields.map(([label, key]) => (
              <div key={key}>
                <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">{label}</label>
                <input
                  type="number"
                  placeholder="0"
                  value={(form as any)[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 outline-none focus:border-white/40 placeholder-zinc-700"
                />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t border-white/10">
            <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">Your Target Selling Price (৳)</label>
            <input
              type="number"
              placeholder="Enter your price to see margin"
              value={sellingPrice}
              onChange={e => setSellingPrice(e.target.value)}
              className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 outline-none focus:border-white/40 placeholder-zinc-700"
            />
          </div>
          <button
            onClick={calculate}
            className="w-full mt-4 py-3 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors"
          >
            Calculate
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg">
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-5">Cost Breakdown</p>
              {costFields.map(([label, key]) => f(key) > 0 && (
                <div key={key} className="flex justify-between py-2 border-b border-white/5 text-sm">
                  <span className="text-zinc-400">{label}</span>
                  <span className="text-white">{fmtN(f(key))}</span>
                </div>
              ))}
              <div className="flex justify-between pt-4 mt-2">
                <span className="text-white font-semibold">Total Landed Cost</span>
                <span className="text-white font-bold text-lg">{fmtN(result.totalCost)}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-lg text-center">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Minimum Price</p>
                <p className="text-lg font-semibold text-red-400">{fmtN(result.minimum)}</p>
                <p className="text-[10px] text-zinc-600 mt-1">8% margin</p>
              </div>
              <div className="bg-[#0a0a0a] border border-yellow-500/30 p-4 rounded-lg text-center">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Suggested Price</p>
                <p className="text-lg font-semibold text-yellow-400">{fmtN(result.suggested)}</p>
                <p className="text-[10px] text-zinc-600 mt-1">25% margin</p>
              </div>
              <div className="bg-[#0a0a0a] border border-green-500/30 p-4 rounded-lg text-center">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Profit @ 25%</p>
                <p className="text-lg font-semibold text-green-400">{fmtN(result.profit25)}</p>
                <p className="text-[10px] text-zinc-600 mt-1">on suggested</p>
              </div>
            </div>

            {result.customSelling > 0 && (
              <div className={`border p-5 rounded-lg ${result.customProfit >= 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Your Price Analysis</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Selling Price</p>
                    <p className="text-white font-semibold">{fmtN(result.customSelling)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Profit / Loss</p>
                    <p className={`font-semibold ${result.customProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtN(result.customProfit)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 mb-1">Margin</p>
                    <p className={`font-semibold ${parseFloat(result.customMargin) >= 15 ? "text-green-400" : parseFloat(result.customMargin) >= 8 ? "text-yellow-400" : "text-red-400"}`}>{result.customMargin}%</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg flex items-center justify-center text-zinc-600 text-sm" style={{ minHeight: 300 }}>
            Fill in costs and click Calculate
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   NBR DUTY CALCULATOR
══════════════════════════════════════════════════════════════ */
const NBRCalculator = () => {
  const [cifValue, setCifValue] = useState("");
  const [engineCC, setEngineCC] = useState("1600");
  const [vehicleAge, setVehicleAge] = useState("0");
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const cif = parseFloat(cifValue) || 0;
    const cc = parseInt(engineCC) || 1600;
    const age = parseInt(vehicleAge) || 0;

    // Bangladesh NBR duty rates (approximate, 2024)
    let cd = 0.25; // Customs Duty base
    let sd = 0;    // Supplementary Duty
    let rd = 0;    // Regulatory Duty

    // Supplementary duty based on engine CC
    if (cc <= 1600) sd = 0.45;
    else if (cc <= 2000) sd = 1.00;
    else if (cc <= 3000) sd = 3.00;
    else if (cc <= 4000) sd = 5.00;
    else sd = 5.00;

    // Regulatory duty for reconditioned
    if (age > 0 && age <= 3) rd = 0.03;
    else if (age > 3 && age <= 5) rd = 0.05;
    else if (age > 5) rd = 0.10;

    const customsDuty = cif * cd;
    const regulatoryDuty = cif * rd;
    const suppDutyBase = cif + customsDuty + regulatoryDuty;
    const supplementaryDuty = suppDutyBase * sd;
    const vatBase = suppDutyBase + supplementaryDuty;
    const vat = vatBase * 0.15;
    const aitBase = cif;
    const ait = aitBase * 0.05;
    const total = customsDuty + regulatoryDuty + supplementaryDuty + vat + ait;
    const totalLanded = cif + total;
    const effectiveRate = cif > 0 ? ((total / cif) * 100).toFixed(1) : "0";

    setResult({ cif, customsDuty, regulatoryDuty, supplementaryDuty, vat, ait, total, totalLanded, effectiveRate });
  };

  const fmtN = (n: number) => "৳ " + Math.round(n).toLocaleString("en-BD");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">NBR Duty Calculator</h1>
        <p className="text-zinc-500 text-sm mt-1">Bangladesh National Board of Revenue import duty estimator</p>
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-5 py-3">
        <p className="text-yellow-400 text-xs">⚠ These rates are approximate based on NBR 2024 schedule. Always confirm final duties with your C&F agent before importing.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-5">Vehicle Details</p>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">CIF Value (৳)</label>
              <input type="number" placeholder="Cost + Insurance + Freight in BDT" value={cifValue} onChange={e => setCifValue(e.target.value)}
                className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:border-white/40 placeholder-zinc-700" />
              <p className="text-zinc-600 text-xs mt-1">Convert foreign currency to BDT at current rate</p>
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">Engine Displacement (CC)</label>
              <select value={engineCC} onChange={e => setEngineCC(e.target.value)}
                className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:border-white/40 appearance-none">
                <option value="1000">Up to 1000cc</option>
                <option value="1600">1001–1600cc (SD: 45%)</option>
                <option value="2000">1601–2000cc (SD: 100%)</option>
                <option value="3000">2001–3000cc (SD: 300%)</option>
                <option value="4000">3001–4000cc (SD: 500%)</option>
                <option value="5000">Above 4000cc (SD: 500%)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">Vehicle Age (Years)</label>
              <select value={vehicleAge} onChange={e => setVehicleAge(e.target.value)}
                className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:border-white/40 appearance-none">
                <option value="0">Brand New (0 years)</option>
                <option value="1">1 Year Old (RD: 3%)</option>
                <option value="2">2 Years Old (RD: 3%)</option>
                <option value="3">3 Years Old (RD: 3%)</option>
                <option value="4">4 Years Old (RD: 5%)</option>
                <option value="5">5 Years Old (RD: 5%)</option>
                <option value="6">6+ Years Old (RD: 10%)</option>
              </select>
            </div>
            <button onClick={calculate}
              className="w-full py-3 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors mt-2">
              Calculate Duties
            </button>
          </div>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg">
              <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Duty Breakdown</p>
              {[
                ["CIF Value", result.cif, "base"],
                ["Customs Duty (CD — 25%)", result.customsDuty, "tax"],
                ["Regulatory Duty (RD)", result.regulatoryDuty, "tax"],
                ["Supplementary Duty (SD)", result.supplementaryDuty, "tax"],
                ["VAT (15%)", result.vat, "tax"],
                ["Advance Income Tax (AIT 5%)", result.ait, "tax"],
              ].map(([label, val, type]) => (
                <div key={label as string} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
                  <span className={type === "tax" ? "text-zinc-400" : "text-white"}>{label as string}</span>
                  <span className={type === "tax" ? "text-red-400" : "text-white"}>{fmtN(val as number)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-4 mt-2 border-t border-white/20">
                <span className="text-white font-semibold">Total Taxes & Duties</span>
                <span className="text-red-400 font-bold text-lg">{fmtN(result.total)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-lg text-center">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Total Landed Cost</p>
                <p className="text-xl font-bold text-white">{fmtN(result.totalLanded)}</p>
                <p className="text-[10px] text-zinc-600 mt-1">CIF + All Duties</p>
              </div>
              <div className="bg-[#0a0a0a] border border-red-500/20 p-4 rounded-lg text-center">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Effective Tax Rate</p>
                <p className="text-xl font-bold text-red-400">{result.effectiveRate}%</p>
                <p className="text-[10px] text-zinc-600 mt-1">of CIF value</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-lg flex items-center justify-center text-zinc-600 text-sm" style={{ minHeight: 300 }}>
            Enter CIF value and click Calculate
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   INVOICE GENERATOR
══════════════════════════════════════════════════════════════ */
const InvoiceGenerator = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<string>("");
  const [invoiceType, setInvoiceType] = useState<"invoice" | "receipt">("invoice");

  useEffect(() => {
    Promise.all([
      supabase.from("sales").select("*").order("created_at", { ascending: false }),
      supabase.from("vehicles").select("*"),
      supabase.from("customers").select("*"),
    ]).then(([s, v, c]) => {
      setSales(s.data || []);
      setVehicles(v.data || []);
      setCustomers(c.data || []);
      setLoading(false);
    });
  }, []);

  const sale = sales.find(s => s.id === selectedSale);
  const car = sale ? vehicles.find(v => v.id === sale.car_id) : null;
  const customer = sale ? customers.find(c => c.id === sale.customer_id) : null;
  const fmtN = (n: number) => "৳ " + Math.round(n || 0).toLocaleString("en-BD");

  const printInvoice = () => {
    const printContent = document.getElementById("invoice-preview");
    if (!printContent) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>${invoiceType === "invoice" ? "Invoice" : "Money Receipt"} - ${sale?.id}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #111; background: white; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #111; padding-bottom: 24px; }
        .company-name { font-size: 28px; font-weight: 700; letter-spacing: 2px; }
        .company-sub { font-size: 12px; color: #666; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
        .doc-title { font-size: 22px; font-weight: 300; text-align: right; color: #333; letter-spacing: 3px; text-transform: uppercase; }
        .doc-id { font-size: 14px; color: #666; text-align: right; margin-top: 4px; }
        .section { margin-bottom: 28px; }
        .section-title { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #999; margin-bottom: 8px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .label { font-size: 11px; color: #999; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px; }
        .value { font-size: 15px; color: #111; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #111; color: white; padding: 12px 16px; text-align: left; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
        td { padding: 14px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
        .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #111; border-bottom: none; }
        .footer { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
        .sig-line { border-top: 1px solid #333; padding-top: 8px; font-size: 11px; color: #999; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
        .gold { color: #c9a84c; }
      </style></head><body>
      <div class="header">
        <div>
          <div class="company-name">CAR HOUSE</div>
          <div class="company-sub">Imports Ltd. &nbsp;·&nbsp; Bangladesh's Premier Luxury Importer</div>
        </div>
        <div>
          <div class="doc-title">${invoiceType === "invoice" ? "Sales Invoice" : "Money Receipt"}</div>
          <div class="doc-id">${sale?.id} &nbsp;·&nbsp; ${sale?.sale_date}</div>
        </div>
      </div>
      <div class="grid2 section">
        <div>
          <div class="section-title">Bill To</div>
          <div class="value">${customer?.name || "—"}</div>
          <div class="label" style="margin-top:4px">${customer?.phone || ""}</div>
          <div class="label">${customer?.email || ""}</div>
          <div class="label">${customer?.address || ""}</div>
        </div>
        <div>
          <div class="section-title">Vehicle Details</div>
          <div class="value">${car?.make || ""} ${car?.model || ""}</div>
          <div class="label" style="margin-top:4px">Year: ${car?.year || ""}</div>
          <div class="label">Color: ${car?.color || ""}</div>
          <div class="label">Chassis: ${car?.chassis_no || ""}</div>
          <div class="label">Origin: ${car?.origin || ""}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Description</th><th>Details</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          <tr><td>${car?.make} ${car?.model} (${car?.year})</td><td>${car?.color} · ${car?.engine_cc}cc · ${car?.transmission}</td><td style="text-align:right">${fmtN(sale?.sale_price || 0)}</td></tr>
          ${(sale?.discount || 0) > 0 ? `<tr><td>Discount</td><td>Special discount</td><td style="text-align:right;color:#c0392b">- ${fmtN(sale?.discount || 0)}</td></tr>` : ""}
          <tr><td>Down Payment Received</td><td>${sale?.payment_method}</td><td style="text-align:right;color:#27ae60">${fmtN(sale?.down_payment || 0)}</td></tr>
          <tr class="total-row"><td colspan="2">Total Sale Price</td><td style="text-align:right">${fmtN(sale?.sale_price || 0)}</td></tr>
          <tr class="total-row"><td colspan="2">Balance Due</td><td style="text-align:right;color:${((sale?.sale_price || 0) - (sale?.down_payment || 0)) > 0 ? "#c0392b" : "#27ae60"}">${fmtN((sale?.sale_price || 0) - (sale?.down_payment || 0))}</td></tr>
        </tbody>
      </table>
      ${sale?.notes ? `<div class="section" style="margin-top:24px"><div class="section-title">Notes</div><div style="font-size:13px;color:#666">${sale.notes}</div></div>` : ""}
      <div class="footer">
        <div><div class="sig-line">Customer Signature</div></div>
        <div><div class="sig-line">Authorised Signatory — Car House Imports Ltd.</div></div>
      </div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">Invoice Generator</h1>
        <p className="text-zinc-500 text-sm mt-1">Generate branded invoices and money receipts</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg space-y-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">Select Sale</p>
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">Document Type</label>
            <select value={invoiceType} onChange={e => setInvoiceType(e.target.value as any)}
              className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none appearance-none">
              <option value="invoice">Sales Invoice</option>
              <option value="receipt">Money Receipt</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">Sale Record</label>
            <select value={selectedSale} onChange={e => setSelectedSale(e.target.value)}
              className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none appearance-none">
              <option value="">Select a sale…</option>
              {sales.map(s => {
                const c = vehicles.find(v => v.id === s.car_id);
                return <option key={s.id} value={s.id}>{s.id} — {c?.make} {c?.model}</option>;
              })}
            </select>
          </div>
          {sale && (
            <button onClick={printInvoice}
              className="w-full py-3 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors">
              🖨 Print / Save PDF
            </button>
          )}
        </div>

        <div className="lg:col-span-2">
          {sale && car && customer ? (
            <div id="invoice-preview" className="bg-white text-black p-8 rounded-lg shadow-xl" style={{ fontFamily: "serif" }}>
              <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
                <div>
                  <p className="text-2xl font-black tracking-widest">CAR HOUSE</p>
                  <p className="text-xs text-gray-500 tracking-widest uppercase mt-1">Imports Ltd. · Bangladesh's Premier Luxury Importer</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-light tracking-widest uppercase">{invoiceType === "invoice" ? "Sales Invoice" : "Money Receipt"}</p>
                  <p className="text-sm text-gray-500 mt-1">{sale.id} · {sale.sale_date}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
                  <p className="font-bold text-lg">{customer.name}</p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                  <p className="text-sm text-gray-600">{customer.address}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Vehicle</p>
                  <p className="font-bold text-lg">{car.make} {car.model}</p>
                  <p className="text-sm text-gray-600">Year: {car.year} · {car.color}</p>
                  <p className="text-sm text-gray-600">Chassis: {car.chassis_no}</p>
                  <p className="text-sm text-gray-600">Origin: {car.origin}</p>
                </div>
              </div>
              <table className="w-full text-sm mb-6">
                <thead><tr className="bg-black text-white">
                  <th className="text-left p-3 text-xs tracking-widest uppercase">Description</th>
                  <th className="text-right p-3 text-xs tracking-widest uppercase">Amount</th>
                </tr></thead>
                <tbody>
                  <tr className="border-b border-gray-200"><td className="p-3">{car.make} {car.model} ({car.year}) — {car.engine_cc}cc {car.transmission}</td><td className="p-3 text-right font-semibold">{fmtN(sale.sale_price)}</td></tr>
                  {(sale.discount || 0) > 0 && <tr className="border-b border-gray-200"><td className="p-3 text-gray-500">Discount</td><td className="p-3 text-right text-red-600">- {fmtN(sale.discount)}</td></tr>}
                  <tr className="border-b border-gray-200"><td className="p-3 text-gray-500">Down Payment Received ({sale.payment_method})</td><td className="p-3 text-right text-green-700">{fmtN(sale.down_payment)}</td></tr>
                  <tr className="border-t-2 border-black"><td className="p-3 font-bold text-base">Total Sale Price</td><td className="p-3 text-right font-bold text-base">{fmtN(sale.sale_price)}</td></tr>
                  <tr><td className="p-3 font-bold">Balance Due</td><td className={`p-3 text-right font-bold ${(sale.sale_price - sale.down_payment) > 0 ? "text-red-600" : "text-green-700"}`}>{fmtN(sale.sale_price - sale.down_payment)}</td></tr>
                </tbody>
              </table>
              {sale.notes && <p className="text-xs text-gray-500 mb-6 italic">Note: {sale.notes}</p>}
              <div className="grid grid-cols-2 gap-16 mt-12">
                <div className="border-t border-black pt-2 text-center text-xs text-gray-400 uppercase tracking-widest">Customer Signature</div>
                <div className="border-t border-black pt-2 text-center text-xs text-gray-400 uppercase tracking-widest">Authorised Signatory</div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg flex items-center justify-center text-zinc-600 text-sm" style={{ minHeight: 400 }}>
              Select a sale to preview the invoice
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   INSTALLMENT TRACKER
══════════════════════════════════════════════════════════════ */
const InstallmentTracker = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [emiForm, setEmiForm] = useState({ months: "12", startDate: "", monthlyAmount: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, v, c, inst] = await Promise.all([
      supabase.from("sales").select("*").eq("payment_method", "Installment"),
      supabase.from("vehicles").select("*"),
      supabase.from("customers").select("*"),
      supabase.from("installments").select("*").order("due_date", { ascending: true }),
    ]);
    setSales(s.data || []);
    setVehicles(v.data || []);
    setCustomers(c.data || []);
    setInstallments(inst.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createSchedule = async () => {
    if (!selectedSale) return;
    if (!emiForm.startDate) {
      alert("Please select a first installment date.");
      return;
    }
    setSaving(true);
    const months = parseInt(emiForm.months) || 12;
    const startDate = new Date(emiForm.startDate);
    const monthly = parseFloat(emiForm.monthlyAmount) || 0;
    const schedule = Array.from({ length: months }, (_, i) => {
      const due = new Date(startDate);
      due.setMonth(due.getMonth() + i);
      return {
        sale_id: selectedSale,
        installment_number: i + 1,
        due_date: due.toISOString().split("T")[0],
        amount: monthly,
        status: "pending",
      };
    });
    await supabase.from("installments").delete().eq("sale_id", selectedSale);
    await supabase.from("installments").insert(schedule);
    setSaving(false);
    setShowCreate(false);
    load();
  };

  const markPaid = async (id: number) => {
    await supabase.from("installments").update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] }).eq("id", id);
    setInstallments(p => p.map(i => i.id === id ? { ...i, status: "paid", paid_date: new Date().toISOString().split("T")[0] } : i));
  };

  const fmtN = (n: number) => "৳ " + Math.round(n || 0).toLocaleString("en-BD");

  const saleInstallments = selectedSale ? installments.filter(i => i.sale_id === selectedSale) : [];
  const paid = saleInstallments.filter(i => i.status === "paid").length;
  const overdue = saleInstallments.filter(i => i.status === "pending" && new Date(i.due_date) < new Date()).length;
  const totalPaid = saleInstallments.filter(i => i.status === "paid").reduce((a, i) => a + i.amount, 0);
  const totalDue = saleInstallments.filter(i => i.status === "pending").reduce((a, i) => a + i.amount, 0);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-white tracking-wide">Installment Tracker</h1>
          <p className="text-zinc-500 text-sm mt-1">Track EMI schedules and payment status</p>
        </div>
        {selectedSale && <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200">Create / Reset Schedule</button>}
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-lg flex items-center gap-4">
        <label className="text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 flex-shrink-0">Select Installment Sale</label>
        <select value={selectedSale} onChange={e => setSelectedSale(e.target.value)}
          className="flex-1 bg-black border border-white/10 text-white text-sm px-3 py-2 outline-none appearance-none">
          <option value="">Select a sale…</option>
          {sales.map(s => {
            const car = vehicles.find(v => v.id === s.car_id);
            const cust = customers.find(c => c.id === s.customer_id);
            return <option key={s.id} value={s.id}>{s.id} — {car?.make} {car?.model} · {cust?.name}</option>;
          })}
        </select>
      </div>

      {selectedSale && (
        <>
          {saleInstallments.length > 0 ? (
            <>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Total Installments", value: saleInstallments.length },
                  { label: "Paid", value: paid, color: "text-green-400" },
                  { label: "Overdue", value: overdue, color: "text-red-400" },
                  { label: "Remaining", value: saleInstallments.length - paid },
                ].map(s => (
                  <div key={s.label} className="bg-[#0a0a0a] border border-white/10 p-4 rounded-lg text-center">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">{s.label}</p>
                    <p className={`text-2xl font-light ${s.color || "text-white"}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a0a0a] border border-green-500/20 p-4 rounded-lg flex justify-between">
                  <span className="text-zinc-400 text-sm">Total Collected</span>
                  <span className="text-green-400 font-semibold">{fmtN(totalPaid)}</span>
                </div>
                <div className="bg-[#0a0a0a] border border-red-500/20 p-4 rounded-lg flex justify-between">
                  <span className="text-zinc-400 text-sm">Outstanding Balance</span>
                  <span className="text-red-400 font-semibold">{fmtN(totalDue)}</span>
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/8">
                    {["#", "Due Date", "Amount", "Status", "Paid On", "Action"].map(h => (
                      <th key={h} className="text-left text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-600 px-5 py-3">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {saleInstallments.map(inst => {
                      const isOverdue = inst.status === "pending" && new Date(inst.due_date) < new Date();
                      return (
                        <tr key={inst.id} className="border-b border-white/5 hover:bg-white/2">
                          <td className="px-5 py-3 text-zinc-500">{inst.installment_number}</td>
                          <td className={`px-5 py-3 ${isOverdue ? "text-red-400 font-medium" : "text-white"}`}>{inst.due_date}</td>
                          <td className="px-5 py-3 text-white">{fmtN(inst.amount)}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium uppercase tracking-wider ${inst.status === "paid" ? "bg-green-500/15 text-green-400 border border-green-500/25" : isOverdue ? "bg-red-500/15 text-red-400 border border-red-500/25" : "bg-zinc-800 text-zinc-400 border border-zinc-700"}`}>
                              {inst.status === "paid" ? "Paid" : isOverdue ? "Overdue" : "Pending"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-zinc-500 text-xs">{inst.paid_date || "—"}</td>
                          <td className="px-5 py-3">
                            {inst.status === "pending" && (
                              <button onClick={() => markPaid(inst.id)}
                                className="text-[10px] uppercase tracking-wider px-3 py-1 bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-lg flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-zinc-500 text-sm">No installment schedule created yet for this sale.</p>
              <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200">
                Create Schedule
              </button>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.9)" }}>
          <div className="bg-[#111] border border-white/10 w-full max-w-md rounded-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Create Installment Schedule</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">Number of Months</label>
                <input type="number" value={emiForm.months} onChange={e => setEmiForm(p => ({ ...p, months: e.target.value }))}
                  className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:border-white/40" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">First Installment Date</label>
                <input type="date" value={emiForm.startDate} onChange={e => setEmiForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:border-white/40" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">Monthly Amount (৳)</label>
                <input type="number" value={emiForm.monthlyAmount} onChange={e => setEmiForm(p => ({ ...p, monthlyAmount: e.target.value }))}
                  placeholder="e.g. 500000"
                  className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none focus:border-white/40" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10 hover:border-white/30">Cancel</button>
                <button onClick={createSchedule} disabled={saving} className="px-5 py-2 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold hover:bg-zinc-200 disabled:opacity-50">
                  {saving ? "Creating…" : "Create Schedule"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   DOCUMENT VAULT
══════════════════════════════════════════════════════════════ */
const DocumentVault = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("Auction Sheet");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [v, d] = await Promise.all([
      supabase.from("vehicles").select("id,make,model,year").order("created_at", { ascending: false }),
      supabase.from("vehicle_documents").select("*").order("uploaded_at", { ascending: false }),
    ]);
    setVehicles((v.data as any) || []);
    setDocuments((d.data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVehicle) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${selectedVehicle}/${docType.replace(/ /g, "_")}_${Date.now()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from("car-images").upload(path, file);
    if (uploadError) { alert("Upload error: " + uploadError.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("car-images").getPublicUrl(path);
    await supabase.from("vehicle_documents").insert([{
      vehicle_id: selectedVehicle,
      document_type: docType,
      file_name: file.name,
      file_url: urlData.publicUrl,
    }]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  const deleteDoc = async (id: number) => {
    await supabase.from("vehicle_documents").delete().eq("id", id);
    setDocuments(p => p.filter(d => d.id !== id));
  };

  const filteredDocs = selectedVehicle ? documents.filter(d => d.vehicle_id === selectedVehicle) : documents;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">Document Vault</h1>
        <p className="text-zinc-500 text-sm mt-1">Store and manage vehicle documents — auction sheets, customs papers, registration</p>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-lg">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-4">Upload Document</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">Vehicle</label>
            <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}
              className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none appearance-none">
              <option value="">All vehicles</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.id} — {v.make} {v.model} ({v.year})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">Document Type</label>
            <select value={docType} onChange={e => setDocType(e.target.value)}
              className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2.5 outline-none appearance-none">
              {["Auction Sheet", "Customs Declaration", "Bill of Lading", "Import Permit", "Registration Paper", "Insurance Certificate", "Sales Agreement", "C&F Agent Agreement", "Other"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold tracking-[0.2em] uppercase text-zinc-500 mb-1">File (PDF, Image)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              disabled={!selectedVehicle || uploading}
              onChange={handleUpload}
              className="w-full bg-black border border-white/10 text-white text-sm px-3 py-2 outline-none file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-zinc-700 file:text-white file:text-xs file:cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>
        {uploading && <p className="text-zinc-400 text-xs mt-3 animate-pulse">Uploading document…</p>}
        {!selectedVehicle && <p className="text-zinc-600 text-xs mt-3">Select a vehicle above to enable upload</p>}
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8 flex justify-between items-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500">
            {selectedVehicle ? `Documents for ${vehicles.find(v => v.id === selectedVehicle)?.make} ${vehicles.find(v => v.id === selectedVehicle)?.model}` : `All Documents (${documents.length})`}
          </p>
        </div>
        {filteredDocs.length === 0 ? (
          <div className="px-5 py-12 text-center text-zinc-600 text-sm">No documents uploaded yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/8">
              {["Vehicle", "Document Type", "File Name", "Uploaded", ""].map(h => (
                <th key={h} className="text-left text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-600 px-5 py-3">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredDocs.map(doc => {
                const veh = vehicles.find(v => v.id === doc.vehicle_id);
                return (
                  <tr key={doc.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-5 py-3 text-zinc-400 text-xs font-mono">{veh ? `${veh.make} ${veh.model}` : doc.vehicle_id}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-xs rounded border border-zinc-700">{doc.document_type}</span></td>
                    <td className="px-5 py-3 text-white text-xs">{doc.file_name}</td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 flex gap-3">
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-wider text-zinc-400 border border-white/10 px-2 py-1 hover:border-white/30 hover:text-white transition-all">View</a>
                      <button onClick={() => deleteDoc(doc.id)} className="text-[10px] uppercase tracking-wider text-red-500/60 border border-red-500/20 px-2 py-1 hover:border-red-500/40 hover:text-red-400 transition-all">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   NAV
══════════════════════════════════════════════════════════════ */
const NAV_GROUPS = [
  {
    label: "Overview", items: [
      { id: "dashboard", label: "Dashboard", icon: "◈" },
      { id: "analytics", label: "Analytics", icon: "▥" },
    ]
  },
  {
    label: "Operations", items: [
      { id: "inventory", label: "Inventory", icon: "◻" },
      { id: "sales", label: "Sales", icon: "◇" },
      { id: "shipments", label: "Shipments", icon: "△" },
      { id: "customs", label: "Customs", icon: "⬡" },
    ]
  },
  {
    label: "Import Tools", items: [
      { id: "landedCost", label: "Cost Calc", icon: "⊕" },
      { id: "nbrDuty", label: "NBR Duty", icon: "⊜" },
      { id: "invoice", label: "Invoices", icon: "▤" },
      { id: "installments", label: "Installments", icon: "◷" },
      { id: "vault", label: "Documents", icon: "◩" },
    ]
  },
  {
    label: "People", items: [
      { id: "customers", label: "Customers", icon: "○" },
      { id: "enquiries", label: "Enquiries", icon: "✉" },
      { id: "staff", label: "Staff & HR", icon: "◉" },
    ]
  },
  {
    label: "Finance", items: [
      { id: "finance", label: "Finance", icon: "◎" },
      { id: "reports", label: "Reports", icon: "▣" },
    ]
  },
  {
    label: "System", items: [
      { id: "website", label: "Website CMS", icon: "⊞" },
      { id: "settings", label: "Settings", icon: "⊙" },
    ]
  },
];
const NAV = NAV_GROUPS.flatMap(g => g.items);

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function Page() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["Overview", "Operations", "People", "Finance", "System", "Import Tools"]);
  const toggleGroup = (label: string) => {
    setExpandedGroups(p => p.includes(label) ? p.filter(g => g !== label) : [...p, label]);
  };
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
    customs: <Customs />, reports: <Reports />, settings: <Settings />, analytics: <Analytics />,
    landedCost: <LandedCost />, nbrDuty: <NBRCalculator />, invoice: <InvoiceGenerator />,
    installments: <InstallmentTracker />, vault: <DocumentVault />,
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
        <nav className="flex-1 overflow-y-auto" style={{ padding: "8px" }}>
          {NAV_GROUPS.map(group => {
            const isExpanded = expandedGroups.includes(group.label);
            const hasActive = group.items.some(n => n.id === active);
            return (
              <div key={group.label} style={{ marginBottom: 2 }}>
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px", border: "none", cursor: "pointer",
                      background: hasActive && !isExpanded ? "rgba(201,168,76,0.08)" : "transparent",
                      borderRadius: 6, fontFamily: "inherit", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = hasActive && !isExpanded ? "rgba(201,168,76,0.08)" : "transparent"}
                  >
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: hasActive ? "#c9a84c" : "rgba(255,255,255,0.55)", userSelect: "none",
                    }}>
                      {group.label}
                    </span>
                    <span style={{
                      fontSize: 10, color: "rgba(255,255,255,0.45)",
                      transition: "transform 0.2s",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      display: "inline-block",
                    }}>▼</span>
                  </button>
                ) : (
                  <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "6px 4px" }} />
                )}

                {(isExpanded || collapsed) && (
                  <div style={{
                    overflow: "hidden",
                    maxHeight: isExpanded || collapsed ? 500 : 0,
                    transition: "max-height 0.25s ease",
                  }}>
                    {group.items.map(n => {
                      const isActive = active === n.id;
                      return (
                        <button key={n.id} onClick={() => setActive(n.id)} title={collapsed ? n.label : ""}
                          className="w-full flex items-center text-left transition-all"
                          style={{
                            gap: 10,
                            padding: collapsed ? "9px 14px" : "8px 12px 8px 20px",
                            marginBottom: 2, borderRadius: 6, border: "none", cursor: "pointer",
                            background: isActive ? "rgba(201,168,76,0.22)" : "transparent",
                            color: isActive ? "#e8c96b" : "rgba(255,255,255,0.75)",
                            fontFamily: "inherit", fontSize: 13.5,
                            borderLeft: isActive ? "2px solid #c9a84c" : "2px solid transparent",
                          }}
                          onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,1)"; } }}
                          onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; } }}
                        >
                          <span style={{ fontSize: 13, flexShrink: 0, width: 16, textAlign: "center" }}>{n.icon}</span>
                          {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
