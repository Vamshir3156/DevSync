import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import { Server as IOServer, Socket } from "socket.io";
import memberRouter from "./routes/members.js";
import { FRONTEND_ORIGIN } from "./config.js";
import { PORT } from "./config.js";
import authRouter from "./routes/auth.js";
import projectRouter from "./routes/projects.js";
import taskRouter from "./routes/tasks.js";
import messageRouter from "./routes/messages.js";
import { requireAuth } from "./middlewares/auth.js";

const app = express();

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", (req: Request, res: Response) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/projects", requireAuth, projectRouter);
app.use("/api/tasks", requireAuth, taskRouter);
app.use("/api/messages", requireAuth, messageRouter);
app.use("/api/members", memberRouter);

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: { origin: FRONTEND_ORIGIN, credentials: true },
});

io.on("connection", (socket: Socket) => {
  socket.on("joinProject", (projectId: string) => {
    socket.join(`project:${projectId}`);
  });

  socket.on(
    "project:message",
    (payload: { projectId: string; message: any }) => {
      socket
        .to(`project:${payload.projectId}`)
        .emit("project:message", payload.message);
    }
  );
});

server.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
