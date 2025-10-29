import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";
import Modal from "../components/Modal";

type Project = { id: string; name: string; description?: string };

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Your Projects
          </h1>
          <p className="text-slate-400">
            Create, plan, and collaborate in real-time.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          New Project
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/project/${p.id}`}
              className="card hover:shadow-soft transition"
            >
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="text-slate-400 text-sm mt-1">
                {p.description || "No description"}
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="text-slate-400">
              No projects yet. Create your first one!
            </div>
          )}
        </div>
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
              className="btn-primary"
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
            <input
              className="input mt-1"
              placeholder="e.g. Sprint Board"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
          {error && <div className="text-pink-300 text-sm">{error}</div>}
        </div>
      </Modal>
    </div>
  );
}
