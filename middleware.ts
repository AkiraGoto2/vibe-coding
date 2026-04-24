import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";

  // Only apply CORS to /api routes
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // In dev, allow all origins
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  // In production, restrict to allowed origins
  const isAllowed =
    ALLOWED_ORIGINS.length === 0 || // No restriction configured → allow all
    ALLOWED_ORIGINS.some((o) => origin === o || origin.endsWith(`.${o.replace(/^https?:\/\//, "")}`));

  if (!isAllowed && origin && req.method !== "GET") {
    return new NextResponse("CORS: origin not allowed", { status: 403 });
  }

  const res = NextResponse.next();

  if (isAllowed || process.env.NODE_ENV !== "production") {
    res.headers.set("Access-Control-Allow-Origin", origin || "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
