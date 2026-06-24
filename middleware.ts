export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/requests/:path*",
    "/openings/:path*",
    "/candidates/:path*",
    "/applicants/:path*",
    "/dashboard/:path*",
    "/interviews/:path*",
    "/settings/:path*",
    "/ld/:path*",
    "/assistant/:path*",
  ],
};