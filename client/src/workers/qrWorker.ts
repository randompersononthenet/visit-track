// Web Worker for QR decoding using jsQR with multi-ROI attempts

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import jsQR from 'jsqr';

export type DecodeRequest = {
  cmd: 'decode';
  payload: {
    width: number;
    height: number;
    data: Uint8ClampedArray; // RGBA
  };
};

export type DecodeResponse = { ok: true; text: string } | { ok: false; error?: string };

function tryDecodeRGBA(data: Uint8ClampedArray, width: number, height: number) {
  try {
    const res = jsQR(data, width, height);
    if (res && res.data) return res.data as string;
  } catch {}
  return null;
}

function extractROI(
  source: Uint8ClampedArray,
  sw: number,
  sh: number,
  x: number,
  y: number,
  w: number,
  h: number
): { data: Uint8ClampedArray; width: number; height: number } {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let row = 0; row < h; row++) {
    const srcRow = y + row;
    const srcStart = (srcRow * sw + x) * 4;
    const dstStart = row * w * 4;
    out.set(source.subarray(srcStart, srcStart + w * 4), dstStart);
  }
  return { data: out, width: w, height: h };
}

function downscale(
  src: Uint8ClampedArray,
  sw: number,
  sh: number,
  scale: number
): { data: Uint8ClampedArray; width: number; height: number } {
  const tw = Math.max(1, Math.floor(sw * scale));
  const th = Math.max(1, Math.floor(sh * scale));
  const out = new Uint8ClampedArray(tw * th * 4);
  for (let y = 0; y < th; y++) {
    const sy = Math.floor((y / th) * sh);
    for (let x = 0; x < tw; x++) {
      const sx = Math.floor((x / tw) * sw);
      const si = (sy * sw + sx) * 4;
      const di = (y * tw + x) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = 255;
    }
  }
  return { data: out, width: tw, height: th };
}

function* roiCandidates(sw: number, sh: number): Generator<[number, number, number, number]> {
  const minSide = Math.min(sw, sh);
  const sizes = [0.9, 0.7, 0.5].map((r) => Math.floor(minSide * r));
  for (const size of sizes) {
    const cx = Math.floor((sw - size) / 2);
    const cy = Math.floor((sh - size) / 2);
    yield [cx, cy, size, size]; // center square
  }
  const w2 = Math.floor(sw * 0.6);
  const h2 = Math.floor(sh * 0.6);
  const xs = [0, Math.floor((sw - w2) / 2), sw - w2];
  const ys = [0, Math.floor((sh - h2) / 2), sh - h2];
  for (const y of ys) for (const x of xs) yield [x, y, w2, h2];
}

self.onmessage = async (ev: MessageEvent<DecodeRequest>) => {
  const msg = ev.data;
  if (!msg || msg.cmd !== 'decode') return;
  const { width, height, data } = msg.payload;
  try {
    // Try full frame first
    let text = tryDecodeRGBA(data, width, height);
    if (text) return (self as any).postMessage({ ok: true, text } as DecodeResponse);

    // Try downscales of full frame
    for (const s of [0.8, 0.6]) {
      const ds = downscale(data, width, height, s);
      text = tryDecodeRGBA(ds.data, ds.width, ds.height);
      if (text) return (self as any).postMessage({ ok: true, text } as DecodeResponse);
    }

    // ROI attempts center and grid
    for (const [x, y, w, h] of roiCandidates(width, height)) {
      const roi = extractROI(data, width, height, x, y, w, h);
      text = tryDecodeRGBA(roi.data, roi.width, roi.height);
      if (text) return (self as any).postMessage({ ok: true, text } as DecodeResponse);
      for (const s of [0.8, 0.6]) {
        const ds = downscale(roi.data, roi.width, roi.height, s);
        text = tryDecodeRGBA(ds.data, ds.width, ds.height);
        if (text) return (self as any).postMessage({ ok: true, text } as DecodeResponse);
      }
    }

    return (self as any).postMessage({ ok: false, error: 'No QR found' } as DecodeResponse);
  } catch (e: any) {
    return (self as any).postMessage({ ok: false, error: e?.message || 'Decode error' } as DecodeResponse);
  }
};
