const express = require("express");
const cors = require("cors");
const path = require("path");
const familiesRouter = require("./routes/families");
const tasksRouter = require("./routes/tasks");
const announcementsRouter = require("./routes/announcements");
const eventsRouter = require("./routes/events");
const invitationsRouter = require("./routes/invitations");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/families", familiesRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/invitations", invitationsRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`FammyHQ API server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
