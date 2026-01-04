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

interface SessionStarted {
    session_id: string;
    finger_queue: FingerName[];
    total_fingers: number;
}

interface NextFinger {
    session_id: string;
    finger_name: FingerName;
    finger_index: number;
    total_fingers: number;
}

interface SessionComplete {
    session_id: string;
    fingers_captured: FingerName[];
    total_expected: number;
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
    const socketInitializedRef = useRef(false); // Prevent double-init in StrictMode

    // Session-based state
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [fingerQueue, setFingerQueue] = useState<FingerName[]>([]);
    const [currentFingerIndex, setCurrentFingerIndex] = useState<number>(0);
    const [capturedFingers, setCapturedFingers] = useState<Map<FingerName, ScanComplete>>(new Map());
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Initialize socket connection
    useEffect(() => {
        // Prevent duplicate initialization in React StrictMode
        if (socketInitializedRef.current) {
            console.log('🔒 [useScannerSocket] Socket already initialized, skipping');
            return;
        }

        socketInitializedRef.current = true;
        console.log('🔓 [useScannerSocket] Initializing socket for the first time');

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
            console.log('✅ [SCAN_COMPLETE EVENT] Received from backend:', {
                scan_id: data.scan_id,
                finger_name: data.finger_name,
                image_b64_length: data.image_b64_full?.length,
                has_metrics: !!data.metrics,
                timestamp: new Date().toISOString()
            });
            console.log(`   Setting scanComplete state for ${data.finger_name}`);
            setScanComplete(data);
        });

        // Scan started acknowledgment
        newSocket.on('scan_started', (data: { scan_id: string; finger_name: string }) => {
            console.log('🚀 [useScannerSocket] Scan started acknowledgment:', data);
        });

        // SESSION-BASED EVENTS

        // Session started
        newSocket.on('session_started', (data: SessionStarted) => {
            console.log('🎯 [useScannerSocket] Session started:', data);
            setSessionId(data.session_id);
            setFingerQueue(data.finger_queue);
            setCurrentFingerIndex(0);
            setCapturedFingers(new Map());
            setIsSessionActive(true);
        });

        // Next finger prompt
        newSocket.on('next_finger', (data: NextFinger) => {
            console.log('👉 [NEXT_FINGER EVENT] Backend instructs:', {
                session_id: data.session_id,
                finger_name: data.finger_name,
                finger_index: data.finger_index,
                total_fingers: data.total_fingers,
                timestamp: new Date().toISOString()
            });

            console.log(`   Setting currentFingerIndex to ${data.finger_index}`);
            setCurrentFingerIndex(data.finger_index);

            // Reset single-finger state for new finger
            console.log('   Clearing scanComplete and previewFrame for new finger');
            setScanComplete(null);
            setPreviewFrame(null);
        });

        // Session complete
        newSocket.on('session_complete', (data: SessionComplete) => {
            console.log('🎉 [useScannerSocket] Session complete!', data);
            setIsSessionActive(false);
            setSessionId(null);
        });

        // Session cancelled
        newSocket.on('session_cancelled', (data: { session_id: string; reason: string }) => {
            console.log('🛑 [useScannerSocket] Session cancelled:', data);
            setIsSessionActive(false);
            setSessionId(null);
        });

        // DEBUG: Catch-all listener to see ALL events
        newSocket.onAny((eventName, ...args) => {
            console.log(`📨 [Socket.IO] Received event: "${eventName}"`, args);
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

    // Start scan SESSION (multi-finger)
    const startScanSession = useCallback((fingerNames: FingerName[], participantId?: string) => {
        if (!socket || !isConnected) {
            console.error('❌ [useScannerSocket] Cannot start session: WebSocket not connected');
            console.error('   Socket:', !!socket, 'Connected:', isConnected);
            return;
        }

        console.log(`🎯 [useScannerSocket] Starting scan SESSION for ${fingerNames.length} fingers`);
        console.log('   Fingers:', fingerNames);
        console.log('   Participant ID:', participantId || 'unknown');
        console.log('   Socket ID:', socket.id, 'Connected:', isConnected);

        // Reset state
        console.log('🧹 [useScannerSocket] Resetting session state...');
        setScanComplete(null);
        setPreviewFrame(null);
        setCapturedFingers(new Map());
        setIsSessionActive(false);

        // Emit start_scan_session event with participant_id
        console.log('📤 [useScannerSocket] Emitting start_scan_session event');
        socket.emit('start_scan_session', {
            finger_names: fingerNames,
            participant_id: participantId || 'unknown'
        });
        console.log('✅ [useScannerSocket] start_scan_session event emitted');
    }, [socket, isConnected]);

    // Stop/Cancel session
    const stopSession = useCallback(() => {
        if (!socket || !isConnected) {
            console.error('❌ [useScannerSocket] Cannot cancel session: not connected');
            return;
        }

        console.log(`🛑 [useScannerSocket] Cancelling session ${sessionId || '(no session ID)'}`);
        socket.emit('cancel_scan_session', { session_id: sessionId });
        setIsSessionActive(false);
    }, [socket, isConnected, sessionId]);

    // Handle completed finger capture (update map)
    useEffect(() => {
        if (scanComplete && scanComplete.finger_name) {
            console.log(`✅ [useScannerSocket] Adding ${scanComplete.finger_name} to captured fingers`);
            setCapturedFingers(prev => {
                const updated = new Map(prev);
                updated.set(scanComplete.finger_name as FingerName, scanComplete);
                return updated;
            });
        }
    }, [scanComplete]);

    // DEBUG: Log state changes (only when values actually change)
    useEffect(() => {
        console.log('🔄 [useScannerSocket] State changed:', {
            isConnected,
            status: scannerStatus.status,
            hasPreviewFrame: !!previewFrame,
            hasScanComplete: !!scanComplete,
            currentFingerIndex,
            isSessionActive
        });
    }, [isConnected, scannerStatus.status, previewFrame, scanComplete, currentFingerIndex, isSessionActive]);

    return {
        isConnected,
        scannerStatus,
        previewFrame,
        scanComplete,
        startScan,
        stopScan,
        // Session-based scanning
        startScanSession,
        stopSession,
        isSessionActive,
        sessionId,
        fingerQueue,
        currentFingerIndex,
        capturedFingers,
    };
}
