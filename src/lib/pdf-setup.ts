// PDF.js setup for client-side only
let isConfigured = false;

export function configurePDFJS() {
  if (typeof window !== "undefined" && !isConfigured) {
    // Configure PDF.js worker only on the client side
    import("react-pdf").then(({ pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      isConfigured = true;
    });
  }
}
