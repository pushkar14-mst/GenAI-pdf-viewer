import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { model } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

// Enhanced AI prompt with PDF control capabilities
const createEnhancedSystemPrompt = (
  pdfTitle: string,
  pdfText: string,
  message: string
) => `
You are an AI tutor helping a student understand a PDF document titled "${pdfTitle}".

AVAILABLE PDF CONTENT:
${pdfText}

Your capabilities include:
1. Answer questions about the document content
2. Reference specific pages when relevant  
3. Control PDF annotations and highlighting
4. Navigate to specific pages
5. Provide explanations and clarifications

ANNOTATION COMMANDS:
When you want to highlight or annotate the PDF, use these special commands in your response:

**HIGHLIGHT TEXT**: To highlight specific text on a page:
\`\`\`annotation
{
  "action": "highlight",  
  "text": "exact phrase from document",
  "page": page_number,
  "comment": "explanation or note",
  "color": "yellow"
}
\`\`\`



**HIGHLIGHT AREA**: To highlight a rectangular area:
\`\`\`annotation
{
  "action": "area",
  "page": page_number,
  "coordinates": {"x": 100, "y": 200, "width": 300, "height": 50},
  "comment": "explanation",
  "color": "yellow"
}
\`\`\`

**NAVIGATE TO PAGE**: To direct user to a specific page:
\`\`\`annotation
{
  "action": "navigate",
  "page": page_number
}
\`\`\`

**CLEAR ANNOTATIONS**: To remove all highlights:
\`\`\`annotation
{
  "action": "clear"
}
\`\`\`

RESPONSE FORMAT:
Respond using clean, well-formatted Markdown. Include annotation commands when appropriate.

STUDENT QUESTION: "${message}"

Provide a helpful, educational response with relevant page references and annotations.
`;

const cleanupMarkdownResponse = (response: string): string => {
  response = response.replace(/```markdown\s*/g, "").replace(/```\s*$/g, "");
  response = response.trim();
  response = response.replace(/^(#{1,6})\s*(.+)$/gm, "$1 $2");
  response = response.replace(/\n(-|\*|\+|\d+\.)\s/g, "\n\n$1 ");
  response = response.replace(/\n{3,}/g, "\n\n");
  response = response.replace(/^>\s*/gm, "> ");
  return response;
};

const extractAnnotationCommands = (response: string) => {
  const annotationRegex = /```annotation\s*([\s\S]*?)\s*```/g;
  const annotations: Record<string, unknown>[] = [];
  let match;

  while ((match = annotationRegex.exec(response)) !== null) {
    try {
      const annotationData = JSON.parse(match[1]);
      annotations.push(annotationData);
    } catch (error) {
      console.error("Failed to parse annotation command:", error);
    }
  }

  // Remove annotation commands from the response
  const cleanResponse = response.replace(annotationRegex, "").trim();

  return { cleanResponse, annotations };
};

export async function POST(req: NextRequest) {
  try {
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

    // Verify PDF ownership and get PDF details
    const pdf = await prisma.pDF.findFirst({
      where: {
        id: pdfId,
        userId: session.user.id,
      },
      include: {
        extraction: true,
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    // Get or extract PDF text for AI context
    let pdfText = "";
    if (pdf.extraction) {
      pdfText = pdf.extraction.extractedText;
    } else {
      // If text hasn't been extracted yet, extract it now
      const extractResponse = await fetch(
        `${req.nextUrl.origin}/api/pdf/${pdfId}/extract`
      );
      if (extractResponse.ok) {
        const extractData = await extractResponse.json();
        pdfText = extractData.text;
      }
    }

    // Handle chat session
    let chat;
    if (chatId) {
      chat = await prisma.chat.findUnique({
        where: {
          id: chatId,
          userId: session.user.id,
          pdfId: pdfId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 10, // Last 10 messages for context
          },
        },
      });

      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }
    } else {
      chat = await prisma.chat.create({
        data: {
          userId: session.user.id,
          pdfId: pdfId,
          title: `Enhanced Chat: ${pdf.title || pdf.originalName}`,
        },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
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

    // Create enhanced system prompt with PDF content
    const systemPrompt = createEnhancedSystemPrompt(
      pdf.title || pdf.originalName,
      pdfText.substring(0, 15000), // Limit context size
      message
    );

    // Get AI response
    const result = await model.generateContent(systemPrompt);
    let aiResponse = result.response.text();

    // Clean up and extract annotation commands
    aiResponse = cleanupMarkdownResponse(aiResponse);
    const { cleanResponse, annotations } =
      extractAnnotationCommands(aiResponse);

    // Save AI message
    const aiMessage = await prisma.message.create({
      data: {
        chatId: chat.id,
        role: "ASSISTANT",
        content: cleanResponse,
        annotations:
          annotations.length > 0 ? JSON.stringify(annotations) : null,
      },
    });

    // Process annotation commands
    const createdAnnotations = [];
    for (const annotation of annotations) {
      try {
        if (annotation.action === "highlight" || annotation.action === "area") {
          const createdAnnotation = await prisma.annotation.create({
            data: {
              pdfId: pdfId,
              chatId: chat.id,
              messageId: aiMessage.id,
              type: annotation.action === "highlight" ? "HIGHLIGHT" : "AREA",
              pageNumber: annotation.page,
              coordinates: annotation.coordinates || {
                text: annotation.text,
                color: annotation.color || "yellow",
              },
              content: annotation.comment || annotation.text,
              style: { color: annotation.color || "yellow" },
              createdBy: "AI",
            },
          });
          createdAnnotations.push(createdAnnotation);
        }
      } catch (error) {
        console.error("Failed to create annotation:", error);
      }
    }

    return NextResponse.json({
      chatId: chat.id,
      userMessage: userMessage,
      aiMessage: {
        ...aiMessage,
        annotations: annotations,
      },
      createdAnnotations,
      pdfControls: annotations.filter((a) =>
        ["navigate", "clear"].includes(a.action)
      ),
    });
  } catch (error) {
    console.error("Enhanced chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process enhanced chat message" },
      { status: 500 }
    );
  }
}
