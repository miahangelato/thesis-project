"use client";

import { RefreshCcw, Shield } from "lucide-react";
import { ConfirmModal } from "@/components/modals/confirm-modal";

type Props = {
  showCancelModal: boolean;
  onCloseCancel: () => void;
  onConfirmCancel: () => void;

  showResetConfirmModal: boolean;
  onCloseReset: () => void;
  onConfirmReset: () => void;
};

export function ScanSessionModals({
  showCancelModal,
  onCloseCancel,
  onConfirmCancel,
  showResetConfirmModal,
  onCloseReset,
  onConfirmReset,
}: Props) {
  return (
    <>
      <ConfirmModal
        isOpen={showCancelModal}
        onPrimary={onCloseCancel}
        onSecondary={onConfirmCancel}
        closeOnBackdrop={false}
        closeOnEscape={false}
        title="Cancel Scanning?"
        description={
          <>
            Are you sure you want to cancel? All progress for this session will be lost
            and you will have to start over.
          </>
        }
        icon={<Shield className="w-12 h-12 text-red-600" strokeWidth={2.5} />}
        iconWrapperClassName="bg-red-50"
        iconRingClassName="border-red-100"
        primaryLabel="Continue Scanning"
        secondaryLabel="Yes, Cancel Session"
        secondaryButtonClassName="text-red-500 hover:text-red-700 hover:bg-red-50"
      />

      <ConfirmModal
        isOpen={showResetConfirmModal}
        onPrimary={onCloseReset}
        onSecondary={onConfirmReset}
        closeOnBackdrop={false}
        closeOnEscape={false}
        title="Restart Session?"
        description={
          <>
            This will clear all 10 scanned fingerprints and you will have to start over.
            This action cannot be undone.
          </>
        }
        icon={<RefreshCcw className="w-12 h-12 text-amber-600" strokeWidth={2.5} />}
        iconWrapperClassName="bg-amber-50"
        iconRingClassName="border-amber-100"
        primaryLabel="No, Keep My Progress"
        secondaryLabel="Yes, Restart Session"
        secondaryButtonClassName="text-red-500 hover:text-red-700 hover:bg-red-50"
      />
    </>
  );
}
