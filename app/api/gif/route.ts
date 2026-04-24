import { NextRequest, NextResponse } from "next/server";

/**
 * GIF proxy — fetches ExerciseDB animated GIFs server-side
 * and streams them to the browser, bypassing CORS restrictions.
 *
 * Usage: /api/gif?url=https://v2.exercisedb.io/image/...
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Allowlist: only proxy from known exercise image domains
  const allowed = [
    "v2.exercisedb.io",
    "exercisedb.io",
    "media.giphy.com",
    "media0.giphy.com",
    "media1.giphy.com",
    "media2.giphy.com",
    "media3.giphy.com",
    "media4.giphy.com",
  ];
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!allowed.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        // Some CDNs need a referrer
        "Referer": "https://exercisedb.io/",
        "User-Agent": "Mozilla/5.0 (compatible; BreakReminder/1.0)",
      },
      // Cache the upstream response for 24h
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/gif";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("[gif proxy]", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }
}
