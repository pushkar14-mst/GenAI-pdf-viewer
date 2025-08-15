"use client";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UploadPDFProps {
  onUploadSuccess?: () => void;
}

const UploadPDF = ({ onUploadSuccess }: UploadPDFProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    const fileInput = document.getElementById("pdf-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name.replace(".pdf", ""));

      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }
      toast.success("PDF uploaded successfully!");
      setFile(null);
      const fileInput = document.getElementById(
        "pdf-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
      onUploadSuccess?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload PDF. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <>
      <DialogContent className="min-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload PDF Document</DialogTitle>
          <DialogDescription>
            Upload a PDF document to start learning with your AI tutor. The AI
            will help you understand the content through interactive
            conversations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 min-h-0">
          <Label htmlFor="pdf-upload">Upload PDF</Label>
          <Input
            id="pdf-upload"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="cursor-pointer"
            disabled={isUploading}
          />

          {file && (
            <Card className="relative overflow-hidden border-dashed border-2 border-blue-200 bg-blue-50/50">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p
                      className="font-medium text-sm text-foreground truncate leading-tight"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800 text-xs px-2 py-0.5"
                    >
                      Ready
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </>
  );
};

export default UploadPDF;
