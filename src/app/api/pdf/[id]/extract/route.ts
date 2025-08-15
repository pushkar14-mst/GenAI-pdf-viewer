import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDocument } from "pdfjs-dist";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pdf = await prisma.pDF.findUnique({
      where: {
        id: params.id,
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
        pdfId: params.id,
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

    // Extract text from PDF using PDF.js
    const pdfDocument = await getDocument({
      data: pdf.data,
    }).promise;

    const totalPages = pdfDocument.numPages;
    const pageTexts: { [pageNumber: number]: string } = {};
    let fullText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .filter((item: any) => item.str)
        .map((item: any) => item.str)
        .join(" ");

      pageTexts[pageNum] = pageText;
      fullText += `\n[Page ${pageNum}]\n${pageText}\n`;
    }

    // Save the extracted text to database for future use
    const extraction = await prisma.pDFExtraction.create({
      data: {
        pdfId: params.id,
        extractedText: fullText,
        pageTexts: JSON.stringify(pageTexts),
        totalPages: totalPages,
      },
    });

    return NextResponse.json({
      text: fullText,
      pages: pageTexts,
      totalPages: totalPages,
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
