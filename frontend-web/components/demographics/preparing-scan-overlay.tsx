import { FullScreenLoader } from "@/components/ui/full-screen-loader";

type PreparingScanOverlayProps = {
  isOpen: boolean;
};

export function PreparingScanOverlay({ isOpen }: PreparingScanOverlayProps) {
  return (
    <FullScreenLoader
      isOpen={isOpen}
      title="Preparing Fingerprint Scan"
      subtitle="Please wait a moment…"
    />
  );
}
