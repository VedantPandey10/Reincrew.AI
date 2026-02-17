import { useEffect, useRef, useState, useCallback } from 'react';

export interface LockdownViolation {
    type: 'FULLSCREEN_EXIT' | 'TAB_SWITCH' | 'DEVTOOLS' | 'RIGHT_CLICK';
    message: string;
    timestamp: string;
}

interface UseFullscreenLockdownOptions {
    enabled: boolean;
    onViolation: (violation: LockdownViolation) => void;
    onTerminate?: () => void;
    maxViolations?: number;
    graceMs?: number; // Grace period before re-requesting fullscreen
}

interface UseFullscreenLockdownReturn {
    isFullscreen: boolean;
    violationCount: number;
    showViolationOverlay: boolean;
    violationMessage: string;
    enterFullscreen: () => Promise<void>;
    forceExitFullscreen: () => void;
    dismissViolationOverlay: () => void;
}

export function useFullscreenLockdown({
    enabled,
    onViolation,
    onTerminate,
    maxViolations = 3,
    graceMs = 2000,
}: UseFullscreenLockdownOptions): UseFullscreenLockdownReturn {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [showViolationOverlay, setShowViolationOverlay] = useState(false);
    const [violationMessage, setViolationMessage] = useState('');

    const violationCountRef = useRef(0);
    const isExitingRef = useRef(false); // Tracks intentional exits (e.g. termination)
    const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const enabledRef = useRef(enabled);

    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    const enterFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            }
        } catch (err) {
            console.warn('Fullscreen request failed:', err);
        }
    }, []);

    const forceExitFullscreen = useCallback(() => {
        isExitingRef.current = true;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    const dismissViolationOverlay = useCallback(() => {
        setShowViolationOverlay(false);
        setViolationMessage('');
        // Re-enter fullscreen when user acknowledges
        enterFullscreen();
    }, [enterFullscreen]);

    const triggerViolation = useCallback(
        (type: LockdownViolation['type'], message: string) => {
            if (!enabledRef.current || isExitingRef.current) return;

            violationCountRef.current += 1;
            setViolationCount(violationCountRef.current);
            setViolationMessage(message);
            setShowViolationOverlay(true);

            const violation: LockdownViolation = {
                type,
                message: `STRIKE ${violationCountRef.current}: ${message}`,
                timestamp: new Date().toISOString(),
            };

            onViolation(violation);

            if (violationCountRef.current >= maxViolations && onTerminate) {
                onTerminate();
            }
        },
        [onViolation, onTerminate, maxViolations]
    );

    // — Fullscreen change listener —
    useEffect(() => {
        if (!enabled) return;

        const handleFullscreenChange = () => {
            const inFS = !!document.fullscreenElement;
            setIsFullscreen(inFS);

            if (!inFS && !isExitingRef.current && enabledRef.current) {
                // User exited fullscreen (e.g. pressed Escape) — grace period, then warn
                if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
                graceTimerRef.current = setTimeout(() => {
                    if (!document.fullscreenElement && enabledRef.current && !isExitingRef.current) {
                        triggerViolation('FULLSCREEN_EXIT', 'Exiting fullscreen is prohibited during the exam!');
                    }
                }, graceMs);

                // Immediately try to re-enter
                setTimeout(() => {
                    if (!document.fullscreenElement && enabledRef.current && !isExitingRef.current) {
                        enterFullscreen();
                    }
                }, 300);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
        };
    }, [enabled, triggerViolation, enterFullscreen, graceMs]);

    // — Visibility change (tab switch) listener —
    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = () => {
            if (document.hidden && enabledRef.current && !isExitingRef.current) {
                triggerViolation('TAB_SWITCH', 'Tab switching is strictly prohibited!');
            }
        };

        const handleWindowBlur = () => {
            if (enabledRef.current && !isExitingRef.current) {
                triggerViolation('TAB_SWITCH', 'Window focus lost! Stay on the exam window.');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [enabled, triggerViolation]);

    // — Keyboard shortcut blocker —
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!enabledRef.current) return;

            // Block F12 (DevTools)
            if (e.key === 'F12') {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Block Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools)
            if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Block Ctrl+U (View Source)
            if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Block Ctrl+W / Ctrl+T / Ctrl+N (Close tab, new tab, new window)
            if (e.ctrlKey && ['w', 'W', 't', 'T', 'n', 'N'].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Block Alt+Tab, Alt+F4
            if (e.altKey && (e.key === 'Tab' || e.key === 'F4')) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Block PrintScreen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Block F11 (browser fullscreen toggle — we control fullscreen)
            if (e.key === 'F11') {
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            // Block Escape explicitly (browser handles it for fullscreen, but we catch any residual)
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        };

        // Use capture phase to intercept before anything else
        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [enabled]);

    // — Right-click blocker —
    useEffect(() => {
        if (!enabled) return;

        const handleContextMenu = (e: MouseEvent) => {
            if (enabledRef.current) {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [enabled]);

    // — beforeunload warning —
    useEffect(() => {
        if (!enabled) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (enabledRef.current) {
                e.preventDefault();
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [enabled]);

    return {
        isFullscreen,
        violationCount,
        showViolationOverlay,
        violationMessage,
        enterFullscreen,
        forceExitFullscreen,
        dismissViolationOverlay,
    };
}
