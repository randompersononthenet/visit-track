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
  const lastDecodeTsRef = useRef<number>(0);
  const zxingControlsRef = useRef<any | null>(null);
  const zxingReaderRef = useRef<any | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

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
    if (zxingControlsRef.current) {
      try { zxingControlsRef.current.stop(); } catch {}
      zxingControlsRef.current = null;
    }
    if (zxingReaderRef.current) {
      try { zxingReaderRef.current.reset?.(); } catch {}
      zxingReaderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function startCamera() {
    setCameraError(null);
    try {
      // Prefer ZXing if available (requires @zxing/browser installed)
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        zxingReaderRef.current = reader;
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result: any, err: any, c: any) => {
            if (c) zxingControlsRef.current = c;
            if (result) {
              const text = result.getText();
              setQrCode((prev) => (prev === text ? prev : text));
            }
          },
          {
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            } as any,
          }
        );
        zxingControlsRef.current = controls;
        // Torch support (ZXing path relies on underlying stream track)
        const track: MediaStreamTrack | undefined = (videoRef.current?.srcObject as MediaStream | undefined)?.getVideoTracks?.()[0];
        if (track && 'getCapabilities' in track) {
          const caps: any = (track as any).getCapabilities?.() || {};
          setTorchAvailable(!!caps.torch);
        }
        return; // ZXing started; don't start manual loop
      } catch {
        // Fallback to manual getUserMedia + jsQR
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await (videoRef.current as HTMLVideoElement).play();
        // Torch capability (fallback path)
        const track = stream.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          const caps: any = (track as any).getCapabilities?.() || {};
          setTorchAvailable(!!caps.torch);
        }
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
      const targetW = Math.min(480, w || 480);
      const scale = targetW / (w || 1);
      const targetH = Math.max(1, Math.round(h * scale));
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetW, targetH);
        const now = performance.now();
        if (now - lastDecodeTsRef.current >= 180) {
          // Decode only on a centered square ROI for better performance
          const roiSize = Math.floor(Math.min(targetW, targetH) * 0.7);
          const roiX = Math.floor((targetW - roiSize) / 2);
          const roiY = Math.floor((targetH - roiSize) / 2);
          const img = ctx.getImageData(roiX, roiY, roiSize, roiSize);
          const code = jsQR(img.data, img.width, img.height);
          if (code && code.data) {
            setQrCode((prev) => (prev === code.data ? prev : code.data));
          }
          lastDecodeTsRef.current = now;
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
            <label className="inline-flex items-center px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  setError(null);
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const dataUrl = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.onerror = () => reject(new Error('Failed to read image'));
                      reader.readAsDataURL(file);
                    });
                    const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
                      const img = new Image();
                      img.onload = () => resolve(img);
                      img.onerror = () => reject(new Error('Invalid image'));
                      img.src = dataUrl;
                    });
                    // Try ZXing first for image decoding
                    try {
                      const { BrowserMultiFormatReader } = await import('@zxing/browser');
                      const reader = new BrowserMultiFormatReader();
                      const res: any = await reader.decodeFromImageElement(imgEl as any);
                      const text = res?.getText?.() || '';
                      if (text) {
                        setQrCode(text);
                      } else {
                        throw new Error('ZXing could not decode');
                      }
                    } catch {
                      // Fallback to jsQR
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const maxW = 1000;
                      const scale = Math.min(1, maxW / (imgEl.naturalWidth || maxW));
                      const w = Math.max(1, Math.round((imgEl.naturalWidth || maxW) * scale));
                      const h = Math.max(1, Math.round((imgEl.naturalHeight || maxW) * scale));
                      canvas.width = w;
                      canvas.height = h;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      ctx.drawImage(imgEl, 0, 0, w, h);
                      const roiSize = Math.floor(Math.min(w, h) * 0.9);
                      const roiX = Math.floor((w - roiSize) / 2);
                      const roiY = Math.floor((h - roiSize) / 2);
                      const img = ctx.getImageData(roiX, roiY, roiSize, roiSize);
                      const code = jsQR(img.data, img.width, img.height);
                      if (code && code.data) setQrCode(code.data);
                      else setError('No QR found in image');
                    }
                  } catch (e: any) {
                    setError(e?.message || 'Failed to decode image');
                  } finally {
                    // reset the input so selecting same file again triggers change
                    e.currentTarget.value = '';
                  }
                }}
              />
              Upload QR Image
            </label>
            {mode === 'camera' && (
              <div className="space-y-2">
                {cameraError && <div className="text-rose-600 dark:text-red-400 text-sm">{cameraError}</div>}
                <div className="relative">
                  <video ref={videoRef} className="w-full rounded bg-black" muted playsInline />
                  {/* Scan guide (center square) */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[70%] h-[70%] max-w-[420px] max-h-[420px] border-2 border-emerald-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]"></div>
                  </div>
                  <div className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
                    Scanning...
                  </div>
                  {torchAvailable && (
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded"
                      onClick={async () => {
                        try {
                          const track: any = (videoRef.current?.srcObject as any)?.getVideoTracks?.()[0];
                          if (!track) return;
                          await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
                          setTorchOn((v) => !v);
                        } catch {}
                      }}
                    >
                      {torchOn ? 'Torch Off' : 'Torch On'}
                    </button>
                  )}
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
              {result.subjectType === 'visitor' && (
                (() => {
                  const s = result.subject || {};
                  const risk = s.riskLevel || 'none';
                  const isWarn = risk === 'medium' || risk === 'high' || s.blacklistStatus === true;
                  if (!isWarn) return null;
                  const bannerColor = s.blacklistStatus ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-200' : (risk === 'high' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200' : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-900 dark:text-yellow-200');
                  const chipClass = risk === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800';
                  return (
                    <div className={`mb-3 border rounded px-3 py-2 text-sm ${bannerColor}`}>
                      <div className="flex items-start gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-[2px]"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            {s.blacklistStatus && (<span className="px-2 py-0.5 text-xs rounded bg-rose-100 text-rose-800">Do not admit</span>)}
                            {risk && risk !== 'none' && (<span className={`px-2 py-0.5 text-xs rounded ${chipClass}`}>Risk: {risk}</span>)}
                          </div>
                          {s.flagReason && <div className="mt-1 text-xs opacity-90">{s.flagReason}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
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
