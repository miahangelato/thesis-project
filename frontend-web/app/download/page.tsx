import { Suspense } from "react";
import { DownloadPageContent } from "./download-content";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

export const dynamic = "force-dynamic";

export default function DownloadPage() {
  return (
    <Suspense fallback={<FullScreenLoader title="Loading..." subtitle="Please wait" />}>
      <DownloadPageContent />
    </Suspense>
  );
}
