import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { FingerName } from "@/types/fingerprint";

interface ScannerStatus {
  scan_id: string | null;
  finger_name: string | null;
  status:
    | "idle"
    | "waiting"
    | "detecting"
    | "capturing"
    | "success"
    | "error"
    | "cancelled";
  hint: string;
  metrics: {
    coverage?: number;
    centroid_dx?: number;
    centroid_dy?: number;
    contrast?: number;
    sharpness?: number;
  };
}

interface PreviewFrame {
  scan_id: string;
  finger_name: string;
  frame_b64: string;
}

interface ScanComplete {
  scan_id: string;
  finger_name: string;
  image_b64_full: string;
  metrics: any;
}

const SCANNER_URL = process.env.NEXT_PUBLIC_SCANNER_BASE_URL || "http://localhost:5000";

export function useScannerSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>({
    scan_id: null,
    finger_name: null,
    status: "idle",
    hint: "",
    metrics: {},
  });
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);
  const [scanComplete, setScanComplete] = useState<ScanComplete | null>(null);
  const reconnectAttemptedRef = useRef(false);

  useEffect(() => {
    const newSocket = io(SCANNER_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      reconnectAttemptedRef.current = false;
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("scanner_status", (data: ScannerStatus) => {
      setScannerStatus(data);
    });

    newSocket.on("preview_frame", (data: PreviewFrame) => {
      setPreviewFrame(data.frame_b64);
    });

    newSocket.on("scan_complete", (data: ScanComplete) => {
      setScanComplete(data);
    });

    newSocket.on("scan_started", () => undefined);

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (
      isConnected &&
      !reconnectAttemptedRef.current &&
      scannerStatus.status !== "idle"
    ) {
      reconnectAttemptedRef.current = true;

      fetch(`${SCANNER_URL}/api/scanner/progress`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setScannerStatus({
              scan_id: data.scan_id,
              finger_name: data.finger_name,
              status: data.status || "idle",
              hint: data.hint || "",
              metrics: data.metrics || {},
            });
            if (data.last_preview_frame_b64) {
              setPreviewFrame(data.last_preview_frame_b64);
            }
          }
        });
    }
  }, [isConnected, scannerStatus.status]);

  const startScan = useCallback(
    (fingerName: FingerName) => {
      if (!socket || !isConnected) {
        return;
      }

      setScanComplete(null);
      setPreviewFrame(null);

      socket.emit("start_scan", { finger_name: fingerName });
    },
    [socket, isConnected]
  );

  const stopScan = useCallback(
    (scanId: string) => {
      if (!socket || !isConnected) {
        return;
      }

      socket.emit("stop_scan", { scan_id: scanId });
    },
    [socket, isConnected]
  );

  return {
    isConnected,
    scannerStatus,
    previewFrame,
    scanComplete,
    startScan,
    stopScan,
  };
}
