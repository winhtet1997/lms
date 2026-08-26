import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const DASHBOARDS = {
  student: "/student/home",
  parent: "/parents/home",
  tutor: "/dashboard/home", // tutors share the dashboard interface
  super_admin: "/dashboard/home",
};

const LOGIN_URLS = {
  student: "/login/student",
  parent: "/login/parents",
  tutor: "/login/tutor",
  super_admin: "/dashboard",
};

// Path prefix → allowed roles. Order matters: more specific first.
const PROTECTED_PREFIXES = [
  ["/dashboard/", ["super_admin", "tutor"]],
  ["/student/", ["student"]],
  ["/parents/", ["parent"]],
  ["/tutor/", ["tutor"]],
  ["/pricing", ["student", "tutor", "super_admin"]],
];

// Route-level guards for roles that share /super-admin/.
// Middleware cannot read Zustand/DB, so this only covers role-level defaults.
// Per-user custom permissions are enforced by the backend API + usePermission hook.
// Add a new role key (e.g. 'guest') here when you introduce one.
const ROUTE_GUARDS = {
  tutor: [
    { path: "/dashboard/user-management/add" },
    { path: "/dashboard/upload-course", query: { new: "true" } },
  ],
  // guest: [{ path: '/dashboard/user-management' }, ...],
};

function isForbiddenForRole(role, path, searchParams) {
  const guards = ROUTE_GUARDS[role];
  if (!guards) return false;
  return guards.some(({ path: guardPath, query }) => {
    if (path !== guardPath && !path.startsWith(guardPath + "/")) return false;
    if (!query) return true;
    return Object.entries(query).every(([k, v]) => searchParams.get(k) === v);
  });
}

// Exact paths that are login pages (redirect away if already logged in)
const LOGIN_PATHS = [
  "/login/student",
  "/login/parents",
  "/login/tutor",
  "/dashboard",
];

export default function middleware(request) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix to get the plain path (e.g. /en/student/home → /student/home)
  let locale = null;
  let pathWithoutLocale = pathname;
  for (const l of routing.locales) {
    if (pathname.startsWith(`/${l}/`) || pathname === `/${l}`) {
      locale = l;
      pathWithoutLocale = pathname.slice(`/${l}`.length) || "/";
      break;
    }
  }

  // No locale found — let next-intl handle the redirect to add one
  if (!locale) {
    const savedLocale = request.cookies.get("NEXT_LOCALE")?.value;
    if (!savedLocale) {
      const url = request.nextUrl.clone();
      url.pathname = `/my${pathname}`;
      const response = NextResponse.redirect(url);
      response.cookies.set("NEXT_LOCALE", "my", { path: "/" });
      return response;
    }
    return intlMiddleware(request);
  }

  const role = request.cookies.get("auth_role")?.value;

  const redirectTo = (targetPath, params = {}) => {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${targetPath}`;
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return NextResponse.redirect(url);
  };

  // 1. Protected route: check role, redirect if missing or wrong
  for (const [prefix, allowedRoles] of PROTECTED_PREFIXES) {
    if (pathWithoutLocale.startsWith(prefix)) {
      if (!role) {
        return redirectTo(LOGIN_URLS[allowedRoles[0]]);
      }
      if (!allowedRoles.includes(role)) {
        return redirectTo(DASHBOARDS[role]);
      }
      // Block routes the role doesn't have permission to access
      if (
        isForbiddenForRole(
          role,
          pathWithoutLocale,
          request.nextUrl.searchParams,
        )
      ) {
        return redirectTo(DASHBOARDS[role], { role });
      }
      // Stamp ?role on every dashboard URL so permission checks can read it
      if (
        prefix === "/dashboard/" &&
        request.nextUrl.searchParams.get("role") !== role
      ) {
        return redirectTo(pathWithoutLocale, { role });
      }
      return intlMiddleware(request);
    }
  }

  // 2. Login page: if already logged in, send to their dashboard
  if (role && LOGIN_PATHS.includes(pathWithoutLocale)) {
    const dashboard = DASHBOARDS[role];
    // dashboard interface carries ?role so the UI knows who is browsing
    if (role === "super_admin" || role === "tutor") {
      return redirectTo(dashboard, { role });
    }
    return redirectTo(dashboard);
  }

  // 3. Root path: redirect students and parents to their dashboard (tutors/admins can visit the landing page)
  if (pathWithoutLocale === "/" && (role === "student" || role === "parent")) {
    return redirectTo(DASHBOARDS[role]);
  }

  return intlMiddleware(request);
}

// For AI subject on the course page
export const config = {
  matcher: ["/((?!api|internal|_next|.*\\..*).*)"],
};
