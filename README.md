# carhouse-admin

Private management system for CarHouse Imports Ltd — a luxury automobile import and sales business in Bangladesh. Built to handle the full operational workflow from vehicle sourcing to final sale, with all changes reflecting on the public showroom website instantly via a shared Supabase backend.

---

## Modules

- **Inventory** — Add, edit, and manage vehicles with multi-image gallery, engine bay image, features checklist, dimensions, and status tracking (Available / Reserved / In Transit / Sold)
- **Shipments** — Track incoming vehicles and manage shipping status
- **Customs** — Manage customs clearance records and documentation
- **NBR Duty** — Bangladesh National Board of Revenue duty calculations per vehicle
- **Cost Calculation** — Calculate total landed cost per vehicle including purchase, shipping, customs, and duty
- **Analytics** — Sales stats, revenue overview, and inventory counts
- **Invoices** — Generate and manage customer invoices
- **Documents** — Store and manage vehicle-related documents
- **Installments** — Track and manage customer installment payment plans
- **Site Settings** — Edit the public website's hero video, tagline, headline, and CTA text without redeployment

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript |
| Styling | Tailwind CSS |
| Backend & DB | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Deployment | Vercel |

---

## Local Development

```bash
git clone https://github.com/Shafayatur/carhouse-admin.git
cd carhouse-admin
npm install
cp .env.example .env.local
npm run dev
```

**.env.local**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

---

## Deployment

Deployed on Vercel. Pushes to `main` trigger automatic deployment.

---

*Built by Shafayatur Rahman*
