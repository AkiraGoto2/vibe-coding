import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  let dbOk = false;
  let dbMs = 0;

  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
    dbMs = Date.now() - start;
  } catch {
    dbMs = Date.now() - start;
  }

  const status = dbOk ? 200 : 503;

  return NextResponse.json(
    {
      status: dbOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "unknown",
      checks: {
        database: { ok: dbOk, latencyMs: dbMs },
      },
    },
    { status }
  );
}
