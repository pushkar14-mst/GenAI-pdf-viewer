"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

const Document = dynamic(
  () => import("react-pdf").then((mod) => ({ default: mod.Document })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Skeleton className="w-[600px] h-[800px]" />
      </div>
    ),
  }
);

const Page = dynamic(
  () => import("react-pdf").then((mod) => ({ default: mod.Page })),
  {
    ssr: false,
    loading: () => <Skeleton className="w-[600px] h-[800px]" />,
  }
);

import { configurePDFJS } from "@/lib/pdf-setup";

interface PDFDisplayProps {
  pdfId: string;
  currentPage: number;
  zoom: number;
  rotation: number;
  isLoading: boolean;
  onLoadSuccess?: (data: { numPages: number }) => void;
  onPageLoadSuccess?: () => void;
}

export function PDFDisplay({
  pdfId,
  currentPage,
  zoom,
  rotation,
  isLoading,
  onLoadSuccess,
  onPageLoadSuccess,
}: PDFDisplayProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(600);
  const [error, setError] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  const pdfUrl = `/api/pdf/${pdfId}`;

  useEffect(() => {
    // Configure PDF.js on mount
    configurePDFJS();
    // Reset page width based on zoom
    setPageWidth(600 * (zoom / 100));
  }, [zoom]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
    onLoadSuccess?.({ numPages });
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Failed to load PDF:", error);
    setError("Failed to load PDF document");
  };

  const onPageLoadSuccessHandler = () => {
    setLoadingPage(false);
    onPageLoadSuccess?.();
  };

  const onPageLoadError = (error: Error) => {
    console.error("Failed to load page:", error);
    setLoadingPage(false);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl bg-white shadow-lg">
        <div className="aspect-[8.5/11] p-8 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl bg-white shadow-lg">
        <div className="aspect-[8.5/11] p-8 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-900">
              Failed to Load PDF
            </h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white shadow-lg overflow-hidden">
      <div
        className="flex items-center justify-center bg-gray-100 relative min-h-[800px] p-4"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center",
        }}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center p-8">
              <div className="space-y-4">
                <Skeleton className="w-[600px] h-[800px]" />
                <p className="text-sm text-gray-500 text-center">
                  Loading PDF...
                </p>
              </div>
            </div>
          }
          error={
            <div className="flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Failed to Load PDF
                </h3>
                <p className="text-gray-600">
                  Please check if the PDF file exists and try again.
                </p>
              </div>
            </div>
          }
        >
          <div className="relative">
            {loadingPage && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <div className="space-y-2">
                  <Skeleton className="w-full h-full" />
                  <p className="text-sm text-gray-500 text-center">
                    Loading page {currentPage}...
                  </p>
                </div>
              </div>
            )}

            <Page
              pageNumber={currentPage}
              width={pageWidth}
              onLoadSuccess={onPageLoadSuccessHandler}
              onLoadError={onPageLoadError}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div className="space-y-4">
                  <Skeleton className="w-[600px] h-[800px]" />
                  <p className="text-sm text-gray-500 text-center">
                    Loading page...
                  </p>
                </div>
              }
              error={
                <div className="w-[600px] h-[800px] flex items-center justify-center bg-gray-100 border border-gray-300 rounded">
                  <div className="text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <p className="text-sm text-gray-600">
                      Failed to load page {currentPage}
                    </p>
                  </div>
                </div>
              }
              className="shadow-lg border border-gray-300"
            />

            <div className="absolute inset-0 pointer-events-none">
              {/* AI annotations will be rendered here */}
            </div>
          </div>
        </Document>
      </div>
    </Card>
  );
}
