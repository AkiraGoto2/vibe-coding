import { logger } from "./logger";

/** Generate a 6-digit numeric OTP */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Send a verification email using Resend */
export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === "re_your_resend_key_here") {
    // Dev mode: log the code instead of sending
    logger.warn({ email, code }, "RESEND_API_KEY not set — OTP logged to console");
    console.info(`\n📧 DEV EMAIL → ${email}\n   OTP Code: ${code}\n`);
    return { success: true };
  }

  const fromDomain = process.env.EMAIL_FROM ?? "noreply@yourdomain.com";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Break Reminder <${fromDomain}>`,
        to: [email],
        subject: "Your verification code",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
            <h2 style="margin:0 0 8px;font-size:22px;color:#111">Verify your email</h2>
            <p style="margin:0 0 32px;color:#555;font-size:15px">
              Hi ${name}, enter this code to complete your registration:
            </p>
            <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:700;font-family:monospace;color:#111">
              ${code}
            </div>
            <p style="margin:24px 0 0;color:#999;font-size:13px">
              Expires in 15 minutes. If you didn't request this, ignore this email.
            </p>
          </div>
        `,
      }),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error({ email, status: res.status, body }, "Resend API error");
      return { success: false, error: "Email delivery failed" };
    }

    logger.info({ email }, "Verification email sent");
    return { success: true };
  } catch (err) {
    logger.error({ err, email }, "sendVerificationEmail threw");
    return { success: false, error: "Email delivery failed" };
  }
}
