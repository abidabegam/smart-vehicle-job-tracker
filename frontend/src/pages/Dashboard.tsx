import { useEffect, useState } from "react";
import { api, setToken } from "../api";
import { motion } from "framer-motion";

type Job = { id: number; status: "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED" };

export default function Dashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);
    api.get<Job[]>("/jobs/").then((r) => {
      const c: Record<string, number> = {};
      r.data.forEach((j) => (c[j.status] = (c[j.status] ?? 0) + 1));
      setCounts(c);
    });
  }, []);

  const card = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between text-white">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <nav className="space-x-3">
            <a className="underline" href="/auto-lab">Auto Lab</a>
            <a className="underline" href="/jobs">Jobs</a>
            <a className="underline" href="/">Logout</a>
          </nav>
        </header>

        <motion.div
          className="grid sm:grid-cols-2 md:grid-cols-4 gap-4"
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08 }}
        >
          {["APPLIED", "INTERVIEW", "OFFER", "REJECTED"].map((k) => (
            <motion.div key={k} variants={card} className="rounded-2xl border p-6 shadow-md bg-white">
              <div className="text-sm font-medium">{k}</div>
              <motion.div className="text-4xl font-bold" layout>
                {counts[k] ?? 0}
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        <p className="text-white text-lg">
          Track your pipeline here. Use{" "}
          <a className="underline" href="/jobs">Jobs</a> or try{" "}
          <a className="underline" href="/auto-lab">Auto Lab</a>.
        </p>
      </div>
    </div>
  );
}
