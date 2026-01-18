export type PreregRow = {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  contact_number?: string | null;
  purpose_of_visit?: string | null;
  relation?: string | null;
  id_number?: string | null;
  photo_url?: string | null;
  created_at: string;
  status: 'PENDING' | 'IMPORTED' | 'REJECTED';
};

const url = process.env.PREREG_SUPABASE_URL || '';
const serviceKey = process.env.PREREG_SUPABASE_SERVICE_ROLE_KEY || '';

function headers() {
  return {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

export async function fetchPending(limit = 100): Promise<PreregRow[]> {
  if (!url || !serviceKey) throw new Error('Prereg Supabase is not configured');
  const res = await fetch(`${url}/rest/v1/pre_registrations?status=eq.PENDING&select=*&order=created_at.asc&limit=${limit}`, {
    headers: headers(),
  });
  if (!res.ok) throw new Error(`Failed to fetch prereg: ${res.status}`);
  return await res.json() as PreregRow[];
}

export async function markImported(id: string): Promise<void> {
  if (!url || !serviceKey) throw new Error('Prereg Supabase is not configured');
  const res = await fetch(`${url}/rest/v1/pre_registrations?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status: 'IMPORTED' }),
  });
  if (!res.ok) throw new Error(`Failed to mark imported: ${res.status}`);
}

export async function markRejected(id: string): Promise<void> {
  if (!url || !serviceKey) throw new Error('Prereg Supabase is not configured');
  const res = await fetch(`${url}/rest/v1/pre_registrations?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status: 'REJECTED' }),
  });
  if (!res.ok) throw new Error(`Failed to mark rejected: ${res.status}`);
}
