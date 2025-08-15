"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface PDFCardProps {
  id: string;
  title: string;
  originalName: string;
  fileSize: number;
  uploadedAt: string;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export function PDFCard({
  id,
  title,
  originalName,
  fileSize,
  uploadedAt,
  onDelete,
  onView,
}: PDFCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="py-2 overflow-hidden transition-all duration-200  border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
            <FileText className="w-6 h-6 text-red-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3
                  className="font-semibold text-sm text-foreground truncate"
                  title={title}
                >
                  {title}
                </h3>
                <p
                  className="text-xs text-muted-foreground truncate mt-1"
                  title={originalName}
                >
                  {originalName}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{formatFileSize(fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(uploadedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-start justify-start gap-1 mt-3">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(id)}
              className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
            >
              <Eye className="w-3 h-3 mr-1" />
              View & Edit
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-7 px-2 text-xs hover:bg-red-50 hover:text-red-700 ml-auto cursor-pointer"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {isDeleting ? "..." : "Delete"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
