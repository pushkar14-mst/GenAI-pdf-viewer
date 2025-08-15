"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const PDFViewerContent = dynamic(
  () =>
    import("./pdf-viewer-content").then((mod) => ({
      default: mod.PDFViewerContent,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="space-y-4">
          <Skeleton className="w-[800px] h-[600px]" />
          <p className="text-center text-gray-500">Loading PDF Viewer...</p>
        </div>
      </div>
    ),
  }
);

interface PDFViewerWrapperProps {
  pdfId: string;
}

export function PDFViewerWrapper({ pdfId }: PDFViewerWrapperProps) {
  return <PDFViewerContent pdfId={pdfId} />;
}
