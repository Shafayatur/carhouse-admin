"use client";

import { useState, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════
   DATA
   (In a real app, these would come from your API routes)
══════════════════════════════════════════════════════════════ */
const MOCK_INVENTORY = [
  { id:"INV-001",make:"Toyota",model:"Land Cruiser GX",year:2024,color:"Pearl White",vin:"JT3HN87R5Y0234512",origin:"Japan",port:"Chittagong",purchasePrice:8500000,sellingPrice:11200000,status:"Available",condition:"New",mileage:0,engineCC:4608,transmission:"Automatic",fuelType:"Petrol",importDate:"2024-11-10",chassisNo:"CH-23451",customsDuty:1200000,shippingCost:450000,featured:true},
  { id:"INV-002",make:"BMW",model:"X5 xDrive40i",year:2023,color:"Sapphire Black",vin:"5UXCR6C04P9N12345",origin:"Germany",port:"Chittagong",purchasePrice:9200000,sellingPrice:13500000,status:"Reserved",condition:"New",mileage:12,engineCC:2998,transmission:"Automatic",fuelType:"Petrol",importDate:"2024-10-05",chassisNo:"CH-23452",customsDuty:1800000,shippingCost:520000,featured:true},
  { id:"INV-003",make:"Mercedes-Benz",model:"GLE 450 AMG",year:2024,color:"Obsidian Black",vin:"4JGFB4JB8PA123456",origin:"Germany",port:"Mongla",purchasePrice:10800000,sellingPrice:15900000,status:"Sold",condition:"New",mileage:0,engineCC:2999,transmission:"Automatic",fuelType:"Petrol",importDate:"2024-09-20",chassisNo:"CH-23453",customsDuty:2100000,shippingCost:580000,featured:false},
  { id:"INV-004",make:"Lexus",model:"LX 600 Ultra",year:2024,color:"Sonic Titanium",vin:"JTJHY7AX0P4098765",origin:"Japan",port:"Chittagong",purchasePrice:12500000,sellingPrice:17800000,status:"Available",condition:"New",mileage:0,engineCC:3444,transmission:"Automatic",fuelType:"Petrol",importDate:"2025-01-15",chassisNo:"CH-23454",customsDuty:2500000,shippingCost:620000,featured:true},
  { id:"INV-005",make:"Porsche",model:"Cayenne S",year:2023,color:"Carmine Red",vin:"WP1AF2AY4NDA67890",origin:"Germany",port:"Chittagong",purchasePrice:11200000,sellingPrice:16200000,status:"Available",condition:"New",mileage:5,engineCC:2894,transmission:"Automatic",fuelType:"Petrol",importDate:"2024-12-01",chassisNo:"CH-23455",customsDuty:2200000,shippingCost:590000,featured:false},
  { id:"INV-006",make:"Audi",model:"Q7 55 TFSI",year:2024,color:"Glacier White",vin:"WA1VXAF72PD023456",origin:"Germany",port:"Chittagong",purchasePrice:9800000,sellingPrice:14200000,status:"In Transit",condition:"New",mileage:0,engineCC:2995,transmission:"Automatic",fuelType:"Petrol",importDate:"2025-02-10",chassisNo:"CH-23456",customsDuty:1950000,shippingCost:540000,featured:false},
  { id:"INV-007",make:"Land Rover",model:"Defender 110 X",year:2024,color:"Gondwana Stone",vin:"SALPA2RX4PA123456",origin:"UK",port:"Chittagong",purchasePrice:10200000,sellingPrice:15500000,status:"Available",condition:"New",mileage:0,engineCC:2997,transmission:"Automatic",fuelType:"Petrol",importDate:"2025-01-28",chassisNo:"CH-23457",customsDuty:2050000,shippingCost:560000,featured:true},
  { id:"INV-008",make:"Volvo",model:"XC90 B6 Ultimate",year:2024,color:"Crystal White",vin:"YV1PA8543P1234567",origin:"Sweden",port:"Chittagong",purchasePrice:7200000,sellingPrice:10800000,status:"Available",condition:"New",mileage:0,engineCC:1969,transmission:"Automatic",fuelType:"Mild Hybrid",importDate:"2025-02-20",chassisNo:"CH-23458",customsDuty:1440000,shippingCost:480000,featured:false},
];
const MOCK_CUSTOMERS = [
  { id:"CUS-001",name:"Rafiqul Islam",phone:"+8801711234567",email:"rafiqul@example.com",address:"Gulshan-2, Dhaka",nid:"1234567890123",type:"Individual",totalPurchases:1,status:"Active",joinDate:"2024-09-20",notes:"VIP — prefers luxury SUVs"},
  { id:"CUS-002",name:"Sonia Akter",phone:"+8801812345678",email:"sonia@abcltd.com",address:"Dhanmondi, Dhaka",nid:"9876543210987",type:"Corporate",totalPurchases:0,status:"Active",joinDate:"2024-10-15",notes:"Interested in BMW X5"},
  { id:"CUS-003",name:"Karim Enterprises",phone:"+8801923456789",email:"karim@karim.com",address:"Motijheel, Dhaka",nid:"TIN-456789",type:"Corporate",totalPurchases:4,status:"Active",joinDate:"2024-08-01",notes:"Fleet buyer — 4 vehicles"},
  { id:"CUS-004",name:"Ahmed Nawaz",phone:"+8801611111111",email:"ahmed@nawaz.com",address:"Sylhet",nid:"1112223334445",type:"Individual",totalPurchases:1,status:"Active",joinDate:"2024-11-05",notes:"Referred by Karim"},
];
const MOCK_SALES = [
  { id:"SAL-001",carId:"INV-003",customerId:"CUS-001",saleDate:"2024-12-15",salePrice:15900000,downPayment:5000000,paymentMethod:"Installment",status:"Completed",salesperson:"Tanvir Ahmed",discount:200000,notes:"3-year installment plan"},
  { id:"SAL-002",carId:"INV-001",customerId:"CUS-003",saleDate:"2025-01-20",salePrice:11200000,downPayment:11200000,paymentMethod:"Full",status:"Completed",salesperson:"Nadia Rahman",discount:0,notes:"Cash deal"},
];
const MOCK_SHIPMENTS = [
  { id:"SHP-001",origin:"Yokohama, Japan",destination:"Chittagong",carIds:["INV-001","INV-004"],vessel:"MV Asian Tiger",bl:"BL-2024-001234",etd:"2024-10-20",eta:"2024-11-08",status:"Delivered",agent:"Evergreen Logistics",freight:1070000},
  { id:"SHP-002",origin:"Hamburg, Germany",destination:"Chittagong",carIds:["INV-002","INV-003","INV-005"],vessel:"MV Euro Star",bl:"BL-2024-002345",etd:"2024-09-15",eta:"2024-10-30",status:"Delivered",agent:"MSC Bangladesh",freight:1690000},
  { id:"SHP-003",origin:"Hamburg, Germany",destination:"Chittagong",carIds:["INV-006"],vessel:"MV Global Link",bl:"BL-2025-000123",etd:"2025-01-25",eta:"2025-03-10",status:"In Transit",agent:"Maersk BD",freight:540000},
];
const MOCK_EXPENSES = [
  { id:"EXP-001",category:"Shipping",amount:1070000,date:"2024-11-01",desc:"SHP-001 freight"},
  { id:"EXP-002",category:"Customs & Taxes",amount:7510000,date:"2024-11-10",desc:"Clearance SHP-001"},
  { id:"EXP-003",category:"Staff Salary",amount:295000,date:"2024-11-30",desc:"November salaries"},
  { id:"EXP-004",category:"Showroom Rent",amount:150000,date:"2024-11-01",desc:"Monthly rent"},
  { id:"EXP-005",category:"Insurance",amount:320000,date:"2024-10-20",desc:"Marine insurance SHP-002"},
];
const MOCK_STAFF = [
  { id:"STF-001",name:"Tanvir Ahmed",role:"Sales Manager",email:"tanvir@carhouse.com.bd",phone:"+8801711000001",salary:85000,department:"Sales",status:"Active",join:"2022-01-15"},
  { id:"STF-002",name:"Nadia Rahman",role:"Sales Executive",email:"nadia@carhouse.com.bd",phone:"+8801811000002",salary:55000,department:"Sales",status:"Active",join:"2023-03-10"},
  { id:"STF-003",name:"Arif Hossain",role:"Import Manager",email:"arif@carhouse.com.bd",phone:"+8801611000003",salary:90000,department:"Import",status:"Active",join:"2021-07-20"},
  { id:"STF-004",name:"Sumaiya Begum",role:"Accountant",email:"sumaiya@carhouse.com.bd",phone:"+8801911000004",salary:65000,department:"Finance",status:"Active",join:"2023-06-01"},
];

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
const fmt = (n: any) => "৳ " + Number(n).toLocaleString("en-BD");

const Badge = ({ label }: { label: string }) => {
  const map: Record<string, string> = {
    Available:"bg-white text-black", Reserved:"bg-zinc-700 text-white border border-zinc-500",
    Sold:"bg-zinc-900 text-zinc-400 border border-zinc-700", "In Transit":"bg-zinc-800 text-zinc-300 border border-zinc-600",
    Processing:"bg-zinc-800 text-zinc-300", Delivered:"bg-white/10 text-white border border-white/20",
    Completed:"bg-white text-black", Active:"bg-white text-black",
    Cleared:"bg-white text-black", Corporate:"bg-zinc-800 text-white", Individual:"bg-zinc-700 text-white",
    Full:"bg-white text-black", Installment:"bg-zinc-700 text-white",
  };
  return <span className={`px-2.5 py-0.5 text-xs font-medium tracking-wider uppercase ${map[label]||"bg-zinc-800 text-zinc-300"}`}>{label}</span>;
};

const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.9)"}}>
    <div className="bg-[#111] border border-white/10 w-full max-w-2xl max-h-[88vh] overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <h2 className="text-base font-semibold text-white tracking-wide">{title}</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none">×</button>
      </div>
      <div className="px-8 py-6">{children}</div>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string, children: React.ReactNode }) => (
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

/* ══════════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════════ */
const StatCard = ({ label, value, sub }: { label: string, value: string | number, sub?: string }) => (
  <div className="border border-white/10 p-6 bg-[#0a0a0a]">
    <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-3">{label}</p>
    <p className="text-3xl font-light text-white mb-1">{value}</p>
    {sub && <p className="text-xs text-zinc-600">{sub}</p>}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   SECTIONS
══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const rev = MOCK_SALES.reduce((a,s)=>a+s.salePrice,0);
  const exp = MOCK_EXPENSES.reduce((a,e)=>a+e.amount,0);
  const avail = MOCK_INVENTORY.filter(c=>c.status==="Available").length;
  const transit = MOCK_INVENTORY.filter(c=>c.status==="In Transit").length;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1 tracking-wide">Car House Imports Ltd. — System Overview</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
        <StatCard label="Total Revenue" value={fmt(rev)} sub="Completed sales" />
        <StatCard label="Available Stock" value={avail} sub="Ready for sale" />
        <StatCard label="In Transit" value={transit} sub="Incoming" />
        <StatCard label="Net Profit Est." value={fmt(rev-exp)} sub="Rev. minus expenses" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/5">
        <div className="lg:col-span-2 bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Recent Sales</p>
          <div className="space-y-0">
            {MOCK_SALES.map(s=>{
              const car=MOCK_INVENTORY.find(c=>c.id===s.carId);
              const cust=MOCK_CUSTOMERS.find(c=>c.id===s.customerId);
              return (
                <div key={s.id} className="flex items-center justify-between py-4 border-b border-white/5">
                  <div>
                    <p className="text-white text-sm">{car?.make} {car?.model}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{cust?.name} · {s.saleDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{fmt(s.salePrice)}</p>
                    <div className="mt-1"><Badge label={s.status}/></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Inventory Status</p>
          {["Available","Reserved","In Transit","Sold"].map(st=>{
            const cnt = MOCK_INVENTORY.filter(c=>c.status===st).length;
            const pct = Math.round(cnt/MOCK_INVENTORY.length*100);
            return (
              <div key={st} className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-400 tracking-wide">{st}</span>
                  <span className="text-zinc-600">{cnt}</span>
                </div>
                <div className="h-px bg-white/8">
                  <div className="h-px bg-white transition-all duration-1000" style={{width:`${pct}%`}}/>
                </div>
              </div>
            );
          })}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-4">Alerts</p>
            {[
              {msg:"SHP-003 arriving ~Mar 2025",urgent:false},
              {msg:"INV-006 customs pending",urgent:true},
              {msg:"BMW X5 — awaiting payment",urgent:false},
            ].map((a,i)=>(
              <div key={i} className={`flex gap-3 p-3 mb-2 text-xs border ${a.urgent?"border-white/20 text-white bg-white/5":"border-white/5 text-zinc-400"}`}>
                <span>{a.urgent?"⚠":"·"}</span>{a.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Inventory = () => {
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("All");
  const [selected,setSelected]=useState<any>(null);
  const [showAdd,setShowAdd]=useState(false);
  const filtered = MOCK_INVENTORY.filter(c=>(filter==="All"||c.status===filter)&&`${c.make} ${c.model} ${c.id}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-light text-white tracking-wide">Inventory</h1>
          <p className="text-zinc-500 text-sm mt-1">{MOCK_INVENTORY.length} vehicles total</p>
        </div>
        <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors">
          + Add Vehicle
        </button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="flex items-center gap-3 border border-white/10 px-4 py-2 flex-1 min-w-48 bg-[#0a0a0a]">
          <span className="text-zinc-600 text-xs">⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search vehicles…" className="bg-transparent text-sm text-white placeholder-zinc-600 outline-none w-full"/>
        </div>
        {["All","Available","Reserved","In Transit","Sold"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase transition-all ${filter===f?"bg-white text-black":"bg-[#0a0a0a] text-zinc-500 border border-white/10 hover:border-white/30"}`}>{f}</button>
        ))}
      </div>
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["ID","Vehicle","Year","Origin","Purchase","Selling","Status",""].map(h=>(
                <th key={h} className="text-left text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-600 px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((car,i)=>(
              <tr key={car.id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i%2===0?"":"bg-white/1"}`}>
                <td className="px-5 py-4 text-zinc-500 font-mono text-xs">{car.id}</td>
                <td className="px-5 py-4"><p className="text-white">{car.make} {car.model}</p><p className="text-zinc-600 text-xs mt-0.5">{car.color} · {car.engineCC}cc</p></td>
                <td className="px-5 py-4 text-zinc-400">{car.year}</td>
                <td className="px-5 py-4 text-zinc-500 text-xs">{car.origin}</td>
                <td className="px-5 py-4 text-zinc-300">{fmt(car.purchasePrice)}</td>
                <td className="px-5 py-4 text-white font-medium">{fmt(car.sellingPrice)}</td>
                <td className="px-5 py-4"><Badge label={car.status}/></td>
                <td className="px-5 py-4"><button onClick={()=>setSelected(car)} className="text-zinc-600 hover:text-white text-xs tracking-wider uppercase transition-colors">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <Modal title={`${selected.make} ${selected.model}`} onClose={()=>setSelected(null)}>
          <div className="grid grid-cols-2 gap-5">
            {[["ID",selected.id],["VIN",selected.vin],["Chassis",selected.chassisNo],["Year",selected.year],["Color",selected.color],["Origin",selected.origin],["Port",selected.port],["Engine",selected.engineCC+"cc"],["Trans",selected.transmission],["Fuel",selected.fuelType],["Mileage",selected.mileage+" km"],["Import Date",selected.importDate],["Purchase Price",fmt(selected.purchasePrice)],["Selling Price",fmt(selected.sellingPrice)],["Customs Duty",fmt(selected.customsDuty)],["Shipping",fmt(selected.shippingCost)]].map(([k,v])=>(
              <div key={k}><p className="text-[9px] tracking-[0.25em] uppercase text-zinc-600 mb-1">{k}</p><p className="text-white text-sm">{v}</p></div>
            ))}
            <div className="col-span-2"><p className="text-[9px] tracking-[0.25em] uppercase text-zinc-600 mb-2">Status</p><Badge label={selected.status}/></div>
            <div className="col-span-2"><p className="text-[9px] tracking-[0.25em] uppercase text-zinc-600 mb-2">Featured on Website</p><span className={`text-xs ${selected.featured?"text-white":"text-zinc-600"}`}>{selected.featured?"Yes — visible on homepage":"No"}</span></div>
          </div>
        </Modal>
      )}
      {showAdd && (
        <Modal title="Add New Vehicle" onClose={()=>setShowAdd(false)}>
          <div className="grid grid-cols-2 gap-4">
            {["Make","Model","Year","Color","VIN","Chassis No","Origin","Port","Engine CC","Transmission","Purchase Price","Selling Price","Customs Duty","Shipping Cost"].map(f=>(
              <Field key={f} label={f}><Input placeholder={f}/></Field>
            ))}
            <Field label="Fuel Type"><Select><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option></Select></Field>
            <Field label="Condition"><Select><option>New</option><option>Reconditioned</option><option>Used</option></Select></Field>
          </div>
          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
            <button onClick={()=>setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10 hover:border-white/30 transition-colors">Cancel</button>
            <button onClick={()=>setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold hover:bg-zinc-200 transition-colors">Add Vehicle</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Sales = () => {
  const [showAdd,setShowAdd]=useState(false);
  const rev=MOCK_SALES.reduce((a,s)=>a+s.salePrice,0);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><h1 className="text-2xl font-light text-white tracking-wide">Sales</h1><p className="text-zinc-500 text-sm mt-1">{MOCK_SALES.length} transactions</p></div>
        <button onClick={()=>setShowAdd(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors">+ New Sale</button>
      </div>
      <div className="grid grid-cols-3 gap-px bg-white/5">
        <StatCard label="Total Revenue" value={fmt(rev)} />
        <StatCard label="Avg. Sale" value={fmt(rev/MOCK_SALES.length)} />
        <StatCard label="Total Discounts" value={fmt(MOCK_SALES.reduce((a,s)=>a+s.discount,0))} />
      </div>
      <div className="border border-white/10">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/8">{["Sale ID","Vehicle","Customer","Date","Sale Price","Method","Salesperson","Status"].map(h=><th key={h} className="text-left text-[9px] font-semibold tracking-[0.25em] uppercase text-zinc-600 px-5 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {MOCK_SALES.map(s=>{
              const car=MOCK_INVENTORY.find(c=>c.id===s.carId);
              const cust=MOCK_CUSTOMERS.find(c=>c.id===s.customerId);
              return (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-5 py-4 text-zinc-500 font-mono text-xs">{s.id}</td>
                  <td className="px-5 py-4 text-white">{car?.make} {car?.model}</td>
                  <td className="px-5 py-4 text-zinc-300">{cust?.name}</td>
                  <td className="px-5 py-4 text-zinc-500 text-xs">{s.saleDate}</td>
                  <td className="px-5 py-4 text-white font-medium">{fmt(s.salePrice)}</td>
                  <td className="px-5 py-4"><Badge label={s.paymentMethod}/></td>
                  <td className="px-5 py-4 text-zinc-500 text-xs">{s.salesperson}</td>
                  <td className="px-5 py-4"><Badge label={s.status}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showAdd&&<Modal title="Record New Sale" onClose={()=>setShowAdd(false)}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Vehicle"><Select>{MOCK_INVENTORY.filter(c=>c.status==="Available"||c.status==="Reserved").map(c=><option key={c.id}>{c.id} — {c.make} {c.model}</option>)}</Select></Field>
          <Field label="Customer"><Select>{MOCK_CUSTOMERS.map(c=><option key={c.id}>{c.id} — {c.name}</option>)}</Select></Field>
          {["Sale Date","Sale Price (৳)","Down Payment (৳)","Discount (৳)","Salesperson"].map(f=><Field key={f} label={f}><Input placeholder={f}/></Field>)}
          <Field label="Payment Method"><Select><option>Full</option><option>Installment</option><option>Bank Finance</option></Select></Field>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
          <button onClick={()=>setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10 hover:border-white/30">Cancel</button>
          <button onClick={()=>setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold">Record Sale</button>
        </div>
      </Modal>}
    </div>
  );
};

const Customers = () => {
  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const filtered=MOCK_CUSTOMERS.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.phone.includes(search));
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><h1 className="text-2xl font-light text-white tracking-wide">Customers</h1><p className="text-zinc-500 text-sm mt-1">{MOCK_CUSTOMERS.length} registered</p></div>
        <button onClick={()=>setShowAdd(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors">+ Add</button>
      </div>
      <div className="flex items-center gap-3 border border-white/10 px-4 py-2 bg-[#0a0a0a]">
        <span className="text-zinc-600 text-xs">⌕</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or phone…" className="bg-transparent text-sm text-white placeholder-zinc-600 outline-none w-full"/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
        {filtered.map(c=>(
          <div key={c.id} className="bg-[#0a0a0a] p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-white font-light text-lg">{c.name[0]}</div>
              <Badge label={c.type}/>
            </div>
            <p className="text-white font-medium">{c.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{c.phone}</p>
            <p className="text-zinc-600 text-xs">{c.email}</p>
            <p className="text-zinc-700 text-xs mt-1">{c.address}</p>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
              <span className="text-xs text-zinc-600">{c.totalPurchases} purchase(s)</span>
              <Badge label={c.status}/>
            </div>
            {c.notes&&<p className="text-xs text-zinc-500 mt-2 italic">"{c.notes}"</p>}
          </div>
        ))}
      </div>
      {showAdd&&<Modal title="Add Customer" onClose={()=>setShowAdd(false)}>
        <div className="grid grid-cols-2 gap-4">
          {["Full Name","Phone","Email","NID / TIN"].map(f=><Field key={f} label={f}><Input placeholder={f}/></Field>)}
          <div className="col-span-2"><Field label="Address"><Input placeholder="Address"/></Field></div>
          <Field label="Type"><Select><option>Individual</option><option>Corporate</option></Select></Field>
          <div className="col-span-2"><Field label="Notes"><Input placeholder="Notes"/></Field></div>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
          <button onClick={()=>setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10">Cancel</button>
          <button onClick={()=>setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold">Add</button>
        </div>
      </Modal>}
    </div>
  );
};

const Shipments = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-light text-white tracking-wide">Shipments</h1>
    <div className="space-y-px">
      {MOCK_SHIPMENTS.map(s=>(
        <div key={s.id} className="bg-[#0a0a0a] border border-white/8 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex gap-3 items-center mb-1">
                <span className="font-mono text-xs text-zinc-500">{s.id}</span>
                <Badge label={s.status}/>
              </div>
              <p className="text-white font-medium">{s.origin} → {s.destination}</p>
              <p className="text-zinc-500 text-xs mt-1">Vessel: {s.vessel} · B/L: {s.bl}</p>
            </div>
            <p className="text-white font-medium text-sm">{fmt(s.freight)}</p>
          </div>
          <div className="grid grid-cols-4 gap-6 text-xs border-t border-white/5 pt-4">
            {[["ETD",s.etd],["ETA",s.eta],["Agent",s.agent],["Units",s.carIds.length+" cars"]].map(([k,v])=>(
              <div key={k}><p className="text-zinc-600 uppercase tracking-wider mb-1 text-[9px]">{k}</p><p className="text-white">{v}</p></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Finance = () => {
  const rev=MOCK_SALES.reduce((a,s)=>a+s.salePrice,0);
  const exp=MOCK_EXPENSES.reduce((a,e)=>a+e.amount,0);
  const cats=[...new Set(MOCK_EXPENSES.map(e=>e.category))];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-light text-white tracking-wide">Finance</h1>
      <div className="grid grid-cols-3 gap-px bg-white/5">
        <StatCard label="Total Revenue" value={fmt(rev)} />
        <StatCard label="Total Expenses" value={fmt(exp)} />
        <StatCard label="Net Profit" value={fmt(rev-exp)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Expenses by Category</p>
          {cats.map(cat=>{
            const total=MOCK_EXPENSES.filter(e=>e.category===cat).reduce((a,e)=>a+e.amount,0);
            const pct=Math.round(total/exp*100);
            return <div key={cat} className="mb-4">
              <div className="flex justify-between text-xs mb-2"><span className="text-zinc-300 tracking-wide">{cat}</span><span className="text-zinc-600">{fmt(total)}</span></div>
              <div className="h-px bg-white/8"><div className="h-px bg-white transition-all duration-700" style={{width:`${pct}%`}}/></div>
            </div>;
          })}
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Recent Expenses</p>
          {MOCK_EXPENSES.map(e=>(
            <div key={e.id} className="flex justify-between items-center py-3 border-b border-white/5">
              <div><p className="text-zinc-300 text-xs">{e.desc}</p><p className="text-zinc-600 text-xs">{e.category} · {e.date}</p></div>
              <p className="text-white text-sm">-{fmt(e.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Staff = () => {
  const [showAdd,setShowAdd]=useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-light text-white tracking-wide">Staff & HR</h1>
        <button onClick={()=>setShowAdd(true)} className="px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors">+ Add Staff</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
        {MOCK_STAFF.map(s=>(
          <div key={s.id} className="bg-[#0a0a0a] p-6 flex gap-4">
            <div className="w-12 h-12 border border-white/20 flex items-center justify-center text-white text-lg font-light flex-shrink-0">{s.name[0]}</div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div><p className="text-white font-medium">{s.name}</p><p className="text-zinc-500 text-xs mt-0.5">{s.role} · {s.department}</p></div>
                <Badge label={s.status}/>
              </div>
              <p className="text-zinc-600 text-xs mt-2">{s.phone}</p>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                <span className="text-xs text-zinc-600">Since {s.join}</span>
                <span className="text-white text-sm">{fmt(s.salary)}<span className="text-zinc-600 text-xs">/mo</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {showAdd&&<Modal title="Add Staff" onClose={()=>setShowAdd(false)}>
        <div className="grid grid-cols-2 gap-4">
          {["Full Name","Role","Phone","Email","Monthly Salary (৳)","Join Date"].map(f=><Field key={f} label={f}><Input placeholder={f}/></Field>)}
          <Field label="Department"><Select><option>Sales</option><option>Import</option><option>Finance</option><option>Operations</option></Select></Field>
        </div>
        <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-white/10">
          <button onClick={()=>setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase text-zinc-500 border border-white/10">Cancel</button>
          <button onClick={()=>setShowAdd(false)} className="px-5 py-2.5 text-xs tracking-[0.2em] uppercase bg-white text-black font-semibold">Add Staff</button>
        </div>
      </Modal>}
    </div>
  );
};

const Customs = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-light text-white tracking-wide">Customs & Duties</h1>
    <div className="grid grid-cols-3 gap-px bg-white/5">
      <StatCard label="Duties Paid (Cleared)" value={fmt(7510000)} />
      <StatCard label="Pending Clearance" value="1 shipment" />
      <StatCard label="Pending Tax Est." value={fmt(4302000)} />
    </div>
    <div className="space-y-px">
      {[
        {id:"CUS-CLR-001",ship:"SHP-001",total:7510000,cd:3100000,vat:1890000,sd:2100000,at:420000,status:"Cleared",agent:"Rahman C&F Associates",date:"2024-11-10"},
        {id:"CUS-CLR-002",ship:"SHP-003",total:4302000,cd:1950000,vat:1176000,sd:980000,at:196000,status:"Processing",agent:"Alam C&F",date:null},
      ].map(c=>(
        <div key={c.id} className="bg-[#0a0a0a] border border-white/8 p-6">
          <div className="flex justify-between items-start mb-4">
            <div><div className="flex gap-3 items-center mb-1"><span className="font-mono text-xs text-zinc-500">{c.id}</span><Badge label={c.status}/></div>
              <p className="text-white">Shipment: {c.ship}</p><p className="text-zinc-500 text-xs mt-1">Agent: {c.agent}</p></div>
            <p className="text-white font-medium">{fmt(c.total)}</p>
          </div>
          <div className="grid grid-cols-4 gap-4 text-xs border-t border-white/5 pt-4">
            {[["Customs Duty",c.cd],["VAT",c.vat],["Supp. Duty",c.sd],["Advance Tax",c.at]].map(([k,v])=>(
              <div key={k}><p className="text-zinc-600 uppercase tracking-wider mb-1 text-[9px]">{k}</p><p className="text-white">{fmt(v)}</p></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const WebsiteCMS = () => {
  const [hero,setHero]=useState("Where Luxury Meets the Open Road");
  const [sub,setSub]=useState("We import the world's most coveted automobiles — directly sourced from Japan, Germany, UK and USA.");
  const [featured,setFeatured]=useState<string[]>(MOCK_INVENTORY.filter(c=>c.featured).map(c=>c.id));
  const [saved,setSaved]=useState(false);
  const toggle=(id: string)=>setFeatured(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2500);};
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light text-white tracking-wide">Website CMS</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage content displayed on the public website</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5">
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Hero Section</p>
          <div className="space-y-4">
            <Field label="Hero Headline"><Input value={hero} onChange={e=>setHero(e.target.value)}/></Field>
            <Field label="Hero Subtitle">
              <textarea value={sub} onChange={e=>setSub(e.target.value)} rows={3} className="w-full bg-black border border-white/10 text-white text-sm px-4 py-2.5 outline-none focus:border-white/40 resize-none placeholder-zinc-600"/>
            </Field>
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Contact Info</p>
          <div className="space-y-3">
            {["Showroom Address","Phone Number","Email Address","Business Hours","Google Maps URL"].map(f=>(
              <Field key={f} label={f}><Input placeholder={f}/></Field>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2 bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Featured Vehicles (Homepage)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MOCK_INVENTORY.map(car=>(
              <button key={car.id} onClick={()=>toggle(car.id)} className={`p-3 text-left border transition-all ${featured.includes(car.id)?"border-white bg-white/8":"border-white/10 hover:border-white/30"}`}>
                <p className="text-white text-xs font-medium">{car.make} {car.model}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{car.year} · {car.status}</p>
                {featured.includes(car.id)&&<p className="text-white text-xs mt-1 font-semibold">✓ Featured</p>}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">SEO Settings</p>
          <div className="space-y-3">
            {["Page Title","Meta Description","Keywords"].map(f=><Field key={f} label={f}><Input placeholder={f}/></Field>)}
          </div>
        </div>
        <div className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">Announcement Banner</p>
          <div className="space-y-3">
            <Field label="Banner Text"><Input placeholder="e.g. New arrivals from Japan — arriving March 2025"/></Field>
            <Field label="Banner Link"><Input placeholder="https://…"/></Field>
            <div className="flex items-center gap-3 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-4 bg-white/20 border border-white/20 relative"><div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white transition-all"/></div>
                <span className="text-xs text-zinc-500 tracking-wider uppercase">Show Banner</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={save} className={`px-8 py-3 text-xs font-semibold tracking-[0.25em] uppercase transition-all ${saved?"bg-zinc-700 text-zinc-300":"bg-white text-black hover:bg-zinc-200"}`}>
          {saved?"✓ Saved":"Save Changes"}
        </button>
      </div>
    </div>
  );
};

const Reports = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-light text-white tracking-wide">Reports</h1>
    <div className="flex gap-2 flex-wrap">
      {["This Month","Last Month","Q1 2025","FY 2024–25","Custom Range"].map(r=>(
        <button key={r} className="px-4 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase bg-[#0a0a0a] text-zinc-500 border border-white/10 hover:border-white/30 hover:text-white transition-all">{r}</button>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
      {[
        ["Monthly Sales Report","Revenue, units sold, salesperson performance"],
        ["Inventory Valuation","Current stock value and holding costs"],
        ["Import Cost Analysis","Shipping, customs, duties per unit"],
        ["Profit & Loss Statement","Full P&L with all categories"],
        ["Customer Activity Report","Leads, conversion, repeat buyers"],
        ["Tax & Compliance Report","NBR duties, VAT, advance tax"],
        ["Staff Payroll Report","Monthly salary disbursement"],
        ["Vehicle Aging Report","Days in stock per vehicle"],
      ].map(([name,desc])=>(
        <div key={name} className="bg-[#0a0a0a] p-6 flex items-center justify-between group hover:bg-white/2 transition-colors cursor-pointer border-r border-b border-white/0">
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
      {[
        {title:"Company Profile",fields:["Company Name","Trade License No","TIN Number","VAT Registration","Registered Address"]},
        {title:"Showroom Details",fields:["Showroom Name","Address","Phone","Email","Business Hours"]},
        {title:"Bank Accounts",fields:["Bank Name","Account No","Branch","Routing No","SWIFT Code"]},
        {title:"System Preferences",fields:["Default Currency","Timezone","Date Format","Language"]},
      ].map(sec=>(
        <div key={sec.title} className="bg-[#0a0a0a] p-6">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500 mb-5">{sec.title}</p>
          <div className="space-y-4">
            {sec.fields.map(f=><Field key={f} label={f}><Input placeholder={f==="Company Name"?"Car House Imports Ltd.":f}/></Field>)}
          </div>
          <button className="mt-5 px-5 py-2.5 bg-white text-black text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-200 transition-colors">Save</button>
        </div>
      ))}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   NAV CONFIG
══════════════════════════════════════════════════════════════ */
const NAV = [
  {id:"dashboard",label:"Dashboard",icon:"◈"},
  {id:"inventory",label:"Inventory",icon:"◻"},
  {id:"sales",label:"Sales",icon:"◇"},
  {id:"customers",label:"Customers",icon:"○"},
  {id:"shipments",label:"Shipments",icon:"△"},
  {id:"customs",label:"Customs & Duties",icon:"⬡"},
  {id:"finance",label:"Finance",icon:"◎"},
  {id:"staff",label:"Staff & HR",icon:"◉"},
  {id:"website",label:"Website CMS",icon:"◈"},
  {id:"reports",label:"Reports",icon:"▣"},
  {id:"settings",label:"Settings",icon:"⊙"},
];

/* ══════════════════════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════════════════════ */
const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [u,setU]=useState("");const [p,setP]=useState("");const [err,setErr]=useState("");
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <svg className="mx-auto mb-4" height="44" viewBox="0 0 260 72" fill="none">
            <rect x="1" y="1" width="70" height="70" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
            <text x="14" y="54" fontFamily="serif" fontWeight="300" fontSize="52" fill="white">H</text>
            <line x1="71" y1="16" x2="90" y2="16" stroke="white" strokeWidth="1.5"/>
            <line x1="71" y1="56" x2="90" y2="56" stroke="white" strokeWidth="1.5"/>
            <rect x="90" y="10" width="168" height="52" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
            <text x="104" y="38" fontFamily="sans-serif" fontWeight="700" fontSize="20" fill="white" letterSpacing="3">CAR HOUSE</text>
            <text x="118" y="54" fontFamily="sans-serif" fontWeight="400" fontSize="11" fill="white" letterSpacing="4">IMPORTS LTD.</text>
          </svg>
          <p className="text-zinc-600 text-xs tracking-[0.3em] uppercase">Management System</p>
        </div>
        <div className="border border-white/10 p-8 bg-[#0a0a0a]">
          <div className="space-y-4">
            <Field label="Username"><Input value={u} onChange={e=>setU(e.target.value)} placeholder="admin"/></Field>
            <Field label="Password"><Input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&(u==="admin"&&p==="admin123"?onLogin():setErr("Invalid credentials"))}/></Field>
            {err&&<p className="text-xs text-zinc-400 tracking-wide">{err}</p>}
            <button onClick={()=>u==="admin"&&p==="admin123"?onLogin():setErr("Invalid credentials")} className="w-full py-3 bg-white text-black text-xs font-semibold tracking-[0.25em] uppercase hover:bg-zinc-200 transition-colors mt-2">Sign In</button>
          </div>
          <p className="text-center text-zinc-700 text-xs mt-5 tracking-wider">Demo: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   APP
══════════════════════════════════════════════════════════════ */
export default function Page(){
  const [loggedIn,setLoggedIn]=useState(false);
  const [active,setActive]=useState("dashboard");
  const [collapsed,setCollapsed]=useState(false);

  if(!loggedIn) return <Login onLogin={()=>setLoggedIn(true)}/>;

  const PAGES: Record<string, React.ReactNode> = {dashboard:<Dashboard/>,inventory:<Inventory/>,sales:<Sales/>,customers:<Customers/>,shipments:<Shipments/>,customs:<Customs/>,finance:<Finance/>,staff:<Staff/>,website:<WebsiteCMS/>,reports:<Reports/>,settings:<Settings/>};

  return (
    <div className="min-h-screen flex bg-black text-white" style={{fontFamily:"'Barlow',system-ui,sans-serif"}}>
      {/* Sidebar */}
      <aside className={`${collapsed?"w-14":"w-56"} flex-shrink-0 border-r border-white/8 flex flex-col transition-all duration-300 bg-[#080808]`}>
        <div className="p-4 border-b border-white/8 flex items-center gap-3 h-16">
          {!collapsed&&<div>
            <p className="text-white text-xs font-semibold tracking-[0.15em] uppercase">Car House</p>
            <p className="text-zinc-600 text-[9px] tracking-[0.2em] uppercase">Imports Ltd.</p>
          </div>}
        </div>
        <nav className="flex-1 p-2 overflow-y-auto">
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setActive(n.id)} title={collapsed?n.label:""} className={`w-full flex items-center gap-3 px-3 py-2.5 mb-0.5 transition-all text-left ${active===n.id?"bg-white text-black":"text-zinc-500 hover:text-white hover:bg-white/5"}`}>
              <span className="text-sm flex-shrink-0">{n.icon}</span>
              {!collapsed&&<span className="text-[11px] font-medium tracking-[0.12em] uppercase">{n.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-white/8">
          <button onClick={()=>setCollapsed(!collapsed)} className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-600 hover:text-white hover:bg-white/5 transition-all">
            <span className="text-sm">{collapsed?"→":"←"}</span>
            {!collapsed&&<span className="text-[10px] tracking-[0.15em] uppercase">Collapse</span>}
          </button>
          <button onClick={()=>setLoggedIn(false)} className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-600 hover:text-white hover:bg-white/5 transition-all">
            <span className="text-sm">↑</span>
            {!collapsed&&<span className="text-[10px] tracking-[0.15em] uppercase">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-white/8 flex items-center justify-between px-8 bg-[#080808]">
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-zinc-500">
              {NAV.find(n=>n.id===active)?.label}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-white/10 px-3 py-1.5 bg-black hidden md:flex">
              <span className="text-zinc-600 text-xs">⌕</span>
              <input placeholder="Quick search…" className="bg-transparent text-xs text-white placeholder-zinc-600 outline-none w-28"/>
            </div>
            <div className="w-7 h-7 border border-white/20 flex items-center justify-center text-white text-xs font-light">A</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {PAGES[active]}
        </main>
      </div>
    </div>
  );
}
