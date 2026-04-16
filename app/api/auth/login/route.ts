import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Test DB connection first
    await db.$queryRaw`SELECT 1`.catch(() => {
      throw new Error("DATABASE_NOT_INITIALIZED");
    });

    const user = await db.user.findUnique({ where: { email } });

    // Constant-time check prevents email enumeration timing attacks
    const dummyHash = "$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const hash = user?.passwordHash ?? dummyHash;
    const match = await bcrypt.compare(password, hash);

    if (!user || !match) {
      return NextResponse.json(
        { error: "Неверный email или пароль / Invalid email or password" },
        { status: 401 }
      );
    }

    await createSession(user.id, user.email, user.name, user.role);

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg === "DATABASE_NOT_INITIALIZED") {
      return NextResponse.json(
        { error: "База данных не инициализирована. Запустите: pnpm db:setup" },
        { status: 503 }
      );
    }

    const detail = process.env.NODE_ENV !== "production" ? ` (${msg})` : "";
    console.error("[login]", err);
    return NextResponse.json({ error: `Server error${detail}` }, { status: 500 });
  }
}
