"use client";
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner";
import { QrCode, Smartphone, Info } from "lucide-react";

export function ResultsDownloadTab({
  qrCodeUrl,
  downloadUrl,
}: {
  qrCodeUrl?: string;
  downloadUrl?: string;
}) {
  if (!qrCodeUrl || !downloadUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner
          size="lg"
          className="mb-4"
          label="Generating your report"
          trackClassName="border-teal-100"
          indicatorClassName="border-teal-600 border-t-transparent"
        />
        <p className="text-gray-600">Generating your report...</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex flex-col flex-1 min-h-0 h-full">
        <div className="flex items-start justify-between gap-4 mb-4 p-6 pb-0">
          <h2 className="text-2xl font-bold text-teal-900 flex items-center">
            <QrCode className="w-8 h-8 mr-3 text-teal-600" />
            Scan to Download
          </h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="grid grid-cols-2 gap-8 items-center max-w-4xl w-full">
            <div className="flex flex-col items-center">
              <div className="bg-white p-6 rounded-4xl shadow-2xl shadow-teal-100/50 border border-gray-100">
                <Image
                  src={qrCodeUrl}
                  alt="Download QR Code"
                  width={256}
                  height={256}
                  className="rounded-xl"
                  unoptimized
                />
              </div>
              <p className="mt-6 text-gray-500 font-medium flex items-center">
                <Info className="w-4 h-4 mr-2" />
                QR code is unique to your session
              </p>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-start gap-5">
                  <div className="bg-teal-100 p-4 rounded-2xl shrink-0">
                    <Smartphone className="h-8 w-8 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      Open your phone camera
                    </h4>
                    <p className="text-xl text-gray-600 leading-relaxed">
                      Point it at this QR code and your PDF report will download
                      automatically to your device.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="bg-emerald-100 p-4 rounded-2xl shrink-0">
                    <span className="text-3xl">✅</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">
                      Ready for Safekeeping
                    </h4>
                    <p className="text-xl text-gray-600 leading-relaxed">
                      Your report is generated and ready to be saved for your future
                      reference.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <p className="text-base text-gray-600 flex items-start">
                  <Info className="w-6 h-6 mr-3 mt-0.5 shrink-0 text-gray-400" />
                  <span>
                    <strong>Important:</strong> This report is for informational purposes
                    only and should not replace professional medical advice.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
