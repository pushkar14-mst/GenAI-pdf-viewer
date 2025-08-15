import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = (await getServerSession(authOptions)) as {
      user: { id: string };
    } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: pdfId } = await params;

    // Verify PDF ownership
    const pdf = await prisma.pDF.findFirst({
      where: {
        id: pdfId,
        userId: session.user.id,
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Get all chats for this PDF
    const chats = await prisma.chat.findMany({
      where: {
        pdfId: pdfId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get only the latest message for preview
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      chats: chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        updatedAt: chat.updatedAt,
        lastMessage: chat.messages[0]
          ? {
              content: chat.messages[0].content,
              role: chat.messages[0].role.toLowerCase(),
              timestamp: chat.messages[0].createdAt,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Get PDF chats error:", error);
    return NextResponse.json({ error: "Failed to get chats" }, { status: 500 });
  }
}
