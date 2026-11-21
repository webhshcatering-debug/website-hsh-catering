import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionExpiredResponse,
  clearAdminSessionCookie,
  isAdminSessionValid,
  setAdminSessionCookie,
} from "@/lib/admin-session";

const DEFAULT_ADMIN_USER = process.env.ADMIN_USER || "HSH_Catering";
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || "hshcatering123";

export async function GET(request: NextRequest) {
  if (!isAdminSessionValid(request)) return adminSessionExpiredResponse();

  const response = NextResponse.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  setAdminSessionCookie(response);
  return response;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (
      typeof username === "string" &&
      typeof password === "string" &&
      username.trim() === DEFAULT_ADMIN_USER &&
      password.trim() === DEFAULT_ADMIN_PASS
    ) {
      const response = NextResponse.json({
        success: true,
        message: "Login admin berhasil!",
      });
      setAdminSessionCookie(response);
      return response;
    }

    return NextResponse.json(
      {
        success: false,
        message: "Username atau Password salah! Silakan periksa kembali.",
      },
      { status: 401 },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal memproses autentikasi admin." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearAdminSessionCookie(response);
  return response;
}
