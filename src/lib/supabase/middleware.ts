import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/plans",
  "/_next",
  "/icon",
  "/opengraph-image",
  "/favicon",
  // API endpoints that handle their own auth (Bearer tokens, etc.)
  "/api/cron",
];

const AUTH_ONLY_PREFIXES = ["/login", "/signup"];

function isPublic(path: string): boolean {
  if (path === "/") return true;
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function isAuthOnly(path: string): boolean {
  return AUTH_ONLY_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthOnly(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/establishments";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return response;
}
