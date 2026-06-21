export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/requests/:path*",
    "/openings/:path*",
    "/candidates/:path*",
    "/dashboard/:path*",
    "/interviews/:path*",
    "/settings/:path*",
    "/talent-pool/:path*",
    "/assistant/:path*",
  ],
};
