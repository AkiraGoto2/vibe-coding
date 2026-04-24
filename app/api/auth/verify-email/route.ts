import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { verifyEmailSchema } from "@/lib/validations";
import { checkRateLimit, authRatelimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  try {
    if (await checkRateLimit(authRatelimit, `verify:${ip}`)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const parsed = verifyEmailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, code } = parsed.data;

    // Find an active, unused code for this email
    const record = await db.verificationCode.findFirst({
      where: { email, code, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired code. Request a new one." },
        { status: 400 }
      );
    }

    // Mark code as used + verify user in transaction
    const user = await db.$transaction(async (tx) => {
      await tx.verificationCode.update({ where: { id: record.id }, data: { used: true } });
      return tx.user.update({
        where: { email },
        data: { emailVerified: true },
      });
    });

    // Issue session
    await createSession(user.id, user.email, user.name, user.role);

    logger.info({ email }, "Email verified, session created");
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    logger.error({ err, ip }, "Verify email error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
