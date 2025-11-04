import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import useSWR from "swr";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

import TaskModal, { TaskForm } from "../components/TaskModal";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaUserPlus,
  FaCrown,
  FaUserShield,
  FaUsers,
  FaPaperPlane,
  FaComments,
  FaListUl,
  FaCheckCircle,
} from "react-icons/fa";

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
  role: "ADMIN" | "MEMBER" | "VIEWER";
  user: { id: string; email: string; name: string };
};

type MembersResp = {
  owner: { id: string; name: string; email: string };
  members: Member[];
};

const API_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const ROLES: Array<Member["role"]> = ["ADMIN", "MEMBER", "VIEWER"];

const Pill = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold " +
      className
    }
  >
    {children}
  </span>
);

export default function Project() {
  const { id: projectId } = useParams();
  const { user } = useAuthStore();
  const nav = useNavigate();

  const { data: membersResp, mutate: refetchMembers } = useSWR<MembersResp>(
    projectId ? `/members/${projectId}` : null,
    fetcher
  );

  const ownerId = membersResp?.owner?.id;
  const rawMembers = membersResp?.members || [];

  const myRole: "OWNER" | Member["role"] | null =
    user?.id && ownerId && user.id === ownerId
      ? "OWNER"
      : rawMembers.find((m) => m.user.id === user?.id)?.role || null;

  const isOwner = myRole === "OWNER";
  const isAdmin = myRole === "ADMIN";
  const isOwnerOrAdmin = isOwner || isAdmin;

  const canInvite = isOwnerOrAdmin;
  const canManageRoles = isOwnerOrAdmin;
  const canRemoveMember = isOwnerOrAdmin;
  const canAddTask = isOwnerOrAdmin;
  const canEditTask =
    myRole === "OWNER" || myRole === "ADMIN" || myRole === "MEMBER";
  const canDeleteTask = isOwnerOrAdmin;
  const canDeleteProject = isOwner;

  const members = rawMembers.filter((m) => m.user.id !== ownerId);

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
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const deleteTask = async (taskId: string) => {
    if (!projectId) return;
    if (!confirm("Delete this task?")) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
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

  const changeRole = async (targetUserId: string, role: Member["role"]) => {
    if (!projectId) return;
    await api.put(`/members/${projectId}/${targetUserId}`, { role });
    await refetchMembers();
  };

  const removeMember = async (targetUserId: string) => {
    if (!projectId) return;
    await api.delete(`/members/${projectId}/${targetUserId}`);
    await refetchMembers();
  };

  const deleteProject = async () => {
    if (!projectId) return;
    if (!confirm("Delete this project permanently?")) return;
    await api.delete(`/projects/${projectId}`);
    nav("/");
  };

  const columnTitle = (key: keyof typeof columns) => {
    switch (key) {
      case "todo":
        return (
          <div className="flex items-center gap-2">
            <FaListUl className="opacity-90" />
            <span>To Do</span>
          </div>
        );
      case "in_progress":
        return (
          <div className="flex items-center gap-2">
            <FaComments className="opacity-90" />
            <span>In Progress</span>
          </div>
        );
      case "done":
        return (
          <div className="flex items-center gap-2">
            <FaCheckCircle className="opacity-90" />
            <span>Done</span>
          </div>
        );
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Board</h2>
            <Pill className="bg-sky-500/15 text-sky-300 border border-sky-500/30">
              {tasks.length} tasks
            </Pill>
          </div>
          <div className="flex items-center">
            {canAddTask && (
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setOpenCreate(true)}
                title="Add a new task"
              >
                <FaPlus />
                Add Task
              </button>
            )}

            {canInvite && (
              <button
                onClick={() => setInviteOpen(true)}
                className="ml-2 px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm flex items-center gap-2"
                title="Invite a member"
              >
                <FaUserPlus />
                Invite
              </button>
            )}

            {canDeleteProject && (
              <button
                onClick={deleteProject}
                className="ml-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm flex items-center gap-2"
                title="Delete this project (owner only)"
              >
                <FaTrash />
                Delete
              </button>
            )}
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
                      <div className="font-semibold capitalize flex items-center gap-2">
                        {columnTitle(col)}
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

                              <div className="flex items-center">
                                {canEditTask && (
                                  <button
                                    className="badge hover:opacity-80 flex items-center gap-1"
                                    title="Edit task"
                                    onClick={() => {
                                      setEditing(t);
                                      setOpenEdit(true);
                                    }}
                                  >
                                    <FaEdit />
                                  </button>
                                )}

                                {canDeleteTask && (
                                  <button
                                    className="badge hover:opacity-80 ml-2 bg-red-500/20 text-red-300 flex items-center gap-1"
                                    title="Delete task"
                                    onClick={() => deleteTask(t.id)}
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
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
        <h2 className="text-xl font-semibold mb-3 text-white flex items-center gap-2">
          <FaUsers /> Members
        </h2>

        {membersResp?.owner && (
          <div className="text-sm bg-gray-700/50 rounded px-2 py-1 mb-2 text-gray-200 inline-flex items-center gap-2">
            <FaCrown className="text-yellow-300" />
            {membersResp.owner.name}
            <span className="text-gray-400">(OWNER)</span>
          </div>
        )}

        <div className="space-y-2 mb-4">
          {members.map((m) => (
            <div
              key={m.user.id}
              className="flex items-center justify-between gap-2 text-sm bg-gray-700/40 rounded px-2 py-1"
            >
              <div className="text-gray-200 flex items-center gap-2">
                {m.role === "ADMIN" && (
                  <FaUserShield className="text-indigo-300" />
                )}
                {m.user.name} <span className="text-gray-400">({m.role})</span>
              </div>

              {canManageRoles ? (
                <div className="flex items-center gap-2">
                  <select
                    className="bg-gray-800 text-gray-100 rounded px-2 py-1"
                    value={m.role}
                    onChange={(e) =>
                      changeRole(m.user.id, e.target.value as Member["role"])
                    }
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>

                  {canRemoveMember && (
                    <button
                      onClick={() => removeMember(m.user.id)}
                      className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                      title="Remove member"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ))}
          {!members.length && (
            <div className="text-sm text-gray-400">No members yet.</div>
          )}
        </div>

        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FaComments /> Chat
        </h2>
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
            <div ref={bottomRef} />
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
            <button
              className="btn-primary flex items-center gap-2"
              onClick={send}
            >
              <FaPaperPlane />
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
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaUserPlus /> Invite Member
            </h2>
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
                refetchMembers();
              }}
              className="w-full py-2 bg-blue-500 rounded-md hover:bg-blue-600 text-white flex items-center justify-center gap-2"
            >
              <FaUserPlus /> Send Invite
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
