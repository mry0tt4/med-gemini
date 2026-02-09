import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/forgot-password(.*)",
    "/api/inngest(.*)",
    "/sso-callback(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
    const { userId } = await auth();
    const url = request.nextUrl;

    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (userId && (url.pathname.startsWith("/sign-in") || url.pathname.startsWith("/sign-up"))) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If user is signed in and accessing root, redirect to dashboard
    if (userId && url.pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect non-public routes
    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
