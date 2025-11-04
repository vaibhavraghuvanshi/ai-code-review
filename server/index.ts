import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { runMigrations } from "./migrate";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";  // 👈 import storage (Drizzle DB wrapper)

const app = express();
// Allow larger payloads for AI code review (default is ~100kb)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Request/response logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

// Example API routes using Drizzle storage
app.get("/api/users/:id", async (req, res, next) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

app.post("/api/users", async (req, res, next) => {
  try {
    const user = await storage.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

(async () => {
  // Optional: run migrations at startup when explicitly enabled
  if (process.env.RUN_MIGRATIONS_ON_START === "true") {
    try {
      const res = await runMigrations();
      if (!res.skipped) {
        log(`migrations applied: ${res.applied.length}`);
      }
    } catch (err) {
      log(`migration error: ${(err as any)?.message || err}`);
      // In dev it's helpful to fail fast
      if (app.get("env") === "development") {
        process.exit(1);
      }
    }
  }

  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    log(`Error: ${message}`);
  });

  // Setup Vite in dev or serve static in prod
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "localhost", () => {
    log(`serving on http://localhost:${port}`);
  });
})();
