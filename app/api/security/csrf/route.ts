import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomToken } from "@/lib/security/crypto";

export async function GET() {
  const store = await cookies();
  let token = store.get("vw_csrf")?.value;
  if (!token) {
    token = randomToken(24);
    store.set("vw_csrf", token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }
  return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
}
