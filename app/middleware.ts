// // middleware.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(req: NextRequest) {
//     const token = req.cookies.get("token")?.value;

//     // ถ้าไม่มี token ให้ไป login
//     if (!token && req.nextUrl.pathname.startsWith("/dashboard")) {
//         return NextResponse.redirect(new URL("/login", req.url));
//     }

//     return NextResponse.next();
// }

// // Apply middleware เฉพาะ dashboard
// export const config = {
//     matcher: ["/dashboard/:path*"],
// };
