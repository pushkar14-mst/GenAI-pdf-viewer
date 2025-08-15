import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PDFViewerWrapper } from "./components/pdf-viewer-wrapper";

interface PDFViewerPageProps {
  params: {
    id: string;
  };
}

export default async function PDFViewerPage({ params }: PDFViewerPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const { id } = await params;
  return <PDFViewerWrapper pdfId={id} />;
}
