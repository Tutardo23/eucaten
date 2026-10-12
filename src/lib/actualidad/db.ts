import { neon } from "@neondatabase/serverless";

type ActualidadSql = ReturnType<typeof neon>;

let cachedSql: ActualidadSql | null = null;
let cachedConnectionString: string | null = null;

export function isActualidadDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getActualidadSql(): ActualidadSql {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está configurada. Copiá la connection string de Neon en .env.local.",
    );
  }

  if (!cachedSql || cachedConnectionString !== connectionString) {
    cachedSql = neon(connectionString);
    cachedConnectionString = connectionString;
  }

  return cachedSql;
}
