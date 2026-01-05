import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Info, QrCode, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function ResultsDownloadTab({
  pdfUrl,
  pdfLoading,
  pdfError,
  onGeneratePDF,
  onDirectDownload,
  onReset,
}: {
  pdfUrl: string | null;
  pdfLoading: boolean;
  pdfError: string | null;
  onGeneratePDF: () => void;
  onDirectDownload: () => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Download Your Results
      </h2>

      {!pdfUrl ? (
        <div className="flex flex-col items-center justify-center py-8">
          <FileText className="w-16 h-16 text-teal-600 mb-4" />
          <p className="text-gray-700 mb-4 font-medium">
            Generate your PDF report
          </p>
          <Button
            onClick={onGeneratePDF}
            disabled={pdfLoading}
            className="bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 px-8 rounded-xl cursor-pointer"
          >
            {pdfLoading ? (
              <>
                <span className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full inline-block" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2 inline" />
                Generate PDF Report
              </>
            )}
          </Button>
          {pdfError && <p className="text-red-600 text-sm mt-3">{pdfError}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {/* QR Code Section */}
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                <QrCode className="h-6 w-6" />
                Scan to Download
              </div>

              <div className="bg-white p-4 rounded-lg shadow-inner">
                <QRCodeSVG
                  value={pdfUrl}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-600 max-w-sm text-center">
                <Smartphone className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  Scan this QR code with your smartphone to download the PDF
                  report directly
                </p>
              </div>
            </div>
          </div>

          {/* Direct Download Section */}
          <div className="space-y-3">
            <div className="text-center text-sm text-gray-600">
              Or download directly
            </div>

            <Button
              onClick={onDirectDownload}
              className="w-full bg-linear-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl cursor-pointer"
            >
              <Download className="w-5 h-5 mr-2 inline" />
              Download PDF Report
            </Button>
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="w-full text-teal-600 hover:text-teal-700 font-medium text-sm py-2"
          >
            Generate Another Report
          </button>
        </div>
      )}

      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800 flex items-start">
          <Info className="w-5 h-5 mr-2 mt-0.5 shrink-0" />
          <span>
            <strong>Important:</strong> This report is for informational
            purposes only and should not replace professional medical advice.
            Please consult with a healthcare provider for proper diagnosis and
            treatment.
          </span>
        </p>
      </div>
    </div>
  );
}
