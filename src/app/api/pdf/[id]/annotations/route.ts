import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnnotationType, AnnotationSource } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify PDF ownership
    const pdf = await prisma.pDF.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Get all annotations for this PDF
    const annotations = await prisma.annotation.findMany({
      where: {
        pdfId: params.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ annotations });
  } catch (error) {
    console.error("Get annotations error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve annotations" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      type,
      pageNumber,
      coordinates,
      content,
      style,
      createdBy,
      chatId,
      messageId,
    } = await req.json();

    // Verify PDF ownership
    const pdf = await prisma.pDF.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Create the annotation
    const annotation = await prisma.annotation.create({
      data: {
        pdfId: params.id,
        type: type as AnnotationType,
        pageNumber,
        coordinates,
        content,
        style,
        createdBy: createdBy as AnnotationSource,
        chatId: chatId || null,
        messageId: messageId || null,
      },
    });

    return NextResponse.json({ annotation });
  } catch (error) {
    console.error("Create annotation error:", error);
    return NextResponse.json(
      { error: "Failed to create annotation" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const annotationId = searchParams.get("annotationId");

    if (!annotationId) {
      return NextResponse.json(
        { error: "Annotation ID required" },
        { status: 400 }
      );
    }

    // Verify PDF ownership and annotation exists
    const annotation = await prisma.annotation.findFirst({
      where: {
        id: annotationId,
        pdfId: params.id,
      },
      include: {
        chat: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!annotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    // Check if user owns the PDF (through chat ownership)
    if (annotation.chat && annotation.chat.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the annotation
    await prisma.annotation.delete({
      where: {
        id: annotationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete annotation error:", error);
    return NextResponse.json(
      { error: "Failed to delete annotation" },
      { status: 500 }
    );
  }
}
