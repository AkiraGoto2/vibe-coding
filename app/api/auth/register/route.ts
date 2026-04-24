import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { generateOTP, sendVerificationEmail } from "@/lib/email";
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

    // Test DB — show real error in dev
    try {
      await db.$queryRaw`SELECT 1`;
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
      logger.error({ dbErr }, "DB connection test failed");
      return NextResponse.json(
        {
          error: process.env.NODE_ENV !== "production"
            ? `DB error: ${msg}`
            : "Database unavailable. Contact support.",
        },
        { status: 503 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, emailVerified: false },
      });
      await tx.userSettings.create({ data: { userId: user.id } });
    });

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.verificationCode.updateMany({
      where: { email, used: false },
      data: { used: true },
    });
    await db.verificationCode.create({ data: { email, code, expiresAt } });

    const { success: emailSent, error: emailError } = await sendVerificationEmail(email, name, code);
    if (!emailSent) {
      logger.warn({ email, emailError }, "Verification email failed");
    }

    logger.info({ email }, "User registered");
    return NextResponse.json({ ok: true, requiresVerification: true }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ err, ip }, "Register error");
    return NextResponse.json(
      { error: process.env.NODE_ENV !== "production" ? `Server error: ${msg}` : "Server error" },
      { status: 500 }
    );
  }
}
