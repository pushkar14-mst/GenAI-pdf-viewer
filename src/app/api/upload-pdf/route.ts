import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    const pdf = await prisma.pDF.create({
      data: {
        title: title || file.name.replace(".pdf", ""),
        filename: fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        data: buffer,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      pdf: {
        id: pdf.id,
        title: pdf.title,
        originalName: pdf.originalName,
        fileSize: pdf.fileSize,
        uploadedAt: pdf.uploadedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const pdfs = await prisma.pDF.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        originalName: true,
        fileSize: true,
        uploadedAt: true,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      pdfs: pdfs.map((pdf) => ({
        id: pdf.id,
        title: pdf.title,
        originalName: pdf.originalName,
        fileSize: pdf.fileSize,
        uploadedAt: pdf.uploadedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Fetch PDFs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDFs" },
      { status: 500 }
    );
  }
}
