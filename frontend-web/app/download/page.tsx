"use client";

import { useState, useEffect} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";
import { sessionAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QRCodeSVG } from "qrcode.react";
import {
  Download,
  QrCode,
  AlertTriangle,
  CheckCircle,
  Home,
  Smartphone,
} from "lucide-react";

export default function DownloadPage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push("/");
      return;
    }

    const generatePDF = async () => {
      try {
        setLoading(true);
        const response = await sessionAPI.generatePDF(sessionId);
        setPdfUrl(response.data.pdf_url);
        setQrCodeUrl(response.data.qr_code_url);
      } catch (err: any) {
        console.error("Failed to generate PDF:", err);
        setError(err.response?.data?.error || "Failed to generate PDF report.");
      } finally {
        setLoading(false);
      }
    };

    generatePDF();
  }, [sessionId, router]);

  const handleDirectDownload = async () => {
    if (!pdfUrl) return;

    try {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `health_report_${sessionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Generating your PDF report...</p>
          </CardContent>
        </Card>
      </div>
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
              <Button
                onClick={() => router.push("/")}
                className="flex-1"
              >
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
          {/* QR Code Section */}
          <div className="bg-muted rounded-lg p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <QrCode className="h-6 w-6" />
                Scan to Download
              </div>
              
              {pdfUrl && (
                <div className="bg-white p-6 rounded-lg shadow-inner">
                  <QRCodeSVG
                    value={pdfUrl}
                    size={256}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              )}

              <div className="flex items-start gap-2 text-sm text-muted-foreground max-w-sm text-center">
                <Smartphone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Scan this QR code with your smartphone to download the PDF report directly to your device
                </p>
              </div>
            </div>
          </div>

          {/* Direct Download Section */}
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Or download directly
            </div>

            <Button
              onClick={handleDirectDownload}
              size="lg"
              className="w-full"
            >
              <Download className="mr-2 h-5 w-5" />
              Download PDF Report
            </Button>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> This report is for personal records only. It should not be used for medical diagnosis or treatment without consulting a healthcare professional.
            </AlertDescription>
          </Alert>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => router.push("/results")}
              className="flex-1"
            >
              Back to Results
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
