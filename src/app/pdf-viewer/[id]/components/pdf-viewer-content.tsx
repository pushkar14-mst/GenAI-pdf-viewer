"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Settings,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { PDFDisplay } from "./pdf-display";
import type { IHighlight, PDFDisplayRef } from "./pdf-display";
import { ChatInterface } from "./chat-interface";

interface PDFViewerContentProps {
  pdfId: string;
}

export function PDFViewerContent({ pdfId }: PDFViewerContentProps) {
  const [pdfData, setPdfData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<IHighlight[]>([]);
  const [pdfText, setPdfText] = useState<string>("");
  const pdfDisplayRef = useRef<PDFDisplayRef>(null);

  useEffect(() => {
    const fetchPDFData = async () => {
      try {
        const response = await fetch(`/api/pdf/${pdfId}`, { method: "HEAD" });
        if (!response.ok) {
          throw new Error("PDF not found");
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch PDF:", error);
        setError("Failed to load PDF");
        setIsLoading(false);
      }
    };

    const extractPDFText = async () => {
      try {
        const response = await fetch(`/api/pdf/${pdfId}/extract`);
        if (response.ok) {
          const data = await response.json();
          setPdfText(data.text);
        }
      } catch (error) {
        console.error("Failed to extract PDF text:", error);
      }
    };

    fetchPDFData();
    extractPDFText();
  }, [pdfId]);

  const handlePDFLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">
            Failed to Load PDF
          </h2>
          <p className="text-gray-600">{error}</p>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold text-gray-900">
              PDF Document Viewer
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full hidden md:flex"
        >
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col bg-white">
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm text-gray-600">Page</span>
                      <input
                        type="number"
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                        min={1}
                        max={totalPages}
                      />
                      <span className="text-sm text-gray-600">
                        of {totalPages}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>

                    <div className="px-3 py-1 text-sm bg-gray-100 rounded">
                      {zoom}%
                    </div>

                    <Button variant="outline" size="sm" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>

                    <Separator orientation="vertical" className="h-6" />

                    <Button variant="outline" size="sm" onClick={handleRotate}>
                      <RotateCw className="w-4 h-4" />
                    </Button>

                    <Button variant="outline" size="sm">
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden bg-gray-100">
                <ScrollArea className="h-full">
                  <div className="p-6 flex justify-center">
                    <PDFDisplay
                      ref={pdfDisplayRef}
                      pdfId={pdfId}
                      currentPage={currentPage}
                      zoom={zoom}
                      rotation={rotation}
                      isLoading={isLoading}
                      onLoadSuccess={handlePDFLoadSuccess}
                      aiHighlights={highlights}
                      onHighlightChange={setHighlights}
                      onPageChange={setCurrentPage}
                      onTextExtracted={(text, page) => {
                        console.log(`Page ${page} text extracted`);
                      }}
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={30}>
            <ChatInterface
              pdfId={pdfId}
              pdfDisplayRef={pdfDisplayRef}
              onHighlightRequest={(newHighlights) => {
                setHighlights((prev) => [...prev, ...newHighlights]);
              }}
              onPageNavigate={(page) => {
                setCurrentPage(page);
                pdfDisplayRef.current?.navigateToPage(page);
              }}
              onAnnotationControl={(action, data) => {
                if (action === "clear") {
                  pdfDisplayRef.current?.clearHighlights();
                }
              }}
            />
          </ResizablePanel>
        </ResizablePanelGroup>

        <div className="md:hidden h-full flex flex-col">
          <div className="flex-1 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-600">
                      {currentPage}/{totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs px-2">{zoom}%</span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-gray-100">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <PDFDisplay
                    ref={pdfDisplayRef}
                    pdfId={pdfId}
                    currentPage={currentPage}
                    zoom={zoom}
                    rotation={rotation}
                    isLoading={isLoading}
                    onLoadSuccess={handlePDFLoadSuccess}
                    aiHighlights={highlights}
                    onHighlightChange={setHighlights}
                    onPageChange={setCurrentPage}
                    onTextExtracted={(text, page) => {
                      console.log(`Page ${page} text extracted`);
                    }}
                  />
                </div>
              </ScrollArea>
            </div>

            <div className="border-t border-gray-200 p-3">
              <Button className="w-full" variant="outline">
                <MessageSquare className="w-4 h-4 mr-2" />
                Open AI Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
