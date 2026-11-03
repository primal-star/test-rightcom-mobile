export function isPublicPage(pathname: string) {
  return pathname === "/"
    || pathname === "/feed"
    || pathname === "/login"
    || pathname === "/signup"
    || (pathname !== "/posts/new" && /^\/posts\/[^/]+$/.test(pathname));
}
