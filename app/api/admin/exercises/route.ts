import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { exerciseAdminSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

// GET — list all exercises (paginated)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const active = searchParams.get("active");

  const where = active !== null ? { isActive: active === "true" } : {};

  const [items, total] = await Promise.all([
    db.exercise.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.exercise.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pages: Math.ceil(total / limit) });
}

// POST — create new exercise
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = exerciseAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const exercise = await db.exercise.create({ data: parsed.data });
  logger.info({ exerciseId: exercise.id }, "Exercise created");
  return NextResponse.json({ exercise }, { status: 201 });
}
