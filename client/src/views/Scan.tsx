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
  const workerRef = useRef<Worker | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImgUrl, setCropImgUrl] = useState<string | null>(null);
  const [cropImgNatural, setCropImgNatural] = useState<{ w: number; h: number } | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; size: number }>({ x: 0, y: 0, size: 100 });
  const cropDraggingRef = useRef<{ active: boolean; ox: number; oy: number } | null>(null);

  useEffect(() => {
    try {
      // @ts-ignore Vite worker import
      workerRef.current = new Worker(new URL('../workers/qrWorker.ts', import.meta.url), { type: 'module' });
    } catch {}
    return () => {
      if (workerRef.current) {
        try { workerRef.current.terminate(); } catch {}
        workerRef.current = null;
      }
    };
  }, []);

  async function openManualCropWithDataUrl(dataUrl: string) {
    setCropImgUrl(dataUrl);
    setCropImgNatural(null);
    setCropOpen(true);
  }

  function decodeViaWorker(imageData: ImageData): Promise<string | null> {
    return new Promise((resolve) => {
      const w = workerRef.current;
      if (!w) return resolve(null);
      const onMsg = (ev: MessageEvent) => {
        w.removeEventListener('message', onMsg as any);
        const res = ev.data;
        if (res && res.ok && res.text) resolve(res.text as string);
        else resolve(null);
      };
      w.addEventListener('message', onMsg as any);
      w.postMessage({ cmd: 'decode', payload: { width: imageData.width, height: imageData.height, data: imageData.data } });
    });
  }

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
      if (!('mediaDevices' in navigator) || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const insecure = typeof window !== 'undefined' && !window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname);
        setCameraError(
          insecure
            ? 'Camera is unavailable over HTTP on mobile. Please use HTTPS (or localhost) to enable camera access.'
            : 'Camera API is unavailable in this browser. Please use a modern browser (Chrome/Safari/Edge) and allow camera permissions.'
        );
        return;
      }
      if (typeof window !== 'undefined' && !window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        setCameraError('Camera requires a secure origin. Start the dev server with HTTPS or access via a secure tunnel.');
        return;
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
      }
    } catch (e: any) {
      setCameraError(e?.message || 'Unable to access camera');
    }
  }

  async function captureAndDecode() {
    setError(null);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    const maxW = 1280;
    const scale = Math.min(1, maxW / (vw || maxW));
    const tw = Math.max(1, Math.round(vw * scale));
    const th = Math.max(1, Math.round(vh * scale));
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, tw, th);
    const imageData = ctx.getImageData(0, 0, tw, th);
    const text = await decodeViaWorker(imageData);
    if (text) {
      setQrCode(text);
    } else {
      // Open manual crop editor with the captured frame
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        await openManualCropWithDataUrl(dataUrl);
      } catch {}
      setError('No QR found. Try adjusting the crop to the QR area.');
    }
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
                  const file = e.target.files?.[0];                  try {
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
                    const canvas = canvasRef.current;
                    if (!canvas) return;
                    const maxW = 1600;
                    const s = Math.min(1, maxW / (imgEl.naturalWidth || maxW));
                    const w = Math.max(1, Math.round((imgEl.naturalWidth || maxW) * s));
                    const h = Math.max(1, Math.round((imgEl.naturalHeight || maxW) * s));
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    ctx.drawImage(imgEl, 0, 0, w, h);
                    const imageData = ctx.getImageData(0, 0, w, h);
                    const text = await decodeViaWorker(imageData);
                    if (text) setQrCode(text);
                    else {
                      // Open manual crop editor to allow user to adjust
                      try {
                        const url = canvas.toDataURL('image/jpeg', 0.92);
                        await openManualCropWithDataUrl(url);
                      } catch {}
                      setError('No QR found in image. Try cropping to the QR area.');
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
                  <div className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded">Ready</div>
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
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded"
                    onClick={captureAndDecode}
                  >
                    Capture & Decode
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                    onClick={async () => {
                      try {
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        if (!video || !canvas) return;
                        const vw = video.videoWidth;
                        const vh = video.videoHeight;
                        if (!vw || !vh) return;
                        canvas.width = vw;
                        canvas.height = vh;
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return;
                        ctx.drawImage(video, 0, 0, vw, vh);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                        await openManualCropWithDataUrl(dataUrl);
                        setError(null);
                      } catch {}
                    }}
                  >
                    Manual Crop
                  </button>
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-base">
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
                        <div className="text-slate-700 dark:text-slate-400 text-sm mb-1">Photo</div>
                        <div className="w-40 h-40 rounded bg-slate-100 border border-slate-300 overflow-hidden">
                          {/* eslint-disable-next-line jsx-a11y/alt-text */}
                          <img src={/^https?:\/\//i.test(result.subject.photoUrl) ? result.subject.photoUrl : `${(import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000'}${result.subject.photoUrl}` } className="w-full h-full object-cover" />
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

      {cropOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setCropOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-lg p-4 z-10 w-[min(96vw,900px)] dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Manual Crop</div>
              <button className="px-3 py-1 text-sm rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200" onClick={() => setCropOpen(false)}>Close</button>
            </div>
            <div className="relative overflow-auto max-h-[70vh]">
              {/* Image container */}
              <div className="relative inline-block">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img
                  ref={cropImgRef}
                  src={cropImgUrl || ''}
                  onLoad={() => {
                    const img = cropImgRef.current;
                    if (!img) return;
                    const nw = img.naturalWidth || 0;
                    const nh = img.naturalHeight || 0;
                    setCropImgNatural({ w: nw, h: nh });
                    const size = Math.floor(Math.min(nw, nh) * 0.5);
                    const x = Math.floor((nw - size) / 2);
                    const y = Math.floor((nh - size) / 2);
                    setCropBox({ x, y, size });
                  }}
                  className="max-w-[80vw] max-h-[60vh] object-contain select-none"
                />

                {/* Square crop overlay in image coordinates */}
                {cropImgNatural && cropImgRef.current && (() => {
                  const img = cropImgRef.current!;
                  // Compute scale from natural to displayed size
                  const dispW = img.clientWidth;
                  const dispH = img.clientHeight;
                  const scaleX = dispW / cropImgNatural.w;
                  const scaleY = dispH / cropImgNatural.h;
                  const sx = cropBox.x * scaleX;
                  const sy = cropBox.y * scaleY;
                  const ss = cropBox.size * Math.min(scaleX, scaleY);

                  function onPointerDown(ev: React.MouseEvent | React.TouchEvent) {
                    const pt = 'touches' in ev ? ev.touches[0] : (ev as any);
                    const rect = img.getBoundingClientRect();
                    const cx = pt.clientX - rect.left;
                    const cy = pt.clientY - rect.top;
                    cropDraggingRef.current = { active: true, ox: cx, oy: cy };
                    (ev as any).preventDefault?.();
                  }

                  function onPointerMove(ev: any) {
                    if (!cropDraggingRef.current?.active) return;
                    const pt = ev.touches ? ev.touches[0] : ev;
                    const rect = img.getBoundingClientRect();
                    const cx = pt.clientX - rect.left;
                    const cy = pt.clientY - rect.top;
                    const dx = (cx - cropDraggingRef.current.ox) / scaleX;
                    const dy = (cy - cropDraggingRef.current.oy) / scaleY;
                    cropDraggingRef.current.ox = cx;
                    cropDraggingRef.current.oy = cy;
                    setCropBox((b) => {
                      const nx = Math.max(0, Math.min(cropImgNatural.w - b.size, b.x + dx));
                      const ny = Math.max(0, Math.min(cropImgNatural.h - b.size, b.y + dy));
                      return { ...b, x: Math.round(nx), y: Math.round(ny), size: b.size };
                    });
                  }

                  function onPointerUp() {
                    cropDraggingRef.current = { active: false, ox: 0, oy: 0 };
                  }

                  return (
                    <div
                      className="absolute border-2 border-emerald-500 rounded"
                      style={{ left: sx, top: sy, width: ss, height: ss }}
                      onMouseDown={onPointerDown as any}
                      onMouseMove={onPointerMove as any}
                      onMouseUp={onPointerUp}
                      onMouseLeave={onPointerUp}
                      onTouchStart={onPointerDown as any}
                      onTouchMove={onPointerMove as any}
                      onTouchEnd={onPointerUp}
                    />
                  );
                })()}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="text-xs text-slate-600 dark:text-slate-400">Size</label>
              <input
                type="range"
                min={20}
                max={100}
                value={(() => {
                  const base = cropImgNatural ? Math.min(cropImgNatural.w, cropImgNatural.h) : cropBox.size;
                  return Math.round((cropBox.size / Math.max(1, base)) * 100);
                })()}
                onChange={(e) => {
                  const base = cropImgNatural ? Math.min(cropImgNatural.w, cropImgNatural.h) : cropBox.size;
                  const size = Math.max(10, Math.floor((Number(e.target.value) / 100) * base));
                  setCropBox((b) => {
                    // keep center roughly in place
                    const cx = b.x + b.size / 2;
                    const cy = b.y + b.size / 2;
                    let nx = Math.round(cx - size / 2);
                    let ny = Math.round(cy - size / 2);
                    const maxW = cropImgNatural ? cropImgNatural.w : b.size;
                    const maxH = cropImgNatural ? cropImgNatural.h : b.size;
                    nx = Math.max(0, Math.min(maxW - size, nx));
                    ny = Math.max(0, Math.min(maxH - size, ny));
                    return { x: nx, y: ny, size };
                  });
                }}
              />
              <div className="ml-auto flex gap-2">
                <button
                  className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                  onClick={() => setCropOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                  onClick={async () => {
                    try {
                      if (!cropImgRef.current || !cropImgNatural || !canvasRef.current) return;
                      const img = cropImgRef.current;
                      const outSize = 800;
                      const canvas = canvasRef.current;
                      canvas.width = outSize;
                      canvas.height = outSize;
                      const ctx = canvas.getContext('2d');
                      if (!ctx) return;
                      ctx.drawImage(
                        img,
                        cropBox.x,
                        cropBox.y,
                        cropBox.size,
                        cropBox.size,
                        0,
                        0,
                        outSize,
                        outSize
                      );
                      const imageData = ctx.getImageData(0, 0, outSize, outSize);
                      const text = await decodeViaWorker(imageData);
                      if (text) {
                        setQrCode(text);
                        setError(null);
                        setCropOpen(false);
                      } else {
                        setError('No QR found in selected crop');
                      }
                    } catch {}
                  }}
                >
                  Decode Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
