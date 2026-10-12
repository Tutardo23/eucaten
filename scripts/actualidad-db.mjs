import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;

  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) process.env[key] = value;
  }
}

function getSql() {
  loadEnvLocal();
  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new Error(
      "Falta DATABASE_URL. Copiá la connection string de Neon en .env.local.",
    );
  }

  return neon(connectionString);
}

async function setup() {
  const sql = getSql();
  const migration = await readFile(
    resolve(process.cwd(), "db/actualidad/001_schema.sql"),
    "utf8",
  );

  const statements = migration
    .split("-- statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
  }

  console.log("✓ Esquema de Actualidad preparado en Neon.");
}

async function list(status) {
  const sql = getSql();
  const allowed = new Set(["pending", "published", "rejected"]);

  if (status && !allowed.has(status)) {
    throw new Error("Estado inválido. Usá pending, published o rejected.");
  }

  const rows = status
    ? await sql.query(
        `SELECT id, status, source_name, title, source_published_at
         FROM actualidad_news_items
         WHERE status = $1
         ORDER BY source_published_at DESC
         LIMIT 100`,
        [status],
      )
    : await sql.query(
        `SELECT id, status, source_name, title, source_published_at
         FROM actualidad_news_items
         ORDER BY created_at DESC
         LIMIT 100`,
        [],
      );

  if (!rows.length) {
    console.log("No hay publicaciones.");
    return;
  }

  console.table(
    rows.map((row) => ({
      id: row.id,
      estado: row.status,
      fuente: row.source_name,
      titulo: row.title,
      fecha: new Date(row.source_published_at).toLocaleDateString("es-AR"),
    })),
  );
}

async function seed() {
  const sql = getSql();
  const id = randomUUID();
  const fingerprint = `dev-test:${id}`;

  await sql`
    INSERT INTO actualidad_news_items (
      id,
      slug,
      fingerprint,
      title,
      summary,
      source_name,
      source_url,
      source_type,
      source_published_at,
      categories,
      status
    )
    VALUES (
      ${id},
      ${`prueba-local-${id.slice(0, 8)}`},
      ${fingerprint},
      ${"PRUEBA LOCAL — Actualidad EUCATEN"},
      ${"Registro de prueba para validar el circuito pendiente → publicada → descartada. No corresponde a una noticia real."},
      ${"Prueba local"},
      ${"https://example.com/eucaten-actualidad-test"},
      ${"official"},
      ${new Date().toISOString()},
      ${["Compliance y prevención de lavado de activos"]},
      ${"pending"}
    )
  `;

  console.log("✓ Publicación de prueba creada como pending.");
  console.log(`ID: ${id}`);
}

async function changeStatus(id, status) {
  if (!id) throw new Error("Falta el ID de la publicación.");

  const sql = getSql();
  const isPublishing = status === "published";

  const rows = await sql`
    UPDATE actualidad_news_items
    SET
      status = ${status},
      web_published_at = CASE
        WHEN ${isPublishing} THEN COALESCE(web_published_at, NOW())
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, status, title
  `;

  if (!rows.length) throw new Error(`No existe una publicación con ID ${id}.`);

  console.log(`✓ ${rows[0].title}`);
  console.log(`Estado: ${rows[0].status}`);
}

async function cleanTest() {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM actualidad_news_items
    WHERE fingerprint LIKE 'dev-test:%'
    RETURNING id
  `;

  console.log(`✓ Registros de prueba eliminados: ${rows.length}`);
}

async function check() {
  const sql = getSql();
  const rows = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'published')::int AS published,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
    FROM actualidad_news_items
  `;

  console.table(rows);
}

const [command, arg] = process.argv.slice(2);

try {
  switch (command) {
    case "setup":
      await setup();
      break;
    case "check":
      await check();
      break;
    case "list":
      await list(arg);
      break;
    case "seed":
      await seed();
      break;
    case "publish":
      await changeStatus(arg, "published");
      break;
    case "reject":
      await changeStatus(arg, "rejected");
      break;
    case "pending":
      await changeStatus(arg, "pending");
      break;
    case "clean-test":
      await cleanTest();
      break;
    default:
      console.log(`
Actualidad EUCATEN — utilitario local

Comandos:
  npm run actualidad:db -- setup
  npm run actualidad:db -- check
  npm run actualidad:db -- list
  npm run actualidad:db -- list pending
  npm run actualidad:db -- seed
  npm run actualidad:db -- publish <id>
  npm run actualidad:db -- reject <id>
  npm run actualidad:db -- pending <id>
  npm run actualidad:db -- clean-test
`);
  }
} catch (error) {
  console.error("✕", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
