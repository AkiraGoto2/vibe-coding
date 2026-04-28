import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit, authRatelimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  try {
    if (await checkRateLimit(authRatelimit, `login:${ip}`)) {
      return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    try {
      await db.$queryRaw`SELECT 1`;
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      logger.error({ dbErr }, "DB connection test failed in login");
      return NextResponse.json({ error: `DB error: ${msg}` }, { status: 503 });
    }

    const user = await db.user.findUnique({ where: { email } });

    const DUMMY_HASH = "$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const match = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !match) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession(user.id, user.email, user.name, user.role);
    logger.info({ email }, "User logged in");

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, ip }, "Login error");
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
