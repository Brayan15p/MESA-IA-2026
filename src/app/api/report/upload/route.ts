import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const buildingId = form.get('building_id') as string | null;

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const supabase = createAdminClient();
  const ext  = file.name.split('.').pop();
  const path = `public/qr-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error } = await supabase.storage.from('incidents-media').upload(path, buffer, { contentType: file.type });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from('incidents-media').getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
