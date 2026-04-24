import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { exerciseAdminSchema } from "@/lib/validations";
import { logger } from "@/lib/logger";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = exerciseAdminSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  try {
    const exercise = await db.exercise.update({ where: { id }, data: parsed.data });
    logger.info({ exerciseId: id }, "Exercise updated");
    return NextResponse.json({ exercise });
  } catch {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await db.exercise.delete({ where: { id } });
    logger.info({ exerciseId: id }, "Exercise deleted");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }
}
