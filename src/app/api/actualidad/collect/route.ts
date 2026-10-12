import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { collectActualidadSources } from "@/lib/actualidad/collectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authorization = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return secureEquals(authorization, expected);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET no está configurado." },
      { status: 503 },
    );
  }

  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const result = await collectActualidadSources();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[actualidad:collect]", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falló la recopilación.",
      },
      { status: 500 },
    );
  }
}
