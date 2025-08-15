import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user: { id: string };
    } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const pdf = await prisma.pDF.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
      select: {
        data: true,
        title: true,
        originalName: true,
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Check if we already have extracted text in the database
    const existingExtraction = await prisma.pDFExtraction.findUnique({
      where: {
        pdfId: id,
      },
    });

    if (existingExtraction) {
      return NextResponse.json({
        text: existingExtraction.extractedText,
        pages: existingExtraction.pageTexts,
        totalPages: existingExtraction.totalPages,
        cached: true,
      });
    }

    // For now, return basic info without text extraction
    // PDF text extraction will be handled client-side
    return NextResponse.json({
      text: "Text extraction not available on server",
      pages: {},
      totalPages: 0,
      cached: false,
    });
  } catch (error) {
    console.error("PDF text extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from PDF" },
      { status: 500 }
    );
  }
}
