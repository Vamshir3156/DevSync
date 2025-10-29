import React, { useEffect, useState } from "react";
import Modal from "./Modal";

export type TaskForm = {
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
};

type Props = {
  open: boolean;
  title: string;
  initial?: TaskForm;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: TaskForm) => void;
};

const STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;

export default function TaskModal({
  open,
  title,
  initial,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<TaskForm>({
    title: "",
    description: "",
    status: "todo",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(
      initial ?? {
        title: "",
        description: "",
        status: "todo",
      }
    );
    setError(null);
  }, [open, initial]);

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={submitting}
            onClick={() => {
              if (!form.title.trim()) {
                setError("Title is required");
                return;
              }
              onSubmit({
                title: form.title.trim(),
                description: form.description?.trim() || "",
                status: form.status,
              });
            }}
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm text-slate-300">Title</label>
          <input
            className="input mt-1"
            placeholder="e.g. Implement OAuth"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">Description</label>
          <textarea
            className="input mt-1 h-28"
            placeholder="Optional details..."
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">Status</label>
          <select
            className="input mt-1"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as TaskForm["status"],
              }))
            }
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="text-pink-300 text-sm">{error}</div>}
      </div>
    </Modal>
  );
}
