import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export type PrintableIdCardProps = {
  type: 'visitor' | 'personnel';
  fullName: string;
  secondaryLabel?: string; // e.g., ID # or role title
  qrValue: string;
  issuedAt?: string; // ISO string
  photoUrl?: string; // optional portrait
};

// Card uses CR80 aspect; on screen we use a fixed px size; print CSS will scale as needed.
// Three logo placeholders are shown in the header (left, center, right).
export const PrintableIdCard = React.forwardRef<HTMLDivElement, PrintableIdCardProps>(
  ({ type, fullName, secondaryLabel, qrValue, issuedAt, photoUrl }, ref) => {
    const issued = issuedAt ? new Date(issuedAt) : new Date();
    const ORIGIN_BASE = (typeof window !== 'undefined') ? window.location.origin : 'http://localhost:4000';
    const resolvedPhoto = photoUrl && !/^https?:\/\//i.test(photoUrl) ? `${ORIGIN_BASE}${photoUrl}` : photoUrl;
    return (
      <div ref={ref} className="print-area w-[504px] h-[318px] bg-white text-slate-900 shadow rounded border border-slate-200 p-3 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src="/rbjmp1-logo.jpg" className="w-full h-full object-contain" />
          </div>
          <div className="text-center">
            <div className="text-xs uppercase tracking-wide text-slate-600">VisitTrack</div>
            <div className="text-sm font-semibold">BJMP Agoo District Jail</div>
          </div>
          <div className="w-10 h-10 rounded overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src="/agooDJ-logo.jpg" className="w-full h-full object-contain" />
          </div>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-3">
          <div className="col-span-1 flex flex-col items-center justify-start">
            <div className="w-28 h-28 rounded bg-slate-100 overflow-hidden border border-slate-200">
              {resolvedPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="ID Photo" src={resolvedPhoto} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">Photo</div>
              )}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-wide text-slate-500">{type}</div>
          </div>
          <div className="col-span-2 flex flex-col">
            <div className="text-base font-semibold leading-tight">{fullName}</div>
            {secondaryLabel && (
              <div className="text-xs text-slate-600 mb-3">{secondaryLabel}</div>
            )}
            <div className="mt-auto flex items-end justify-between">
              <div>
                <div className="text-[10px] text-slate-500">Issued</div>
                <div className="text-xs">{issued.toLocaleDateString()} {issued.toLocaleTimeString()}</div>
              </div>
              <div className="bg-white p-1 rounded border border-slate-200">
                <QRCodeSVG value={qrValue} size={84} />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src="/rbjmp1-logo.jpg" className="w-full h-full object-contain" />
          </div>
          <div className="text-[10px] text-slate-500">Official Use Only</div>
          <div className="w-10 h-10 rounded overflow-hidden bg-white border border-slate-200 flex items-center justify-center">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img src="/agooDJ-logo.jpg" className="w-full h-full object-contain" />
          </div>
        </div>
      </div>
    );
  }
);

PrintableIdCard.displayName = 'PrintableIdCard';
