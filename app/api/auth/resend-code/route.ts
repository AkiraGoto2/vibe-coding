import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOTP, sendVerificationEmail } from "@/lib/email";
import { resendCodeSchema } from "@/lib/validations";
import { checkRateLimit, emailRatelimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  try {
    if (await checkRateLimit(emailRatelimit, `resend:${ip}`)) {
      return NextResponse.json({ error: "Too many email requests. Wait 10 minutes." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const parsed = resendCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email } = parsed.data;
    const user = await db.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true });
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.verificationCode.updateMany({ where: { email, used: false }, data: { used: true } });
    await db.verificationCode.create({ data: { email, code, expiresAt } });
    await sendVerificationEmail(email, user.name, code);

    logger.info({ email }, "Verification code resent");
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err, ip }, "Resend code error");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
