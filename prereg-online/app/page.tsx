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
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center' }}>
          {/* Left spacer */}
          <div style={{ flex: 1 }} />
          {/* Centered logos with VisitTrack in the middle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/agooDJ-logo.jpg" alt="Agoo DJ Logo" style={{ height: 28 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Visittrack.png" alt="VisitTrack" style={{ height: 28 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rbjmp1-logo.jpg" alt="RBJMP1 Logo" style={{ height: 28 }} />
          </div>
          {/* Right title */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
            <div style={{ height: 20, width: 1, background: '#e2e8f0' }} />
           
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>Visitor Pre-Registration</h1>
          <p style={{ margin: '6px 0 16px', color: '#334155', fontSize: 14 }}>Provide your basic information and a recent photo.</p>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 14 }}>
            <div>
              <label style={label}>First name</label>
              <input value={firstName} onChange={(e)=> setFirstName(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Middle name (optional)</label>
              <input value={middleName} onChange={(e)=> setMiddleName(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Last name</label>
              <input value={lastName} onChange={(e)=> setLastName(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Contact number</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]+"
                value={contact}
                onChange={(e)=> {
                  const v = e.target.value.replace(/[^0-9]/g, '');
                  setContact(v);
                }}
                style={input}
              />
            </div>
            <div>
              <label style={label}>Relation to visitor</label>
              <input value={relation} onChange={(e)=> setRelation(e.target.value)} style={input} />
            </div>
            <div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={label}>Photo for Identification (JPEG/PNG, max 5MB)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={thumb}>
                    {(localPreview || photoUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={localPreview || photoUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: 12, color: '#64748b' }}>No photo</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" style={btn} onClick={() => fileInputRef.current?.click()}>Upload Photo</button>
                    <button type="button" style={btnSecondary} onClick={() => cameraInputRef.current?.click()}>Take Photo</button>
                    {(localPreview || file || photoUrl) && (
                      <button type="button" style={btnSecondary} onClick={() => { setFile(null); setPhotoUrl(''); setLocalPreview(null); }}>Clear</button>
                    )}
                  </div>
                </div>

                {/* Hidden inputs for file and camera capture */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) {
                      setFile(f);
                      setPhotoUrl('');
                      const url = URL.createObjectURL(f);
                      setLocalPreview(url);
                    }
                  }}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f) {
                      setFile(f);
                      setPhotoUrl('');
                      const url = URL.createObjectURL(f);
                      setLocalPreview(url);
                    }
                  }}
                />

                <div style={{ fontSize: 12, color: '#64748b' }}>Or paste an existing image URL:</div>
                <input
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrl}
                  onChange={(e)=> { setPhotoUrl(e.target.value); if (e.target.value) { setFile(null); setLocalPreview(null); } }}
                  style={input}
                />
              </div>
            </div>
            {err && <div style={{ color: '#b91c1c', fontSize: 14, background: '#fee2e2', border: '1px solid #fecaca', padding: '8px 10px', borderRadius: 8 }}>{err}</div>}
            {ok && <div style={{ color: '#166534', fontSize: 14, background: '#dcfce7', border: '1px solid #bbf7d0', padding: '8px 10px', borderRadius: 8 }}>{ok}</div>}
            <button disabled={
              submitting ||
              !firstName.trim() ||
              !lastName.trim() ||
              !contact.trim() ||
              !/^\d+$/.test(contact.trim()) ||
              !relation.trim() ||
              (!file && !photoUrl.trim())
            } type="submit" style={btn}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
          <div style={{ marginTop: 16, fontSize: 12, color: '#64748b' }}>
            Your information will be processed by staff on-site. Do not upload sensitive IDs or private documents.
          </div>
        </div>
      </main>
    </div>
  );
}

const input: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  color: '#0f172a',
  background: '#ffffff',
};
const label: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#475569',
  marginBottom: 6,
  fontWeight: 600,
};
const btn: React.CSSProperties = {
  appearance: 'none',
  border: '0',
  padding: '10px 14px',
  borderRadius: 8,
  background: '#4f46e5',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};
const btnSecondary: React.CSSProperties = {
  appearance: 'none',
  border: '1px solid #cbd5e1',
  padding: '10px 14px',
  borderRadius: 8,
  background: '#ffffff',
  color: '#0f172a',
  fontWeight: 600,
  cursor: 'pointer'
};
const thumb: React.CSSProperties = {
  width: 96,
  height: 96,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  background: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden'
};
