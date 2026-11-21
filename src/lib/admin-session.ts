import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "hsh_cms_session";
export const ADMIN_SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

const DEFAULT_ADMIN_PASSWORD = "hshcatering123";

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    DEFAULT_ADMIN_PASSWORD
  );
}

function signSession(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: ADMIN_SESSION_IDLE_TIMEOUT_MS / 1000,
  };
}

export function isAdminSessionValid(request: NextRequest) {
  const value = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!value) return false;

  const [issuedAtValue, nonce, signature, ...extra] = value.split(".");
  if (
    extra.length > 0 ||
    !/^\d+$/.test(issuedAtValue) ||
    !/^[a-f0-9]{48}$/.test(nonce) ||
    !/^[a-f0-9]{64}$/.test(signature)
  ) {
    return false;
  }

  const issuedAt = Number(issuedAtValue);
  const now = Date.now();
  if (
    !Number.isSafeInteger(issuedAt) ||
    issuedAt > now + 30_000 ||
    now - issuedAt >= ADMIN_SESSION_IDLE_TIMEOUT_MS
  ) {
    return false;
  }

  const expectedSignature = signSession(`${issuedAtValue}.${nonce}`);
  const supplied = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function setAdminSessionCookie(response: NextResponse) {
  const issuedAt = Date.now().toString();
  const nonce = randomBytes(24).toString("hex");
  const payload = `${issuedAt}.${nonce}`;

  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    `${payload}.${signSession(payload)}`,
    getCookieOptions(),
  );
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
}

export function adminSessionExpiredResponse() {
  const response = NextResponse.json(
    { success: false, message: "Sesi admin berakhir. Silakan login kembali." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
  clearAdminSessionCookie(response);
  return response;
}
