"use client";
import { useState } from 'react';
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
  const [idNumber, setIdNumber] = useState('');
  const [relation, setRelation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setSubmitting(true);
    try {
      if (!firstName.trim() || !lastName.trim()) throw new Error('First and last name are required');
      if (!file && !photoUrl.trim()) throw new Error('Photo is required');
      const sb = getClient();
      let finalPhotoUrl = photoUrl.trim();
      if (file) {
        if (!/^image\/(jpeg|jpg|png)$/i.test(file.type)) throw new Error('Only JPEG/PNG allowed');
        if (file.size > 5 * 1024 * 1024) throw new Error('File too large (max 5MB)');
        const ext = file.type.includes('png') ? 'png' : 'jpg';
        const path = `prereg/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await sb.storage.from('public').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        const { data } = sb.storage.from('public').getPublicUrl(path);
        finalPhotoUrl = data.publicUrl;
      }
      const row: any = {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        contact_number: contact.trim() || null,
        relation: relation.trim() || null,
        id_number: idNumber.trim() || null,
        status: 'PENDING',
      };
      if (finalPhotoUrl) row.photo_url = finalPhotoUrl;
      const { error } = await sb.from('pre_registrations').insert(row);
      if (error) throw error;
      setOk('Submitted. You will be processed on-site by staff.');
      setFirstName(''); setMiddleName(''); setLastName(''); setContact(''); setIdNumber(''); setRelation(''); setPhotoUrl(''); setFile(null);
    } catch (e: any) {
      setErr(e?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>VisitTrack Pre-Registration</h1>
      <p style={{ color: '#475569', marginBottom: 16 }}>Submit basic details ahead of your visit. Final verification and approval happen on-site.</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input placeholder="First name" value={firstName} onChange={(e)=> setFirstName(e.target.value)} style={inp} />
        <input placeholder="Middle name (optional)" value={middleName} onChange={(e)=> setMiddleName(e.target.value)} style={inp} />
        <input placeholder="Last name" value={lastName} onChange={(e)=> setLastName(e.target.value)} style={inp} />
        <input placeholder="Contact number (optional)" value={contact} onChange={(e)=> setContact(e.target.value)} style={inp} />
        <input placeholder="ID number (optional)" value={idNumber} onChange={(e)=> setIdNumber(e.target.value)} style={inp} />
        <input placeholder="Relation to visitor (optional)" value={relation} onChange={(e)=> setRelation(e.target.value)} style={inp} />
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#475569' }}>Photo (JPEG/PNG, max 5MB)</div>
          <input type="file" accept="image/*" onChange={(e)=> setFile(e.target.files?.[0] || null)} />
          <div style={{ fontSize: 12, color: '#64748b' }}>If you already have a hosted image, you can paste the URL instead:</div>
          <input placeholder="Photo URL (optional)" value={photoUrl} onChange={(e)=> setPhotoUrl(e.target.value)} style={inp} />
        </div>
        {err && <div style={{ color: '#dc2626', fontSize: 14 }}>{err}</div>}
        {ok && <div style={{ color: '#16a34a', fontSize: 14 }}>{ok}</div>}
        <button disabled={submitting || !firstName.trim() || !lastName.trim() || (!file && !photoUrl.trim())} type="submit" style={btn}>
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      <div style={{ marginTop: 24, fontSize: 12, color: '#64748b' }}>
        Do not upload sensitive IDs or private data. Photos are optional and may be replaced on-site.
      </div>
    </div>
  );
}

const inp: React.CSSProperties = {
  border: '1px solid #cbd5e1', borderRadius: 6, padding: '10px 12px', outline: 'none'
};
const btn: React.CSSProperties = {
  background: '#4f46e5', color: 'white', border: '0', borderRadius: 6, padding: '10px 12px', cursor: 'pointer', opacity: 1
};
