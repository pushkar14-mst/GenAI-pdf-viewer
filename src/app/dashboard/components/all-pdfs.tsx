"use client";

import { useEffect, useState } from "react";
import { PDFCard } from "@/app/dashboard/components/pdf-card";
import { useRouter } from "next/navigation";

interface PDF {
  id: string;
  title: string;
  originalName: string;
  fileSize: number;
  uploadedAt: string;
}

const AllPDFs = () => {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/upload-pdf");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch PDFs");
      }

      setPdfs(result.pdfs);
    } catch (error) {
      console.error("Fetch PDFs error:", error);
      setError("Failed to load PDFs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this PDF?")) {
      return;
    }

    try {
      const response = await fetch(`/api/upload-pdf/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete PDF");
      }

      setPdfs((prev) => prev.filter((pdf) => pdf.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete PDF. Please try again.");
    }
  };

  const handleView = (id: string) => {
    router.push(`/pdf-viewer/${id}`);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading PDFs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchPDFs}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (pdfs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No PDFs uploaded yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your first PDF to get started with AI tutoring!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your PDF Documents</h2>
        <span className="text-sm text-muted-foreground">
          {pdfs.length} document{pdfs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pdfs.map((pdf) => (
          <PDFCard
            key={pdf.id}
            id={pdf.id}
            title={pdf.title}
            originalName={pdf.originalName}
            fileSize={pdf.fileSize}
            uploadedAt={pdf.uploadedAt}
            onDelete={handleDelete}
            onView={handleView}
          />
        ))}
      </div>
    </div>
  );
};

export default AllPDFs;
