"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/signout-button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import UploadPDF from "./upload-pdf";
import AllPDFs from "./all-pdfs";
import { Toaster } from "sonner";

interface DashboardContentProps {
  userName: string;
}

export default function DashboardContent({ userName }: DashboardContentProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <Toaster position="top-right" richColors closeButton theme="light" />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {userName}!</h1>
          <SignOutButton />
        </div>

        <div className="grid gap-6">
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              Your AI Tutor Dashboard
            </h2>
            <p className="text-muted-foreground mb-4">
              Upload a PDF document to start learning with your AI tutor. The AI
              will help you understand the content through interactive
              conversations.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Upload PDF Document</Button>
              </DialogTrigger>
              <UploadPDF onUploadSuccess={handleUploadSuccess} />
            </Dialog>
          </div>

          <div className="bg-muted p-6 rounded-lg">
            <AllPDFs key={refreshKey} />
          </div>
        </div>
      </div>
    </>
  );
}
