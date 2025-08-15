"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { configurePDFJS } from "@/lib/pdf-setup";

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

export interface IHighlight {
  id: string;
  pageNumber: number;
  text?: string;
  color?: string;
  comment?: string;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PDFDisplayRef {
  navigateToPage: (page: number) => void;
  addHighlight: (
    text: string,
    pageNumber: number,
    color?: string,
    comment?: string
  ) => void;
  clearHighlights: () => void;
}

interface PDFDisplayProps {
  pdfId: string;
  currentPage: number;
  zoom: number;
  rotation: number;
  isLoading: boolean;
  onLoadSuccess?: ({ numPages }: { numPages: number }) => void;
  aiHighlights?: IHighlight[];
  onHighlightChange?: (highlights: IHighlight[]) => void;
  onTextExtracted?: (text: string, pageNumber: number) => void;
  onPageChange?: (page: number) => void;
}

export const PDFDisplay = forwardRef<PDFDisplayRef, PDFDisplayProps>(
  (
    {
      pdfId,
      currentPage,
      zoom,
      rotation,
      isLoading,
      onLoadSuccess,
      aiHighlights = [],
      onHighlightChange,
      onPageChange,
    },
    ref
  ) => {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageWidth, setPageWidth] = useState(600);
    const [error, setError] = useState<string | null>(null);
    const [loadingPage, setLoadingPage] = useState(true);
    const [highlights, setHighlights] = useState<IHighlight[]>(aiHighlights);
    const [pageTextContent, setPageTextContent] = useState<
      Map<number, Record<string, unknown>>
    >(new Map());

    const pdfUrl = `/api/pdf/${pdfId}`;
    const pageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      configurePDFJS();
      setPageWidth(600 * (zoom / 100));
    }, [zoom]);

    useEffect(() => {
      setHighlights(aiHighlights);
    }, [aiHighlights]);

    useImperativeHandle(
      ref,
      () => ({
        navigateToPage: (page: number) => {
          if (page >= 1 && page <= (numPages || 1)) {
            onPageChange?.(page);
          }
        },
        addHighlight: (
          text: string,
          pageNumber: number,
          color = "#fdfbd4",
          comment = ""
        ) => {
          setTimeout(() => {
            const pageContainer = document.querySelector(
              `[data-page-number="${pageNumber}"]`
            );
            const textLayer = pageContainer?.querySelector(
              ".react-pdf__Page__textContent"
            );

            if (textLayer) {
              const textElements = Array.from(
                textLayer.querySelectorAll("span")
              );
              const matchingElements: HTMLElement[] = [];
              const searchText = text.toLowerCase().trim();

              console.log(`Searching for "${text}" on page ${pageNumber}`);
              console.log(`Found ${textElements.length} text elements`);

              textElements.forEach((span) => {
                if (
                  span.textContent &&
                  span.textContent.toLowerCase().includes(searchText)
                ) {
                  matchingElements.push(span);
                  console.log(`Found exact match: "${span.textContent}"`);
                }
              });

              if (matchingElements.length === 0 && searchText.length > 3) {
                textElements.forEach((span) => {
                  if (span.textContent) {
                    const spanText = span.textContent.toLowerCase();
                    if (
                      spanText.includes(
                        searchText.substring(0, Math.min(searchText.length, 8))
                      )
                    ) {
                      matchingElements.push(span);
                      console.log(`Found partial match: "${span.textContent}"`);
                    }
                  }
                });
              }

              if (matchingElements.length === 0 && searchText.includes(" ")) {
                const words = searchText.split(" ").filter((w) => w.length > 2);
                words.forEach((word) => {
                  textElements.forEach((span) => {
                    if (
                      span.textContent &&
                      span.textContent.toLowerCase().includes(word)
                    ) {
                      if (!matchingElements.includes(span)) {
                        matchingElements.push(span);
                        console.log(
                          `Found word match "${word}": "${span.textContent}"`
                        );
                      }
                    }
                  });
                });
              }

              matchingElements.forEach((element, index) => {
                const rect = element.getBoundingClientRect();
                const pageElement =
                  pageContainer?.querySelector(".react-pdf__Page");
                const pageRect = pageElement?.getBoundingClientRect();

                if (pageRect) {
                  const relativeX = rect.left - pageRect.left;
                  const relativeY = rect.top - pageRect.top;

                  const highlightId = `ai-${Date.now()}-${index}`;
                  const newHighlight: IHighlight = {
                    id: highlightId,
                    pageNumber,
                    text: element.textContent || text,
                    color,
                    comment,
                    coordinates: {
                      x: relativeX,
                      y: relativeY,
                      width: Math.max(rect.width, 20),
                      height: Math.max(rect.height, 16),
                    },
                  };

                  console.log(
                    `Creating highlight at (${relativeX}, ${relativeY}) size ${rect.width}x${rect.height}`
                  );

                  setHighlights((prev) => {
                    const updated = [...prev, newHighlight];
                    onHighlightChange?.(updated);
                    return updated;
                  });
                }
              });

              if (matchingElements.length === 0) {
                console.warn(
                  `No text found for "${text}" on page ${pageNumber}`
                );
                const availableTexts = textElements
                  .map((el) => el.textContent)
                  .filter(Boolean);
                console.log("Available texts:", availableTexts.slice(0, 0));
              } else {
                console.log(
                  `Successfully highlighted ${matchingElements.length} elements`
                );
              }
            } else {
              console.warn(`Text layer not found for page ${pageNumber}`);
            }
          }, 1000);
        },
        clearHighlights: () => {
          setHighlights([]);
          onHighlightChange?.([]);
        },
      }),
      [
        numPages,
        onPageChange,
        pageTextContent,
        pageWidth,
        highlights,
        onHighlightChange,
      ]
    );

    const onDocumentLoadSuccess = useCallback(
      ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setError(null);
        onLoadSuccess?.({ numPages });
      },
      [onLoadSuccess]
    );

    const onDocumentLoadError = useCallback((error: Error) => {
      console.error("Error loading PDF document:", error);
      setError("Failed to load PDF document.");
    }, []);

    const onPageLoadSuccessHandler = useCallback(
      async (page: unknown) => {
        setLoadingPage(false);

        try {
          const textContent = await (
            page as { getTextContent: () => Promise<unknown> }
          ).getTextContent();
          setPageTextContent(
            (prev) =>
              new Map(
                prev.set(currentPage, textContent as Record<string, unknown>)
              )
          );
        } catch (error) {
          console.error("Failed to extract text content:", error);
        }
      },
      [currentPage]
    );

    const onPageLoadError = useCallback(
      (error: Error) => {
        console.error("Error loading PDF page:", error);
        setError(`Failed to load page ${currentPage}.`);
        setLoadingPage(false);
      },
      [currentPage]
    );

    if (isLoading) {
      return (
        <Card className="w-full max-w-4xl bg-white shadow-lg">
          <div className="aspect-[8.5/11] p-8">
            <Skeleton className="w-full h-full" />
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="w-full max-w-4xl bg-white shadow-lg overflow-hidden flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">
              PDF Display Error
            </h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500">
              Please ensure the PDF file is valid and accessible.
            </p>
          </div>
        </Card>
      );
    }

    return (
      <Card className="w-full max-w-4xl bg-white shadow-lg overflow-hidden">
        <div
          className="aspect-[8.5/11] bg-white flex items-center justify-center relative"
          style={{
            transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
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

              <div data-page-number={currentPage}>
                <Page
                  pageNumber={currentPage}
                  width={pageWidth}
                  onLoadSuccess={onPageLoadSuccessHandler}
                  onLoadError={onPageLoadError}
                  renderTextLayer={true}
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
              </div>

              <div className="absolute inset-0 pointer-events-none">
                {highlights
                  ?.filter((h) => h.pageNumber === currentPage)
                  ?.map((highlight) => (
                    <div
                      key={highlight.id}
                      className="pdf-highlight-overlay"
                      style={{
                        left: highlight.coordinates?.x || 0,
                        top: highlight.coordinates?.y || 0,
                        width: highlight.coordinates?.width || 100,
                        height: highlight.coordinates?.height || 20,
                        backgroundColor: "rgba(253, 251, 212, 0.25)",
                        borderColor: "rgba(253, 251, 212, 0.6)",
                        borderWidth: "1px",
                        zIndex: 10,
                        pointerEvents: "none",
                      }}
                      title={highlight.comment || highlight.text}
                    />
                  ))}
              </div>
            </div>
          </Document>
        </div>
      </Card>
    );
  }
);

PDFDisplay.displayName = "PDFDisplay";
