import { useEffect, useMemo, useState } from "react";
import { api, setToken } from "../api";
import { AnimatePresence, motion } from "framer-motion";

type Status = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";
type Tag = "ADAS" | "AUTOSAR" | "HIL" | "SIL" | "SDV" | "AI" | "CLOUD";
type Job = { id?: number; company: string; role: string; status: Status; automotive_tag?: Tag; notes?: string };

const statusBadge = (s: Status) => {
  const map: Record<Status, string> = {
    APPLIED: "bg-gray-100 text-gray-800",
    INTERVIEW: "bg-yellow-100 text-yellow-800",
    OFFER: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${map[s]}`;
};

export default function Jobs() {
  const [items, setItems] = useState<Job[]>([]);
  const [form, setForm] = useState<Job>({ company: "", role: "", status: "APPLIED" });

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
    api.get<Job[]>("/jobs/").then((r) => setItems(r.data));
  }, []);

  async function add() {
    if (!form.company || !form.role) return;
    const r = await api.post<Job>("/jobs/", form);
    setItems([r.data, ...items]);
    setForm({ company: "", role: "", status: "APPLIED" });
  }

  async function remove(id?: number) {
    if (!id) return;
    await api.delete(`/jobs/${id}/`);
    setItems(items.filter((i) => i.id !== id));
  }

  async function changeStatus(id: number | undefined, status: Status) {
    if (!id) return;
    const r = await api.patch<Job>(`/jobs/${id}/`, { status });
    setItems(items.map((j) => (j.id === id ? r.data : j)));
  }

  const counts = useMemo(() => {
    const c: Record<Status, number> = { APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 };
    items.forEach((j) => (c[j.status] = (c[j.status] ?? 0) + 1));
    return c;
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Job Applications</h1>
          <nav className="space-x-3">
            <a className="text-blue-600 underline" href="/dashboard">Dashboard</a>
            <a className="text-blue-600 underline" href="/auto-lab">Auto Lab</a>
            <a className="text-gray-600 underline" href="/">Logout</a>
          </nav>
        </header>

        {/* Quick Add */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <input className="border p-2 rounded" placeholder="Company"
                   value={form.company} onChange={e=>setForm({...form, company:e.target.value})}/>
            <input className="border p-2 rounded" placeholder="Role"
                   value={form.role} onChange={e=>setForm({...form, role:e.target.value})}/>
            <select className="border p-2 rounded" value={form.status}
                    onChange={e=>setForm({...form, status: e.target.value as Status})}>
              <option>APPLIED</option><option>INTERVIEW</option><option>OFFER</option><option>REJECTED</option>
            </select>
            <select className="border p-2 rounded" value={form.automotive_tag ?? ""}
                    onChange={e=>setForm({...form, automotive_tag: (e.target.value || undefined) as Tag})}>
              <option value="">(Tag)</option>
              <option>ADAS</option><option>AUTOSAR</option><option>HIL</option>
              <option>SIL</option><option>SDV</option><option>AI</option><option>CLOUD</option>
            </select>
            <button onClick={add} className="bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">Add</button>
          </div>
        </div>

        {/* Status cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {(["APPLIED","INTERVIEW","OFFER","REJECTED"] as Status[]).map(k=>(
            <div key={k} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">{k}</div>
              <div className="text-3xl font-semibold">{counts[k] ?? 0}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Tag</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <AnimatePresence component={undefined}>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No jobs yet. Add your first entry above.</td></tr>
                ) : (
                  items.map((j) => (
                    <motion.tr key={j.id}
                      initial={{opacity:0, y:10}}
                      animate={{opacity:1, y:0}}
                      exit={{opacity:0, y:-10}}
                      transition={{duration:0.25}}
                      className="border-t"
                    >
                      <td className="px-4 py-3 font-medium">{j.company}</td>
                      <td className="px-4 py-3">{j.role}</td>
                      <td className="px-4 py-3">{j.automotive_tag ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={statusBadge(j.status)}>{j.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <select className="border p-1 rounded" value={j.status}
                                onChange={e => changeStatus(j.id, e.target.value as Status)}>
                          <option>APPLIED</option><option>INTERVIEW</option>
                          <option>OFFER</option><option>REJECTED</option>
                        </select>
                        <button onClick={()=>remove(j.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </AnimatePresence>
          </table>
        </div>
      </div>
    </div>
  );
}
