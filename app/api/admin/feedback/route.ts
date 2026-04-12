import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit  = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const status = searchParams.get("status"); // "new" | "read" | "resolved" | null = all
  const search = searchParams.get("q")?.trim() ?? "";

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name:    { contains: search } },
            { email:   { contains: search } },
            { subject: { contains: search } },
            { message: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    db.feedback.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
