// components/QRCheckInScanner.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { checkInAttendees } from "@/app/actions/events";

type ScanResult =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | { type: "already"; message: string }
  | null;

export default function QRCheckInScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number | null>(null);

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [tab, setTab] = useState<"scan" | "manual">("scan");
  const [manual, setManual] = useState({ attendeeId: "", eventId: "" });

  const stopScan = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setScanning(false);
  }, []);

  const startScan = useCallback(async () => {
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setResult({
        type: "error",
        message: "Camera access denied. Please allow camera permissions.",
      });
    }
  }, []);

  // Auto-start/stop based on active tab
  useEffect(() => {
    if (tab === "scan") {
      startScan();
    } else {
      stopScan();
    }
    return () => stopScan();
  }, [tab, startScan, stopScan]);

  // QR scan loop
  useEffect(() => {
    if (!scanning) return;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }
      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: "dontInvert",
      });
      if (code) {
        stopScan();
        handleQRData(code.data);
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  // Cleanup on unmount
  useEffect(() => () => stopScan(), [stopScan]);

  const handleQRData = async (raw: string) => {
    let parsed: { attendeeId: string; eventId: number };
    try {
      parsed = JSON.parse(raw);
    } catch {
      setResult({ type: "error", message: "Invalid QR code." });
      return;
    }
    if (!parsed.attendeeId || !parsed.eventId) {
      setResult({ type: "error", message: "QR code missing required fields." });
      return;
    }
    await doCheckIn(parsed.attendeeId, Number(parsed.eventId));
  };

  const doCheckIn = async (attendeeId: string, eventId: number) => {
  setLoading(true);
  setResult(null);

  const res = await checkInAttendees({ attendeeId, eventId });

  if (res.success) {
    setResult({
      type: "success",
      message: `Attendee checked in for event #${eventId}`,
    });
  } else {
    const msg = res.message.toLowerCase();
    if (msg.includes("already")) {
      setResult({ type: "already", message: "This attendee is already checked in." });
    } else {
      setResult({ type: "error", message: res.message });
    }
  }

  setLoading(false);
};



  const submitManual = async () => {
    if (!manual.attendeeId || !manual.eventId) return;
    await doCheckIn(manual.attendeeId, Number(manual.eventId));
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-[#121212] rounded-2xl border border-[#1f1f1f] overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1f1f1f]">
          <span className="text-[#FFD159] text-xl">⬛</span>
          <h2 className="text-white font-semibold text-base">Check-in Scanner</h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1f1f1f]">
          {(["scan", "manual"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition border-b-2 ${
                tab === t
                  ? "text-white border-[#FFD159]"
                  : "text-gray-500 border-transparent"
              }`}
            >
              {t === "scan" ? "Scan QR" : "Manual"}
            </button>
          ))}
        </div>

        {/* Scan Tab */}
        {tab === "scan" && (
          <div className="p-5 flex flex-col gap-4">
            <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`}
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {scanning && (
                <>
                  <span className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#FFD159] rounded-tl" />
                  <span className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#FFD159] rounded-tr" />
                  <span className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#FFD159] rounded-bl" />
                  <span className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#FFD159] rounded-br" />
                </>
              )}

              {loading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#FFD159] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!scanning && !loading && (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m11-4v4a1 1 0 01-1 1h-3m4-11V6a1 1 0 00-1-1h-3" />
                  </svg>
                  <p className="text-sm">Starting camera…</p>
                </div>
              )}
            </div>

            {result && <ResultBanner result={result} />}

            {result && (
              <button
                onClick={startScan}
                className="w-full py-3 bg-[#FFD159] text-black font-semibold rounded-xl text-sm hover:opacity-90 transition"
              >
                Scan another
              </button>
            )}
          </div>
        )}

        {/* Manual Tab */}
        {tab === "manual" && (
          <div className="p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Attendee ID</label>
              <input
                className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#FFD159]"
                placeholder="e.g. a1b2c3d4-..."
                value={manual.attendeeId}
                onChange={(e) => setManual((p) => ({ ...p, attendeeId: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Event ID</label>
              <input
                type="number"
                className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#FFD159]"
                placeholder="e.g. 42"
                value={manual.eventId}
                onChange={(e) => setManual((p) => ({ ...p, eventId: e.target.value }))}
              />
            </div>
            {result && <ResultBanner result={result} />}
            <button
              onClick={submitManual}
              disabled={loading || !manual.attendeeId || !manual.eventId}
              className="w-full py-3 bg-[#FFD159] text-black font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-40 transition"
            >
              {loading ? "Checking in…" : "Check in attendee"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultBanner({ result }: { result: NonNullable<ScanResult> }) {
  const config = {
    success: { bg: "bg-green-950", border: "border-green-800", text: "text-green-300", icon: "✓", label: "Checked in!" },
    error:   { bg: "bg-red-950",   border: "border-red-800",   text: "text-red-300",   icon: "✕", label: "Failed" },
    already: { bg: "bg-yellow-950",border: "border-yellow-800",text: "text-yellow-300",icon: "⚠", label: "Already checked in" },
  }[result.type];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${config.bg} ${config.border}`}>
      <span className={`text-lg ${config.text}`}>{config.icon}</span>
      <div>
        <p className={`text-sm font-medium ${config.text}`}>{config.label}</p>
        <p className={`text-xs mt-0.5 ${config.text} opacity-80`}>{result.message}</p>
      </div>
    </div>
  );
}