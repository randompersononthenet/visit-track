"use strict";
"use client";
import { useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon);
}

export default function Page() {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contact, setContact] = useState('');
  // ID number auto-assigned on approval in VisitTrack
  const [relation, setRelation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setSubmitting(true);
    try {
      if (!firstName.trim() || !lastName.trim()) throw new Error('First and last name are required');
      if (!contact.trim()) throw new Error('Contact number is required');
      if (!/^\d+$/.test(contact.trim())) throw new Error('Contact number must be numeric');
      if (!relation.trim()) throw new Error('Relation is required');
      if (!file && !photoUrl.trim()) throw new Error('Photo is required');
      const sb = getClient();
      let finalPhotoUrl = photoUrl.trim();
      if (file) {
        if (!/^image\/(jpeg|jpg|png)$/i.test(file.type)) throw new Error('Only JPEG/PNG allowed');
        if (file.size > 5 * 1024 * 1024) throw new Error('File too large (max 5MB)');
        const ext = file.type.includes('png') ? 'png' : 'jpg';
        const path = `prereg/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await sb.storage.from('pub').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data } = sb.storage.from('pub').getPublicUrl(path);
        finalPhotoUrl = data.publicUrl;
      }
      const row: any = {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        contact_number: contact.trim(),
        relation: relation.trim(),
        status: 'PENDING',
      };
      if (finalPhotoUrl) row.photo_url = finalPhotoUrl;
      const { error } = await sb.from('pre_registrations').insert(row);
      if (error) throw error;
      setOk('Submitted. You will be processed on-site by staff.');
      setFirstName(''); setMiddleName(''); setLastName(''); setContact(''); setRelation(''); setPhotoUrl(''); setFile(null); setLocalPreview(null);
    } catch (e: any) {
      setErr(e?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }

  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex items-center gap-4 md:gap-8 justify-center">
            {/* Use larger logos and flex alignment */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/agooDJ-logo.jpg" alt="Agoo DJ Logo" className="h-10 md:h-14 w-auto object-contain" />
            <a href="/dashboard" title="Go to Dashboard" className="block transition-transform hover:scale-105 active:scale-95">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Visittrack.png" alt="VisitTrack" className="h-16 md:h-24 w-auto object-contain" />
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rbjmp1-logo.jpg" alt="RBJMP1 Logo" className="h-10 md:h-14 w-auto object-contain" />
          </div>
          <div className="flex-1"></div>
        </div>
      </header>

      <main className="w-full max-w-lg mx-auto p-4 md:p-6 flex-1">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-6 py-5 border-b border-slate-100">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 text-center">Visitor Pre-Registration</h1>
            <p className="mt-2 text-sm text-slate-500 text-center">
              Provide your details below to speed up your visit entry.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 bg-white"
                    placeholder="Juan"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Middle Name <span className="font-normal text-slate-400">(Optional)</span></label>
                  <input
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 bg-white"
                    placeholder="Dela"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 bg-white"
                  placeholder="Cruz"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact Number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  maxLength={11}
                  value={contact}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                    setContact(v);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 bg-white"
                  placeholder="09123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Relation to Visitor/Purpose</label>
                <input
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-slate-900 bg-white"
                  placeholder="e.g. Relative, Official Business"
                />
              </div>

              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Photo for Identification <span className="font-normal text-slate-400">(Max 5MB)</span></label>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {(localPreview || photoUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={localPreview || photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xs text-slate-400 text-center px-1">No<br />Photo</div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Take Photo
                    </button>
                    {(localPreview || file || photoUrl) && (
                      <button
                        type="button"
                        onClick={() => { setFile(null); setPhotoUrl(''); setLocalPreview(null); }}
                        className="px-4 py-2 text-rose-600 hover:text-rose-700 text-sm font-medium transition-colors ml-auto sm:ml-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Hidden inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) {
                      setFile(f);
                      setPhotoUrl('');
                      setLocalPreview(URL.createObjectURL(f));
                    }
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) {
                      setFile(f);
                      setPhotoUrl('');
                      setLocalPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>

              {err && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-sm text-rose-700 animate-in fade-in slide-in-from-top-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{err}</span>
                </div>
              )}

              {ok && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-sm text-emerald-800 animate-in zoom-in-95">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="font-semibold">Submission Successful</h3>
                    <p className="mt-1 text-emerald-700">{ok}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !firstName.trim() || !lastName.trim() || !(contact.trim().length === 11 && /^\d+$/.test(contact.trim())) || !relation.trim() || (!file && !photoUrl.trim())}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Registration'
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Your information will be securely processed by on-site staff.
              <br />Please avoid uploading sensitive ID documents unless requested.
            </p>
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} VisitTrack System. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
