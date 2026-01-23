import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { ShieldCheck, Settings2, ScanLine } from "lucide-react";

type PreparingScanOverlayProps = {
  isOpen: boolean;
};

export function PreparingScanOverlay({ isOpen }: PreparingScanOverlayProps) {
  const preparationSteps = [
    {
      label: "Secure Connection",
      description: "INITIALIZING ENCRYPTED UPLINK",
      status: "completed" as const,
      icon: ShieldCheck,
    },
    {
      label: "Diagnostic Sensors",
      description: "VALIDATING BIOMETRIC HARDWARE",
      status: "current" as const,
      icon: Settings2,
    },
    {
      label: "Scanner Alignment",
      description: "CALIBRATING HIGH-RES SCANNER",
      status: "pending" as const,
      icon: ScanLine,
    },
  ];

  return (
    <FullScreenLoader
      isOpen={isOpen}
      title="Preparing Scan"
      subtitle="Setting up secure biometric environment..."
      steps={preparationSteps}
    />
  );
}
