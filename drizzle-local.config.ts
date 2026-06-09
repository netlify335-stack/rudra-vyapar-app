import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/localSchema.ts",
  out: "./public/drizzle",
  dialect: "postgresql",
});
