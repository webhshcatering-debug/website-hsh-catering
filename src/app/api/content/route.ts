import { NextRequest, NextResponse } from "next/server";
import { getContent, saveContent } from "@/lib/content";
import { CateringContent } from "@/types/content";
import {
  adminSessionExpiredResponse,
  isAdminSessionValid,
  setAdminSessionCookie,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getContent();
    return NextResponse.json(
      { success: true, data },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Gagal memuat konten CMS:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal memuat konten CMS. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminSessionValid(req)) return adminSessionExpiredResponse();

  try {
    const body: CateringContent = await req.json();

    if (!body || !body.company || !body.portfolio) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap atau tidak valid." },
        { status: 400 }
      );
    }

    // STRICT VALIDATION: Maksimal 10 foto portofolio
    if (body.portfolio.length > 10) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kapasitas portofolio maksimal 10 foto! Hapus salah satu foto terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    const saved = await saveContent(body);

    const response = NextResponse.json({
      success: true,
      message: "Konten website berhasil disimpan!",
      data: saved,
    });
    setAdminSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Gagal menyimpan konten CMS:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan perubahan. Silakan coba lagi.",
      },
      { status: 500 }
    );
  }
}
