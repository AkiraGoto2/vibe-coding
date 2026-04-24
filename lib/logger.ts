// Simple structured logger — compatible with Next.js App Router and Edge Runtime
// Uses console in development, JSON in production

type Level = "info" | "warn" | "error" | "debug";

function log(level: Level, data: Record<string, unknown> | string, msg?: string) {
  if (process.env.NODE_ENV === "production") {
    // JSON output for log aggregators (Vercel, Datadog, etc.)
    console[level === "debug" ? "log" : level](
      JSON.stringify({ level, time: Date.now(), msg: msg ?? data, ...(typeof data === "object" ? data : {}) })
    );
  } else {
    // Human-readable in development
    const prefix = `[${level.toUpperCase()}]`;
    if (typeof data === "string") {
      console[level === "debug" ? "log" : level](prefix, data);
    } else {
      console[level === "debug" ? "log" : level](prefix, msg ?? "", data);
    }
  }
}

export const logger = {
  info:  (data: Record<string, unknown> | string, msg?: string) => log("info",  data, msg),
  warn:  (data: Record<string, unknown> | string, msg?: string) => log("warn",  data, msg),
  error: (data: Record<string, unknown> | string, msg?: string) => log("error", data, msg),
  debug: (data: Record<string, unknown> | string, msg?: string) => log("debug", data, msg),
};
