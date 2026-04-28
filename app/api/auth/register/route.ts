import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit, authRatelimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  try {
    if (await checkRateLimit(authRatelimit, `register:${ip}`)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    try {
      await db.$queryRaw`SELECT 1`;
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      logger.error({ dbErr }, "DB connection test failed");
      return NextResponse.json({ error: `DB error: ${msg}` }, { status: 503 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Auto-verify: no email confirmation needed
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash, emailVerified: true },
      });
      await tx.userSettings.create({ data: { userId: newUser.id } });
      return newUser;
    });

    // Auto-login after registration
    await createSession(user.id, user.email, user.name, user.role);

    logger.info({ email }, "User registered and logged in");

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, ip }, "Register error");
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
