import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import jsQR from 'jsqr';

export function Scan() {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState<'checkin' | 'checkout' | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'manual' | 'camera'>('manual');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  async function doScan(action: 'checkin' | 'checkout') {
    setLoading(action);
    setError(null);
    setResult(null);
    try {
      const now = Date.now();
      const last = lastScanRef.current;
      if (last && last.code === qrCode && now - last.at < 3000) {
        setError('Duplicate scan ignored (try again in a moment)');
        return;
      }
      const res = await api.post('/api/scan', { qrCode, action });
      setResult(res.data);
      lastScanRef.current = { code: qrCode, at: now };
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Scan failed');
    } finally {
      setLoading(null);
    }
  }

  function stopCamera() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        tick();
      }
    } catch (e: any) {
      setCameraError(e?.message || 'Unable to access camera');
    }
  }

  function tick() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w && h) {
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const img = ctx.getImageData(0, 0, w, h);
        const code = jsQR(img.data, img.width, img.height);
        if (code && code.data) {
          setQrCode(code.data);
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Scan</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <section className="md:col-span-1 bg-white border border-slate-200 rounded-lg p-4 dark:bg-slate-800/40 dark:border-slate-700">
          <div className="space-y-3">
            <div className="flex gap-2 text-sm">
              <button
                className={`px-3 py-1 rounded ${mode === 'manual' ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white'}`}
                onClick={() => setMode('manual')}
              >
                Manual
              </button>
              <button
                className={`px-3 py-1 rounded ${mode === 'camera' ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white'}`}
                onClick={() => setMode('camera')}
              >
                Camera
              </button>
            </div>
            <input
              className="w-full bg-white border border-slate-300 text-slate-900 rounded px-3 py-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
              placeholder="Paste or scan QR code value"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
            />
            {mode === 'camera' && (
              <div className="space-y-2">
                {cameraError && <div className="text-rose-600 dark:text-red-400 text-sm">{cameraError}</div>}
                <div className="relative">
                  <video ref={videoRef} className="w-full rounded bg-black" muted playsInline />
                  <div className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                    Scanning...
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}
            {error && <div className="text-rose-600 dark:text-red-400 text-sm">{error}</div>}
            <div className="flex gap-2">
              <button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded disabled:opacity-60"
                disabled={!qrCode || loading !== null}
                onClick={() => doScan('checkin')}
              >
                {loading === 'checkin' ? 'Checking in...' : 'Check-in'}
              </button>
              <button
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded disabled:opacity-60"
                disabled={!qrCode || loading !== null}
                onClick={() => doScan('checkout')}
              >
                {loading === 'checkout' ? 'Checking out...' : 'Check-out'}
              </button>
            </div>
          </div>
        </section>

        <section className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-2">Result</h3>
          {!result && !error && <div className="text-slate-600 dark:text-slate-400 text-sm">No scan yet.</div>}
          {result && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 dark:bg-slate-800/40 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-700 dark:text-slate-400">Event:</span> {result.event}</div>
                <div><span className="text-slate-700 dark:text-slate-400">Timestamp:</span> {new Date(result.at).toLocaleString()}</div>
                <div><span className="text-slate-700 dark:text-slate-400">Subject Type:</span> {result.subjectType}</div>
                {result.subject && (
                  <>
                    <div className="md:col-span-2"><span className="text-slate-700 dark:text-slate-400">Name:</span> {result.subject.fullName}</div>
                    {result.subject.roleTitle && (
                      <div className="md:col-span-2"><span className="text-slate-700 dark:text-slate-400">Role:</span> {result.subject.roleTitle}</div>
                    )}
                    {result.subject.photoUrl && (
                      <div className="md:col-span-2 mt-1">
                        <div className="text-slate-700 dark:text-slate-400 text-xs mb-1">Photo</div>
                        <div className="w-24 h-24 rounded bg-slate-100 border border-slate-300 overflow-hidden">
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <img src={result.subject.photoUrl} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div><span className="text-slate-700 dark:text-slate-400">Log ID:</span> {result.logId}</div>
              </div>
              {Array.isArray(result.alerts) && result.alerts.length > 0 && (
                <div className="mt-4">
                  <div className="font-medium text-amber-600 dark:text-amber-300 mb-2">Alerts</div>
                  <ul className="list-disc pl-6 text-sm">
                    {result.alerts.map((a: any, idx: number) => (
                      <li key={idx} className="mb-1">
                        <span className="text-slate-800 dark:text-slate-300">{a.level}</span>
                        {a.details && <span className="text-slate-600 dark:text-slate-400"> — {a.details}</span>}
                        {a.recordedAt && <span className="text-slate-500"> ({new Date(a.recordedAt).toLocaleString()})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
