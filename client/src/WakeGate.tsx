import { useEffect, useRef, useState } from "react";

type Props = { children: React.ReactNode };

const API_BASE = (
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");
const HEALTH_URL = `${API_BASE}/health`;

async function fetchWithTimeout(url: string, ms = 7000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      credentials: "include",
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export default function WakeGate({ children }: Props) {
  const alreadyReady =
    typeof window !== "undefined" &&
    sessionStorage.getItem("serverReady") === "1";

  const [waking, setWaking] = useState(!alreadyReady);
  const [status, setStatus] = useState("Connecting to server…");
  const [attempt, setAttempt] = useState(1);
  const [remainingMs, setRemainingMs] = useState(45000);

  const under5LockRef = useRef(false);
  useEffect(() => {
    const onOffline = () => {
      sessionStorage.removeItem("serverReady");
      under5LockRef.current = false;
      setAttempt(1);
      setRemainingMs(45000);
      setStatus("Reconnecting to server…");
      setWaking(true);
    };

    window.addEventListener("server-offline", onOffline);
    return () => window.removeEventListener("server-offline", onOffline);
  }, []);

  useEffect(() => {
    if (!waking) return;
    const tick = setInterval(() => {
      setRemainingMs((prev) => {
        let next = Math.max(0, prev - 1000);

        if (prev > 5000 && next <= 5000 && !under5LockRef.current) {
          under5LockRef.current = true;
          next += 30000;
          setAttempt((a) => a + 1);
        }

        if (next > 5000 && under5LockRef.current) {
          under5LockRef.current = false;
        }

        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [waking]);

  useEffect(() => {
    if (!waking) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetchWithTimeout(HEALTH_URL, 7000);
        if (res?.ok) {
          if (!cancelled) {
            sessionStorage.setItem("serverReady", "1");
            setWaking(false);
          }
          return;
        }
      } catch {}
      setStatus("Server waking up… Please wait 🙂");
    };

    poll();
    const iv = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [waking]);

  if (waking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="rounded-2xl bg-white/95 p-5 shadow-xl w-[92%] max-w-sm text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <svg
              className="h-5 w-5 animate-spin text-gray-700"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="4"
                fill="none"
              />
              <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
            <p className="font-medium text-gray-800">{status}</p>
          </div>

          <p className="text-sm text-gray-700 mb-1">
            ⏱️ Estimated time left:{" "}
            <span className="font-semibold text-gray-900">
              {Math.ceil(remainingMs / 1000)}s
            </span>
          </p>

          <p className="text-sm text-gray-700 mb-1">
            🔁 Attempt: <span className="font-semibold">{attempt}</span>
          </p>

          <p className="text-xs text-gray-500">
            This app uses a free backend that may sleep when idle.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
