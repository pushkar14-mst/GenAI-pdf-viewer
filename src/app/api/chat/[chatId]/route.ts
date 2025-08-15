import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as {
      user: { id: string };
    } | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;

    // Get chat with messages
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
        pdf: {
          select: {
            id: true,
            title: true,
            originalName: true,
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({
      chat: {
        id: chat.id,
        title: chat.title,
        pdfId: chat.pdfId,
        pdf: chat.pdf,
        messages: chat.messages.map((message) => ({
          id: message.id,
          role: message.role.toLowerCase(),
          content: message.content,
          timestamp: message.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get chat error:", error);
    return NextResponse.json({ error: "Failed to get chat" }, { status: 500 });
  }
}
