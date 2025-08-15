import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { model } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, pdfId, chatId } = await req.json();

    if (!message || !pdfId) {
      return NextResponse.json(
        { error: "Message and PDF ID are required" },
        { status: 400 }
      );
    }

    const pdf = await prisma.pDF.findFirst({
      where: {
        id: pdfId,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        originalName: true,
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Get or create chat
    let chat;
    if (chatId) {
      chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          userId: session.user.id,
          pdfId: pdfId,
        },
      });
    }

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          userId: session.user.id,
          pdfId: pdfId,
          title: `Chat about ${pdf.title || pdf.originalName}`,
        },
      });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "USER",
        content: message,
      },
    });

    // Create system prompt for PDF analysis
    const systemPrompt = `You are an AI tutor helping a student understand a PDF document titled "${
      pdf.title || pdf.originalName
    }". 

Your role is to:
1. Answer questions about the document content
2. Provide explanations and clarifications
3. Help students learn and understand concepts
4. Reference specific pages when relevant
5. Suggest related topics or questions

Be helpful, educational, and encouraging. If you need to reference specific parts of the document, mention page numbers when possible.

The student has asked: "${message}"

Please provide a helpful and educational response.`;

    // Generate AI response using Gemini
    const result = await model.generateContent(systemPrompt);
    const aiResponse = result.response.text();

    // Save AI message
    const aiMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "ASSISTANT",
        content: aiResponse,
      },
    });

    return NextResponse.json({
      success: true,
      chatId: chat.id,
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        timestamp: userMessage.createdAt,
      },
      aiMessage: {
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        timestamp: aiMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
