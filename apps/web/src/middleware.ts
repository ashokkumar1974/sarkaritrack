import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarkaritrack.in",
  "https://www.sarkaritrack.in",
  "https://admin.sarkaritrack.in",
  "http://localhost:3000",
  "http://localhost:3001",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin") ?? "";
  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      const isAllowed = ALLOWED_ORIGINS.includes(origin) || !origin;
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin":  isAllowed ? origin : ALLOWED_ORIGINS[0],
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key, X-Revalidate-Secret",
          "Access-Control-Max-Age":       "86400",
        },
      });
    }
    const res = NextResponse.next();
    const isAllowed = ALLOWED_ORIGINS.includes(origin) || !origin;
    if (isAllowed) res.headers.set("Access-Control-Allow-Origin", origin || "*");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
