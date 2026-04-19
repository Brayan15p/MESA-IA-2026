import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get('building_id');
  const areaId     = searchParams.get('area_id');

  const supabase = createAdminClient();
  const result: { building?: string; area?: string } = {};

  if (buildingId) {
    const { data } = await supabase.from('buildings').select('name').eq('id', buildingId).single();
    if (data) result.building = data.name;
  }
  if (areaId) {
    const { data } = await supabase.from('areas').select('name').eq('id', areaId).single();
    if (data) result.area = data.name;
  }

  return NextResponse.json(result);
}
