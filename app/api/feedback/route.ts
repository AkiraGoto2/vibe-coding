import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { feedbackSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const session = await getSession();
    const { name, email, subject, message } = parsed.data;

    // Sanitize: strip any HTML tags from user input
    const sanitize = (s: string) => s.replace(/<[^>]*>/g, "").trim();

    const feedback = await db.feedback.create({
      data: {
        name: sanitize(name),
        email: sanitize(email),
        subject: sanitize(subject),
        message: sanitize(message),
        userId: session?.userId ?? null,
      },
    });

    // Try to send email via SMTP (optional — only if configured)
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.default.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Break Reminder" <${process.env.SMTP_USER}>`,
          to: process.env.FEEDBACK_TO ?? process.env.SMTP_USER,
          replyTo: email,
          subject: `[Feedback] ${subject}`,
          text: `From: ${name} <${email}>\n\n${message}`,
          html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><hr><p>${message.replace(/\n/g, "<br>")}</p>`,
        });
      } catch (emailErr) {
        // Email failure is non-critical — feedback is already saved to DB
        console.warn("[feedback] Email send failed:", emailErr);
      }
    }

    return NextResponse.json({ ok: true, id: feedback.id }, { status: 201 });
  } catch (err) {
    console.error("[feedback]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
