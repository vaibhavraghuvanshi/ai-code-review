// Mock drizzle config for UI-only mode
export default {
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "mock://localhost/db",
  },
};
