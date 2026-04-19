'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function createEtherUser(data: {
  email: string;
  name: string;
  role: string;
  password?: string;
  org_id: string;
  document_id?: string;
  phone?: string;
  assigned_building_id?: string;
  assigned_area_id?: string;
  can_export_pdf?: boolean;
  can_create_building?: boolean;
  can_delete_users?: boolean;
  can_assign_technicians?: boolean;
  can_view_finance?: boolean;
  can_manage_compliance?: boolean;
}) {
  const adminAuthClient = createAdminClient();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      success: false,
      error: 'ALERTA DE SEGURIDAD: Falta SUPABASE_SERVICE_ROLE_KEY en el entorno (.env.local).'
    };
  }

  // 1. Crear usuario en Auth
  const { data: newUser, error: authError } = await adminAuthClient.auth.admin.createUser({
    email: data.email,
    password: data.password || 'ETHER_Temp_2026',
    email_confirm: true,
    user_metadata: { name: data.name, role: data.role }
  });

  if (authError || !newUser.user) {
    return { success: false, error: authError?.message || 'Error desconocido al crear usuario en Auth' };
  }

  const userId = newUser.user.id;

  // 2. Actualizar perfil con org, rol, documento y teléfono
  const { error: profileError } = await adminAuthClient.from('profiles').update({
    org_id:      data.org_id,
    role:        data.role,
    is_active:   true,
    document_id: data.document_id || null,
    phone:       data.phone || null,
  }).eq('id', userId);

  if (profileError) console.error('Error al actualizar profile:', profileError);

  // 3. Defaults de permisos por rol
  const isAdmin   = data.role === 'ORG_ADMIN';
  const isAnalyst = data.role === 'ANALYST';
  const isManager = data.role === 'BUILDING_MANAGER';

  await adminAuthClient.from('user_permissions').update({
    can_export_pdf:         data.can_export_pdf         ?? (isAdmin || isAnalyst),
    can_create_building:    data.can_create_building    ?? isAdmin,
    can_delete_users:       data.can_delete_users       ?? isAdmin,
    can_assign_technicians: data.can_assign_technicians ?? (isAdmin || isManager),
    can_view_finance:       data.can_view_finance       ?? (isAdmin || isAnalyst),
    can_manage_compliance:  data.can_manage_compliance  ?? (isAdmin || isAnalyst),
  }).eq('profile_id', userId);

  // 4. Asignación topográfica para técnicos
  if (data.role === 'TECHNICIAN' && data.assigned_area_id) {
    await adminAuthClient.from('technician_assignments').insert([{
      org_id:     data.org_id,
      profile_id: userId,
      area_id:    data.assigned_area_id,
    }]);
  }

  return { success: true, userId };
}

export async function createEtherUsersBulk(users: any[], org_id: string) {
  const results = [];
  for (const u of users) {
    const res = await createEtherUser({ ...u, org_id });
    results.push({ email: u.email, status: res.success ? 'OK' : 'ERROR', message: res.error });
  }
  return results;
}
