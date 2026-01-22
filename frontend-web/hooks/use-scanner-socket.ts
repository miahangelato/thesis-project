import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { FingerName } from '@/types/fingerprint';

interface ScannerStatus {
    scan_id: string | null;
    finger_name: string | null;
    status: 'idle' | 'waiting' | 'detecting' | 'capturing' | 'success' | 'error' | 'cancelled';
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

const SCANNER_URL = process.env.NEXT_PUBLIC_SCANNER_BASE_URL || 'http://localhost:5000';

export function useScannerSocket() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [scannerStatus, setScannerStatus] = useState<ScannerStatus>({
        scan_id: null,
        finger_name: null,
        status: 'idle',
        hint: '',
        metrics: {},
    });
    const [previewFrame, setPreviewFrame] = useState<string | null>(null);
    const [scanComplete, setScanComplete] = useState<ScanComplete | null>(null);
    const reconnectAttemptedRef = useRef(false);

    // Initialize socket connection
    useEffect(() => {
        const newSocket = io(SCANNER_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        // Connection handlers
        newSocket.on('connect', () => {
            console.log('✅ [useScannerSocket] WebSocket connected to', SCANNER_URL);
            console.log('🔌 [useScannerSocket] Socket ID:', newSocket.id);
            setIsConnected(true);
            reconnectAttemptedRef.current = false;
        });

        newSocket.on('disconnect', () => {
            console.log('❌ [useScannerSocket] WebSocket disconnected');
            setIsConnected(false);
        });

        // Scanner status updates
        newSocket.on('scanner_status', (data: ScannerStatus) => {
            console.log('📊 [useScannerSocket] Scanner status received:', {
                scan_id: data.scan_id,
                finger_name: data.finger_name,
                status: data.status,
                hint: data.hint,
                metrics: data.metrics
            });
            setScannerStatus(data);
        });

        // Preview frames
        newSocket.on('preview_frame', (data: PreviewFrame) => {
            console.log('🖼️ [useScannerSocket] Preview frame received for', data.finger_name, '- length:', data.frame_b64?.length);
            setPreviewFrame(data.frame_b64);
        });

        // Scan complete
        newSocket.on('scan_complete', (data: ScanComplete) => {
            console.log('✅ [useScannerSocket] Scan complete event received:', {
                scan_id: data.scan_id,
                finger_name: data.finger_name,
                image_b64_length: data.image_b64_full?.length,
                metrics: data.metrics
            });
            setScanComplete(data);
        });

        // Scan started acknowledgment
        newSocket.on('scan_started', (data: { scan_id: string; finger_name: string }) => {
            console.log('🚀 [useScannerSocket] Scan started acknowledgment:', data);
        });

        console.log('🔧 [useScannerSocket] WebSocket initialized, connecting to', SCANNER_URL);
        setSocket(newSocket);

        return () => {
            console.log('🧹 [useScannerSocket] Cleaning up WebSocket connection');
            newSocket.close();
        };
    }, []);

    // Reconnect recovery: fetch fallback API to sync state
    useEffect(() => {
        if (isConnected && !reconnectAttemptedRef.current && scannerStatus.status !== 'idle') {
            reconnectAttemptedRef.current = true;

            // Fetch current state from fallback API
            console.log('♻️ [useScannerSocket] Fetching state from fallback API after reconnect...');
            fetch(`${SCANNER_URL}/api/scanner/progress`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        console.log('♻️ Synced state from fallback API after reconnect');
                        setScannerStatus({
                            scan_id: data.scan_id,
                            finger_name: data.finger_name,
                            status: data.status || 'idle',
                            hint: data.hint || '',
                            metrics: data.metrics || {},
                        });
                        if (data.last_preview_frame_b64) {
                            setPreviewFrame(data.last_preview_frame_b64);
                        }
                    }
                })
                .catch((err) => console.error('Failed to sync from fallback API:', err));
        }
    }, [isConnected, scannerStatus.status]);

    // Start scan function
    const startScan = useCallback((fingerName: FingerName) => {
        if (!socket || !isConnected) {
            console.error('❌ [useScannerSocket] Cannot start scan: WebSocket not connected');
            console.error('   Socket:', !!socket, 'Connected:', isConnected);
            return;
        }

        console.log(`🔍 [useScannerSocket] Starting scan for ${fingerName}`);
        console.log('   Socket ID:', socket.id, 'Connected:', isConnected);

        // Reset state
        console.log('🧹 [useScannerSocket] Resetting scan state...');
        setScanComplete(null);
        setPreviewFrame(null);

        // Emit start_scan event
        console.log('📤 [useScannerSocket] Emitting start_scan event:', { finger_name: fingerName });
        socket.emit('start_scan', { finger_name: fingerName });
        console.log('✅ [useScannerSocket] start_scan event emitted');
    }, [socket, isConnected]);

    // Stop scan function
    const stopScan = useCallback((scanId: string) => {
        if (!socket || !isConnected) {
            console.error('❌ [useScannerSocket] Cannot stop scan: WebSocket not connected');
            return;
        }

        console.log(`🛑 [useScannerSocket] Stopping scan ${scanId}`);
        socket.emit('stop_scan', { scan_id: scanId });
    }, [socket, isConnected]);

    // DEBUG: Log state changes (only when values actually change)
    useEffect(() => {
        console.log('🔄 [useScannerSocket] State changed:', {
            isConnected,
            status: scannerStatus.status,
            hasPreviewFrame: !!previewFrame,
            hasScanComplete: !!scanComplete
        });
    }, [isConnected, scannerStatus.status, previewFrame, scanComplete]);

    return {
        isConnected,
        scannerStatus,
        previewFrame,
        scanComplete,
        startScan,
        stopScan,
    };
}
