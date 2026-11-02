import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";

const COOKIE = "tau_locale";

function preferredLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

/** Все публичные адреса начинаются с языка: /ru/news. Без него — редирект на выбранный язык. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (isLocale(first)) {
    const response = NextResponse.next();
    if (request.cookies.get(COOKIE)?.value !== first) {
      response.cookies.set(COOKIE, first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return response;
  }
  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|admin|files|_next|favicon.ico|icon.svg|robots.txt|sitemap.xml).*)"],
};

