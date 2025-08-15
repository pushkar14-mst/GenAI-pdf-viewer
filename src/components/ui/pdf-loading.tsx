import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

interface PDFLoadingProps {
  message?: string;
}

export function PDFLoading({ message = "Loading PDF..." }: PDFLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <Skeleton className="w-[600px] h-[800px]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
          <FileText className="w-12 h-12 text-gray-400 animate-pulse" />
          <p className="text-sm text-gray-500 font-medium">{message}</p>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
