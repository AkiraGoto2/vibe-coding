import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // Test DB connection first
    await db.$queryRaw`SELECT 1`.catch(() => {
      throw new Error("DATABASE_NOT_INITIALIZED");
    });

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Аккаунт с таким email уже существует / An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash },
      });
      await tx.userSettings.create({ data: { userId: newUser.id } });
      return newUser;
    });

    await createSession(user.id, user.email, user.name, user.role);

    return NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg === "DATABASE_NOT_INITIALIZED") {
      return NextResponse.json(
        { error: "База данных не инициализирована. Запустите: pnpm db:setup" },
        { status: 503 }
      );
    }

    // In development return the real error so it's debuggable
    const detail = process.env.NODE_ENV !== "production" ? ` (${msg})` : "";
    console.error("[register]", err);
    return NextResponse.json({ error: `Server error${detail}` }, { status: 500 });
  }
}
