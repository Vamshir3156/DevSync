import { useEffect, useRef, useState } from "react";

type Props = { children: React.ReactNode };

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
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
  const [waking, setWaking] = useState(true);
  const [status, setStatus] = useState("Connecting to server…");
  const [attempt, setAttempt] = useState(1);

  const [remainingMs, setRemainingMs] = useState(45000);

  const lockRef = useRef(false);

  useEffect(() => {
    if (!waking) return;
    const t = setInterval(() => {
      setRemainingMs((prev) => {
        let next = Math.max(0, prev - 1000);

        if (prev > 5000 && next <= 5000 && !lockRef.current) {
          lockRef.current = true;
          next += 30000;
          setAttempt((a) => a + 1);
        }

        if (next > 5000 && lockRef.current) {
          lockRef.current = false;
        }

        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [waking]);

  useEffect(() => {
    let cancelled = false;

    const wake = async () => {
      let tries = 0;
      while (!cancelled) {
        tries++;

        try {
          const res = await fetchWithTimeout(HEALTH_URL, 7000);
          if (res?.ok) {
            await new Promise((r) => setTimeout(r, 400));
            if (!cancelled) setWaking(false);
            return;
          }
        } catch {}

        setStatus("Server waking up… Please wait 🙂");

        const delay = Math.min(4000, 500 * Math.pow(2, Math.min(tries, 4)));
        await new Promise((r) => setTimeout(r, delay));
      }
    };

    wake();
    return () => {
      cancelled = true;
    };
  }, []);

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
