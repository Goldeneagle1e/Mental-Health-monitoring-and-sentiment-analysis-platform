import { Pool, type QueryResultRow } from "pg"
import dotenv from "dotenv"
dotenv.config()

declare global {
  // eslint-disable-next-line no-var
  var __mhPool: Pool | undefined
}

function getConnectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || ""
}

export function getDb() {
  if (!global.__mhPool) {
    const connectionString = getConnectionString()
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured.")
    }

    global.__mhPool = new Pool({
      connectionString,
    })
  }

  return global.__mhPool
}

export async function dbQuery<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getDb().query<T>(text, values)
}
