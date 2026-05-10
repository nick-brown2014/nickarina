import { NextResponse } from "next/server";

const SITE_PASSWORD = "karinanick";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password === SITE_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("site_access", "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 90, // 90 days
    });
    return response;
  }

  return NextResponse.json({ error: "Wrong password" }, { status: 401 });
}
