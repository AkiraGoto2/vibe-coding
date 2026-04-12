import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { settingsSchema } from "@/lib/validations";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.userSettings.findUnique({
    where: { userId: session.userId },
  });
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = settingsSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const settings = await db.userSettings.upsert({
    where: { userId: session.userId },
    update: { ...parsed.data, updatedAt: new Date() },
    create: { userId: session.userId, ...parsed.data },
  });

  return NextResponse.json({ settings });
}
