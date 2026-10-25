"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];
const EMPTY = { company: "", role: "", status: "Applied", applied_date: "", notes: "" };

export default function Dashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (filter) params.set("status", filter);
      setJobs(await api(`/jobs?${params}`));
      setStats(await api("/jobs/stats"));
    } catch (err) {
      setError(err.message);
    }
  }, [q, filter]);

  useEffect(() => {
    if (!localStorage.getItem("token")) return router.replace("/");
    load();
  }, [load, router]);

  async function save(e) {
    e.preventDefault();
    setError("");
    const body = { ...form, applied_date: form.applied_date || null };
    try {
      await api(editId ? `/jobs/${editId}` : "/jobs", { method: editId ? "PUT" : "POST", body: JSON.stringify(body) });
      setForm(EMPTY);
      setEditId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this job?")) return;
    await api(`/jobs/${id}`, { method: "DELETE" });
    load();
  }

  function edit(job) {
    setEditId(job.id);
    setForm({ company: job.company, role: job.role, status: job.status, applied_date: job.applied_date || "", notes: job.notes || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function logout() {
    localStorage.removeItem("token");
    router.push("/");
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <main className="wrap">
      <header className="top">
        <h1>Job Tracker</h1>
        <button className="btn ghost" onClick={logout}>Log out</button>
      </header>

      <section className="stats">
        {["Total", ...STATUSES].map((s) => (
          <button key={s} className={`stat ${s.toLowerCase()} ${filter === s ? "on" : ""}`}
            onClick={() => setFilter(s === "Total" || filter === s ? "" : s)}>
            <b>{stats[s] ?? 0}</b>
            <span>{s}</span>
          </button>
        ))}
      </section>

      <form className="card form" onSubmit={save}>
        <h2>{editId ? "Edit job" : "Add a job"}</h2>
        <div className="grid">
          <input placeholder="Company" value={form.company} onChange={set("company")} required />
          <input placeholder="Role (e.g. Python Intern)" value={form.role} onChange={set("role")} required />
          <select value={form.status} onChange={set("status")}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input type="date" value={form.applied_date} onChange={set("applied_date")} />
        </div>
        <textarea placeholder="Notes (contact, follow-up date, link)" value={form.notes} onChange={set("notes")} rows={2} />
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row">
          <button className="btn">{editId ? "Save changes" : "Add job"}</button>
          {editId && <button type="button" className="btn ghost" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
      </form>

      <div className="search">
        <input placeholder="Search company or role" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {jobs.length === 0 ? (
        <p className="empty">No jobs here yet. Add your first application above.</p>
      ) : (
        <ul className="list">
          {jobs.map((j) => (
            <li key={j.id} className="card job">
              <div>
                <h3>{j.role}</h3>
                <p>{j.company} · {j.applied_date}</p>
                {j.notes && <p className="notes">{j.notes}</p>}
              </div>
              <div className="side">
                <span className={`tag ${j.status.toLowerCase()}`}>{j.status}</span>
                <div className="row">
                  <button className="link" onClick={() => edit(j)}>Edit</button>
                  <button className="link danger" onClick={() => remove(j.id)}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
