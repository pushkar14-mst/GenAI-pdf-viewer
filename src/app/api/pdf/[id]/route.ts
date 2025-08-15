import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function handlePDFRequest(
  req: NextRequest,
  { params }: { params: { id: string } },
  method: "GET" | "HEAD"
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pdfId = await params;

    const pdf = await prisma.pDF.findFirst({
      where: {
        id: pdfId.id,
        userId: session.user.id,
      },
      select: {
        data: method === "GET",
        originalName: true,
        mimeType: true,
        fileSize: true,
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const headers = {
      "Content-Type": pdf.mimeType,
      "Content-Length": pdf.fileSize.toString(),
      "Content-Disposition": `inline; filename="${pdf.originalName}"`,
      "Cache-Control": "private, max-age=3600",
    };

    if (method === "HEAD") {
      return new NextResponse(null, {
        status: 200,
        headers,
      });
    }

    return new NextResponse(Buffer.from(pdf.data as Buffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("PDF request error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF request" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handlePDFRequest(req, { params }, "GET");
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handlePDFRequest(req, { params }, "HEAD");
}
