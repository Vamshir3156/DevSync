import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import Modal from "../components/Modal";

import {
  FaPlus,
  FaFolderOpen,
  FaSearch,
  FaArrowRight,
  FaRegClock,
  FaExclamationTriangle,
} from "react-icons/fa";

type Project = { id: string; name: string; description?: string };

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term)
    );
  }, [q, projects]);

  const createProject = async () => {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post("/projects", {
        name: name.trim(),
        description: description.trim() || null,
      });
      setProjects((prev) => [data, ...prev]);
      setOpen(false);
      setName("");
      setDescription("");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-900/30 via-slate-900/40 to-emerald-900/20 p-6 shadow-[0_0_30px_rgba(0,255,255,0.08)]">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow">
              <span className="inline-flex items-center gap-3">
                <FaFolderOpen className="text-cyan-300" />
                Your Projects
              </span>
            </h1>
            <p className="mt-2 text-slate-300">
              Create, plan, and collaborate in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <FaSearch
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />{" "}
              <input
                className="pl-9 pr-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 w-64"
                placeholder="Search projects…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => setOpen(true)}
            >
              <FaPlus className="text-white/90 h-5 w-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : projects.length === 0 ? (
        <EmptyState onCreate={() => setOpen(true)} />
      ) : (
        <>
          {filtered.length === 0 && (
            <div className="flex items-center gap-2 text-amber-300 bg-amber-900/20 border border-amber-500/30 rounded-xl px-3 py-2 w-fit">
              <FaExclamationTriangle />
              <span>No projects match “{q}”.</span>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to={`/project/${p.id}`}
                className="group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-5 transition-all hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_8px_30px_rgba(34,211,238,0.18)]"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl transition-all group-hover:scale-110" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/15 border border-cyan-400/30">
                      <FaFolderOpen className="text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {p.name}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400 inline-flex items-center gap-1">
                        <FaRegClock />
                        Updated recently
                      </div>
                    </div>
                  </div>
                  <div className="opacity-60 text-slate-300 group-hover:opacity-100 transition">
                    <FaArrowRight />
                  </div>
                </div>

                {p.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-slate-300">
                    {p.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-emerald-300">
                    Realtime
                  </span>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-cyan-300">
                    Kanban
                  </span>
                  <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wide text-fuchsia-300">
                    Chat
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Project"
        footer={
          <>
            <button className="btn-outline" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              onClick={createProject}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-300">Project Name</label>
            <div className="relative mt-1">
              <input
                className="input pl-10"
                placeholder="e.g. Sprint Board"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-300">
              Description (optional)
            </label>
            <textarea
              className="input mt-1 h-24"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-pink-500/30 bg-pink-500/10 px-3 py-2 text-pink-300 text-sm">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-700/60 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-slate-700/60 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-slate-700/60 rounded animate-pulse" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full bg-slate-700/60 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-slate-700/60 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-slate-700/60 rounded animate-pulse" />
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-5 w-16 bg-slate-700/60 rounded-full animate-pulse" />
            <div className="h-5 w-14 bg-slate-700/60 rounded-full animate-pulse" />
            <div className="h-5 w-12 bg-slate-700/60 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-10 text-center">
      <div className="mx-auto grid place-items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10">
          <FaFolderOpen className="text-cyan-300 text-2xl" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">
            Create your first project
          </h3>
          <p className="mt-1 text-slate-400 max-w-md">
            Organize tasks with drag-drop, chat with your team, and manage
            access via roles.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="btn-primary inline-flex items-center gap-2"
        >
          <FaPlus />
          New Project
        </button>
      </div>
    </div>
  );
}
