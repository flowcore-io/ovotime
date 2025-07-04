import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/database/schema.ts",
  out: "./src/database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/ovotime"
  },
  verbose: true,
  strict: true
}) 