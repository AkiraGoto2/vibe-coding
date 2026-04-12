import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalUsers, totalFeedback, newFeedback, resolvedFeedback] = await Promise.all([
    db.user.count(),
    db.feedback.count(),
    db.feedback.count({ where: { status: "new" } }),
    db.feedback.count({ where: { status: "resolved" } }),
  ]);

  return NextResponse.json({ totalUsers, totalFeedback, newFeedback, resolvedFeedback });
}
