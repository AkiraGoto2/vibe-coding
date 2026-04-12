import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret-change-in-production"
);

const COOKIE_NAME = "break_reminder_session";
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: string;        // "USER" | "ADMIN"
  sessionId: string;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function createSession(
  userId: string,
  email: string,
  name: string,
  role: string
) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000);

  const session = await db.session.create({
    data: { userId, token: crypto.randomUUID(), expiresAt },
  });

  const token = await createToken({ userId, email, name, role, sessionId: session.id });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const session = await db.session.findUnique({
      where: { id: payload.sessionId },
    });
    if (!session || session.expiresAt < new Date()) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload?.sessionId) {
        await db.session.delete({ where: { id: payload.sessionId } }).catch(() => {});
      }
    }
    cookieStore.delete(COOKIE_NAME);
  } catch {}
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, settings: true, createdAt: true },
  });
}

// Helper: require ADMIN role, throw 403 otherwise
export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}
