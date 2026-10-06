import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import dotenv from "dotenv"
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(__dirname, "..", "lib", "server", "schema.sql")
const schema = await fs.readFile(schemaPath, "utf8")

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!connectionString) {
  console.error("DATABASE_URL or POSTGRES_URL must be set before running the DB init script.")
  process.exit(1)
}

const pool = new pg.Pool({ connectionString })

try {
  await pool.query(schema)
  console.log("Database schema initialized successfully.")
} finally {
  await pool.end()
}
