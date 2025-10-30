import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import useSWR from "swr";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";
import TaskModal, { TaskForm } from "../components/TaskModal";
import { Plus } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

type Task = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  order?: number;
};

type Message = {
  id: string;
  content: string;
  sender: { name: string } | null;
  createdAt: string;
};

type Member = {
  id: string;
  role: string;
  user: { id: string; email: string; name: string };
};

const API_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function Project() {
  const { id: projectId } = useParams();
  const { user } = useAuthStore();

  const { data: members } = useSWR<Member[]>(
    projectId ? `/members/${projectId}` : null,
    fetcher
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!projectId) return;

    (async () => {
      try {
        const [tasksRes, msgsRes] = await Promise.all([
          api.get(`/tasks/by-project/${projectId}`),
          api.get(`/messages/by-project/${projectId}`),
        ]);
        setTasks(tasksRes.data);
        setMessages(msgsRes.data);
        seenIdsRef.current = new Set(
          (msgsRes.data as Message[]).map((m) => m.id)
        );
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load project");
      }
    })();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const s = io(API_URL, {
      transports: ["websocket"],
      withCredentials: false,
    });
    socketRef.current = s;

    s.on("connect", () => s.emit("joinProject", projectId));

    s.on("project:message", (msg: Message) => {
      if (seenIdsRef.current.has(msg.id)) return;
      seenIdsRef.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.off("project:message");
      s.disconnect();
      socketRef.current = null;
    };
  }, [projectId]);

  const columns = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === "todo"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      done: tasks.filter((t) => t.status === "done"),
    }),
    [tasks]
  );

  const onCreateTask = async (data: TaskForm) => {
    if (!projectId) return;
    setSavingTask(true);
    try {
      const { data: created } = await api.post("/tasks", {
        projectId,
        title: data.title,
        description: data.description,
        status: data.status,
      });
      setTasks((prev) => [created, ...prev]);
      setOpenCreate(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create task");
    } finally {
      setSavingTask(false);
    }
  };

  const onEditTask = async (data: TaskForm) => {
    if (!editing) return;
    setSavingTask(true);
    try {
      const { data: updated } = await api.put(`/tasks/${editing.id}`, {
        title: data.title,
        description: data.description,
        status: data.status,
      });
      setTasks((prev) => prev.map((t) => (t.id === editing.id ? updated : t)));
      setOpenEdit(false);
      setEditing(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update task");
    } finally {
      setSavingTask(false);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as Task["status"];
    const taskId = draggableId;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (e) {
      console.error("Failed to update task status", e);
    }
  };

  const send = async () => {
    setError(null);
    const text = content.trim();
    if (!text || !projectId) return;

    const temp: Message = {
      id: `temp-${Date.now()}`,
      content: text,
      sender: { name: user?.name || "You" },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);
    setContent("");

    try {
      const { data } = await api.post("/messages", {
        projectId,
        content: text,
      });
      seenIdsRef.current.add(data.id);
      setMessages((prev) => prev.map((m) => (m.id === temp.id ? data : m)));
      socketRef.current?.emit("project:message", { projectId, message: data });
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setError(e?.response?.data?.message || "Failed to send message");
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Board</h2>
          <div className="flex items-center">
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setOpenCreate(true)}
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
            <button
              onClick={() => setInviteOpen(true)}
              className="ml-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm"
            >
              Invite
            </button>
          </div>
        </header>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid md:grid-cols-3 gap-4">
            {(["todo", "in_progress", "done"] as const).map((col) => (
              <Droppable droppableId={col} key={col}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="card"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold capitalize">
                        {col.replace("_", " ")}
                      </div>
                      <span className="badge">{columns[col].length}</span>
                    </div>

                    {columns[col].map((t, index) => (
                      <Draggable draggableId={t.id} index={index} key={t.id}>
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className="glass rounded-2xl p-4 mb-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">{t.title}</div>
                                {t.description && (
                                  <div className="text-slate-300 text-sm mt-1">
                                    {t.description}
                                  </div>
                                )}
                              </div>
                              <button
                                className="badge hover:opacity-80"
                                title="Edit task"
                                onClick={() => {
                                  setEditing(t);
                                  setOpenEdit(true);
                                }}
                              >
                                ✏️
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-3 text-white">Members</h2>
        <div className="space-y-1 mb-4">
          {members?.map((m) => (
            <div
              key={m.user.id}
              className="text-sm text-gray-300 bg-gray-700/40 rounded px-2 py-1"
            >
              {m.user.name} <span className="text-gray-400">({m.role})</span>
            </div>
          ))}
          {!members?.length && (
            <div className="text-sm text-gray-400">No members yet.</div>
          )}
        </div>

        <h2 className="text-2xl font-bold">Chat</h2>
        <div className="card h-[520px] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.map((m) => (
              <div key={m.id} className="glass rounded-2xl p-3">
                <div className="text-sm text-slate-400">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
                <div className="font-semibold">{m.sender?.name ?? "User"}</div>
                <div className="text-slate-100">{m.content}</div>
              </div>
            ))}
          </div>
          {error && <div className="text-pink-300 text-sm mt-1">{error}</div>}
          <div className="mt-3 flex gap-2">
            <input
              className="input flex-1"
              placeholder="Type a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button className="btn-primary" onClick={send}>
              Send
            </button>
          </div>
        </div>
      </div>

      <TaskModal
        open={openCreate}
        title="Add Task"
        submitting={savingTask}
        onClose={() => setOpenCreate(false)}
        onSubmit={onCreateTask}
      />
      <TaskModal
        open={openEdit}
        title="Edit Task"
        submitting={savingTask}
        initial={
          editing
            ? {
                title: editing.title,
                description: editing.description || "",
                status: editing.status,
              }
            : undefined
        }
        onClose={() => {
          setOpenEdit(false);
          setEditing(null);
        }}
        onSubmit={onEditTask}
      />

      {inviteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[350px]">
            <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
            <input
              className="w-full p-2 rounded bg-gray-800 mb-3 text-white"
              placeholder="Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <button
              onClick={async () => {
                if (!inviteEmail.trim() || !projectId) return;
                await api.post(`/members/${projectId}`, {
                  email: inviteEmail.trim(),
                });
                setInviteOpen(false);
                setInviteEmail("");
              }}
              className="w-full py-2 bg-blue-500 rounded-md hover:bg-blue-600 text-white"
            >
              Send Invite
            </button>
            <button
              onClick={() => setInviteOpen(false)}
              className="w-full py-2 bg-gray-700 rounded-md mt-2 text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
