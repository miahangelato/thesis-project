"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { sessionAPI } from "@/lib/api";
import { useSession } from "@/contexts/session-context";

import { QRCodeSVG } from "qrcode.react";

import {
  Download,
  QrCode,
  AlertTriangle,
  CheckCircle,
  Home,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

export function DownloadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessionId } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState<string | null>(null);

  useEffect(() => {
    const sessionFromQuery = searchParams.get("session");
    const activeSessionId =
      sessionFromQuery || sessionId || sessionStorage.getItem("current_session_id");
    if (!activeSessionId) {
      router.push("/");
      return;
    }

    try {
      sessionStorage.setItem("current_session_id", activeSessionId);
    } catch {}

    const generatePDF = async () => {
      try {
        setLoading(true);
        const response = await sessionAPI.generatePDF(activeSessionId);

        setPdfUrl(response.data.pdf_url);
        setDownloadUrl(response.data.download_url || response.data.pdf_url);

        const pdfUrlForQr = response.data.pdf_url;

        if (pdfUrlForQr) {
          setQrValue(pdfUrlForQr);
        } else {
          setError("PDF URL not received from server");
        }
      } catch (err: unknown) {
        const msg =
          (err as any)?.response?.data?.error ||
          (err as Error)?.message ||
          "Failed to generate PDF report.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    generatePDF();
  }, [sessionId, router, searchParams]);

  const handleDirectDownload = async () => {
    const url = downloadUrl || pdfUrl;
    if (!url) return;

    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = `health_report_${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("Failed to download PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <FullScreenLoader
        title="Generating Your PDF Report"
        subtitle="Please wait a moment…"
      />
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert className="border-destructive/50 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || "PDF generation failed. Please try again."}
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/results")}
                className="flex-1"
              >
                Back to Results
              </Button>
              <Button onClick={() => router.push("/")} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl flex items-center justify-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            PDF Report Ready!
          </CardTitle>
          <CardDescription className="text-base">
            Your health analysis report has been generated
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="bg-muted rounded-lg p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <QrCode className="h-6 w-6" />
                Scan to Download
              </div>

              {(pdfUrl || downloadUrl) && qrValue ? (
                <div className="bg-white p-6 rounded-lg shadow-inner">
                  <QRCodeSVG value={qrValue} size={256} level="M" includeMargin={true} />
                </div>
              ) : (
                <div
                  className="bg-white p-6 rounded-lg shadow-inner flex items-center justify-center"
                  style={{ width: "280px", height: "280px" }}
                >
                  <p className="text-sm text-muted-foreground">Generating QR code...</p>
                </div>
              )}

              <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-sm text-center">
                <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  Scan this QR code with your smartphone to download the PDF report
                  directly to your device
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Or download directly
            </div>

            <Button onClick={handleDirectDownload} size="lg" className="w-full">
              <Download className="mr-2 h-5 w-5" />
              Download PDF Report
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> This report is for personal records only. It should
              not be used for medical diagnosis or treatment without consulting a
              healthcare professional.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/results")}
              className="flex-1"
            >
              Back to Results
            </Button>
            <Button onClick={() => router.push("/")} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
