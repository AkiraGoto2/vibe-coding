import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await db.user.findUnique({ where: { email } });

    const dummyHash = "$2b$12$invalidhashfortimingprotection00000000000000000000000";
    const hash = user?.passwordHash ?? dummyHash;
    const match = await bcrypt.compare(password, hash);

    if (!user || !match) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession(user.id, user.email, user.name, user.role);

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
