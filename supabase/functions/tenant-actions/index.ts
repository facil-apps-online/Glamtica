import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { action, payload } = await req.json();
  let responseData: any = null;
  let status = 200;
  const startTime = performance.now();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization Header');
    }
    const token = authHeader.replace('Bearer ', '');
    const decodedToken: any = jwtDecode(token);

    const userId = decodedToken.sub;
    const tenantId = decodedToken.app_metadata?.assignments?.[0]?.tenant_id;

    if (!userId || !tenantId) {
      throw new Error('User ID or Tenant ID not found in JWT.');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    switch (action) {
      // --- CLIENT ACTIONS ---
      case 'get_clients_by_branch': {
        const { branchId } = payload;
        if (!branchId) throw new Error('Branch ID is required.');

        let query = supabaseAdmin
          .from('clients')
          .select(`
            *,
            client_branches(branches(id, name))
          `)
          .eq('tenant_id', tenantId);

        if (branchId !== 'all') {
          const { data: clientIds, error: idsError } = await supabaseAdmin
            .from('client_branches')
            .select('client_id')
            .eq('branch_id', branchId)
            .eq('tenant_id', tenantId);

          if (idsError) throw idsError;
          
          const ids = clientIds.map(d => d.client_id);
          query = query.in('id', ids);
        }
        
        const { data, error } = await query.order('name');

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_sub_clients': {
        const { clientId } = payload;
        if (!clientId) throw new Error('Client ID is required.');

        const { data, error } = await supabaseAdmin
          .from('clients')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('parent_client_id', clientId)
          .order('name');

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_client_details': {
        const { clientId } = payload;
        if (!clientId) throw new Error('Client ID is required.');

        const { data: clientData, error: clientError } = await supabaseAdmin
          .from('clients')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('id', clientId)
          .single();

        if (clientError) throw clientError;

        const { data: branchData, error: branchError } = await supabaseAdmin
          .from('client_branches')
          .select('branches(id, name)')
          .eq('tenant_id', tenantId)
          .eq('client_id', clientId);

        if (branchError) throw branchError;

        responseData = {
          ...clientData,
          branches: branchData.map((b: any) => b.branches)
        };
        break;
      }

      case 'create_client': {
        const { clientData, branchIds } = payload;
        if (!clientData || !branchIds || branchIds.length === 0) {
          throw new Error('Client data and at least one branch ID are required.');
        }

        const { data: newClient, error: clientError } = await supabaseAdmin
          .from('clients')
          .insert({ ...clientData, tenant_id: tenantId })
          .select()
          .single();

        if (clientError) throw clientError;

        const branchAssignments = branchIds.map((branchId: string) => ({
          client_id: newClient.id,
          branch_id: branchId,
          tenant_id: tenantId,
        }));

        const { error: branchError } = await supabaseAdmin
          .from('client_branches')
          .insert(branchAssignments);

        if (branchError) {
          // Rollback client creation if branch assignment fails
          await supabaseAdmin.from('clients').delete().eq('id', newClient.id);
          throw branchError;
        }

        responseData = newClient;
        break;
      }

      case 'update_client': {
        const { clientId, updates } = payload;
        if (!clientId || !updates) throw new Error('Client ID and updates are required.');

        const { data, error } = await supabaseAdmin
          .from('clients')
          .update(updates)
          .eq('id', clientId)
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'delete_client': {
        const { clientId } = payload;
        if (!clientId) throw new Error('Client ID is required.');

        // The client_branches entries are deleted by ON DELETE CASCADE
        const { error } = await supabaseAdmin
          .from('clients')
          .delete()
          .eq('id', clientId)
          .eq('tenant_id', tenantId);

        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'assign_client_to_branch': {
        const { clientId, branchId } = payload;
        if (!clientId || !branchId) throw new Error('Client ID and Branch ID are required.');

        const { data, error } = await supabaseAdmin
          .from('client_branches')
          .insert({
            client_id: clientId,
            branch_id: branchId,
            tenant_id: tenantId,
          })
          .select()
          .single();

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'unassign_client_from_branch': {
        const { clientId, branchId } = payload;
        if (!clientId || !branchId) throw new Error('Client ID and Branch ID are required.');

        const { error } = await supabaseAdmin
          .from('client_branches')
          .delete()
          .eq('client_id', clientId)
          .eq('branch_id', branchId)
          .eq('tenant_id', tenantId);

        if (error) throw error;
        responseData = { success: true };
        break;
      }
      
      // --- OTHER ACTIONS ---
      case 'get_service_categories': {
        const { data, error } = await supabaseAdmin
          .from('service_categories')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_product_categories': {
        const { data, error } = await supabaseAdmin
          .from('product_categories')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_service_category': {
        const { name, description } = payload;
        const { data, error } = await supabaseAdmin
          .from('service_categories')
          .insert([{ tenant_id: tenantId, name, description, is_active: true }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_product_category': {
        const { name, description } = payload;
        const { data, error } = await supabaseAdmin
          .from('product_categories')
          .insert([{ tenant_id: tenantId, name, description, is_active: true }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_service_category': {
        const { id, name, description } = payload;
        const { data, error } = await supabaseAdmin
          .from('service_categories')
          .update({ name, description })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_product_category': {
        const { id, name, description } = payload;
        const { data, error } = await supabaseAdmin
          .from('product_categories')
          .update({ name, description })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'delete_service_category': {
        const { id } = payload;
        const { error } = await supabaseAdmin
          .from('service_categories')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'delete_product_category': {
        const { id } = payload;
        const { error } = await supabaseAdmin
          .from('product_categories')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'toggle_service_category_status': {
        const { id, is_active } = payload;
        const { data, error } = await supabaseAdmin
          .from('service_categories')
          .update({ is_active })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'toggle_product_category_status': {
        const { id, is_active } = payload;
        const { data, error } = await supabaseAdmin
          .from('product_categories')
          .update({ is_active })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_brands': {
        const { data, error } = await supabaseAdmin
          .from('product_brands')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_brand': {
        const { name, description } = payload;
        const { data, error } = await supabaseAdmin
          .from('product_brands')
          .insert([{ tenant_id: tenantId, name, description }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_brand': {
        const { id, name, description, is_active } = payload;
        const { data, error } = await supabaseAdmin
          .from('product_brands')
          .update({ name, description, is_active })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'delete_brand': {
        const { id } = payload;
        const { error } = await supabaseAdmin
          .from('product_brands')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'toggle_brand_status': {
        const { id, is_active } = payload;
        const { data, error } = await supabaseAdmin
          .from('product_brands')
          .update({ is_active })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_tax_types': {
        const { data, error } = await supabaseAdmin
          .from('tax_types')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_tax_type': {
        const { name, rate, is_percentage, is_active } = payload;
        const { data, error } = await supabaseAdmin
          .from('tax_types')
          .insert([{ tenant_id: tenantId, name, rate, is_percentage, is_active }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_tax_type': {
        const { id, name, rate, is_percentage, is_active } = payload;
        const { data, error } = await supabaseAdmin
          .from('tax_types')
          .update({ name, rate, is_percentage, is_active })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'delete_tax_type': {
        const { id } = payload;
        const { error } = await supabaseAdmin
          .from('tax_types')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'add_product_tax_type': {
        const { product_id, tax_type_id } = payload;
        const { data, error } = await supabaseAdmin
          .from('product_tax_types')
          .insert([{ tenant_id: tenantId, product_id, tax_type_id }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_product_tax_types': {
        const { product_id } = payload;
        const { data, error } = await supabaseAdmin
          .from('product_tax_types')
          .select('*, tax_types(name, rate, is_percentage)')
          .eq('tenant_id', tenantId)
          .eq('product_id', product_id);
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'remove_product_tax_type': {
        const { id } = payload;
        const { error } = await supabaseAdmin
          .from('product_tax_types')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'add_service_tax_type': {
        const { service_id, tax_type_id } = payload;
        const { data, error } = await supabaseAdmin
          .from('service_tax_types')
          .insert([{ tenant_id: tenantId, service_id, tax_type_id }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_service_tax_types': {
        const { service_id } = payload;
        const { data, error } = await supabaseAdmin
          .from('service_tax_types')
          .select('*, tax_types(name, rate, is_percentage)')
          .eq('tenant_id', tenantId)
          .eq('service_id', service_id);
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'remove_service_tax_type': {
        const { id } = payload;
        const { error } = await supabaseAdmin
          .from('service_tax_types')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'get_branches': {
        const { tenantId: requestedTenantId } = payload;
        if (!requestedTenantId) {
          throw new Error('Tenant ID is required for get_branches.');
        }
        const userAssignments = decodedToken.app_metadata?.assignments || [];
        const hasAccess = userAssignments.some( (assignment: any) => assignment.tenant_id === requestedTenantId);
        if (!hasAccess) {
          throw new Error('Acceso denegado: El usuario no tiene asignaciones para el tenant solicitado.');
        }
        const { data, error } = await supabaseAdmin.rpc('get_tenant_branches', { p_tenant_id: requestedTenantId });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_users_for_tenant': {
        const { tenantId: requestedTenantId } = payload;
        if (!requestedTenantId) throw new Error('Tenant ID is required for get_users_for_tenant.');
        const userAssignments = decodedToken.app_metadata?.assignments || [];
        const hasAccess = userAssignments.some( (assignment: any) => assignment.tenant_id === requestedTenantId);
        if (!hasAccess) {
          throw new Error('Acceso denegado: El usuario no tiene asignaciones para el tenant solicitado.');
        }
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) throw usersError;
        const allUsers = usersData.users;
        const tenantUsers = allUsers.filter(user => 
          user.app_metadata?.assignments?.some((assignment: any) => assignment.tenant_id === requestedTenantId)
        );
        const [{ data: roles, error: rolesError }, { data: branches, error: branchesError }] = await Promise.all([
          supabaseAdmin.from('roles').select('id, name, display_name'),
          supabaseAdmin.from('branches').select('id, name'),
        ]);
        if (rolesError) console.error("Error fetching roles:", rolesError.message);
        if (branchesError) console.error("Error fetching branches:", branchesError.message);
        responseData = tenantUsers.flatMap(user => {
          const assignmentsForTenant = user.app_metadata?.assignments?.filter((assignment: any) => assignment.tenant_id === requestedTenantId) || [];
          return assignmentsForTenant.map((assignment: any) => {
            const role = roles?.find((r: any) => r.id === assignment.role_id);
            const branch = branches?.find((b: any) => b.id === assignment.branch_id);
            return {
              assignment_id: assignment.assignment_id,
              user_id: user.id,
              email: user.user_metadata?.real_email || user.user_metadata?.email || user.email || '',
              first_name: user.user_metadata?.first_name || null,
              last_name: user.user_metadata?.last_name || null,
              role_id: assignment.role_id || null,
              role_name: role?.name || null,
              role_display_name: role?.display_name || null,
              branch_id: assignment.branch_id || null,
              branch_name: branch?.name || null,
              status: assignment.status,
            };
          });
        });
        break;
      }

      case 'get_tenant_settings': {
        const { tenantId: queryTenantId } = payload;
        if (!queryTenantId) throw new Error('Tenant ID is required for get_tenant_settings.');
        const { data, error } = await supabaseAdmin
          .from('tenant_settings')
          .select('settings_data')
          .eq('tenant_id', queryTenantId)
          .single();
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        responseData = { settings_data: data?.settings_data || {} };
        break;
      }

      case 'update_tenant_settings': {
        const { tenantId: queryTenantId, newSettings } = payload;
        if (!queryTenantId) throw new Error('Tenant ID is required for update_tenant_settings.');
        if (!newSettings) throw new Error('New settings are required for update_tenant_settings.');
        const { data: currentSettings, error: fetchError } = await supabaseAdmin
          .from('tenant_settings')
          .select('settings_data')
          .eq('tenant_id', queryTenantId)
          .single();
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
        const mergedSettings = { ...currentSettings?.settings_data, ...newSettings };
        const { data, error } = await supabaseAdmin
          .from('tenant_settings')
          .upsert({ tenant_id: queryTenantId, settings_data: mergedSettings }, { onConflict: 'tenant_id' })
          .select('settings_data')
          .single();
        if (error) throw error;
        responseData = { settings_data: data?.settings_data };
        break;
      }

      case 'get_suppliers': {
        const { data, error } = await supabaseAdmin
          .from('suppliers')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_supplier': {
        const { name, identification_type, identification_number, address, phone, email } = payload;
        const { data, error } = await supabaseAdmin
          .from('suppliers')
          .insert([{ 
            tenant_id: tenantId, 
            name, 
            identification_type, 
            identification_number, 
            address, 
            phone, 
            email,
            is_active: true 
          }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_supplier': {
        const { id, ...updates } = payload;
        const { data, error } = await supabaseAdmin
          .from('suppliers')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'toggle_supplier_status': {
        const { id, is_active } = payload;
        const { data, error } = await supabaseAdmin
          .from('suppliers')
          .update({ is_active })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_supplier_products': {
        const { supplierId } = payload;
        let query = supabaseAdmin
          .from('supplier_products')
          .select('*, products(name, description, price, cost_price, stock_quantity, min_stock, is_active), suppliers(name, identification_number)');
        query = query.eq('tenant_id', tenantId);
        if (supplierId) {
          query = query.eq('supplier_id', supplierId);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'add_supplier_product': {
        const { supplier_id, product_id, supplier_price, branch_id } = payload;
        if (!supplier_id || !product_id || supplier_price === undefined || !branch_id) {
          throw new Error('Supplier ID, Product ID, Supplier Price, and Branch ID are required.');
        }
        const { data, error } = await supabaseAdmin
          .from('supplier_products')
          .insert([{ 
            tenant_id: tenantId, 
            supplier_id, 
            product_id, 
            supplier_price,
            branch_id,
            is_active: true
          }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_supplier_product': {
        const { id, supplier_price, is_active } = payload;
        if (!id || supplier_price === undefined) {
          throw new Error('Supplier Product ID and Supplier Price are required.');
        }
        const updates: { supplier_price: number; is_active?: boolean } = { supplier_price };
        if (is_active !== undefined) {
          updates.is_active = is_active;
        }
        const { data, error } = await supabaseAdmin
          .from('supplier_products')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'toggle_supplier_product_status': {
        const { id, is_active } = payload;
        if (!id || is_active === undefined) {
          throw new Error('Supplier Product ID and active status are required.');
        }
        const { data, error } = await supabaseAdmin
          .from('supplier_products')
          .update({ is_active })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_master_services': {
        const { data, error } = await supabaseAdmin
          .from('services')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_master_products': {
        const { data, error } = await supabaseAdmin
          .from('products')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_master_service': {
        const { serviceData } = payload;
        const { data, error } = await supabaseAdmin
          .from('services')
          .insert([{ ...serviceData, tenant_id: tenantId }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_master_product': {
        const { productData } = payload;
        const { data, error } = await supabaseAdmin
          .from('products')
          .insert([{ ...productData, tenant_id: tenantId }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_master_service': {
        const { id, updates } = payload;
        const { data, error } = await supabaseAdmin
          .from('services')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_master_product': {
        const { id, updates } = payload;
        const { data, error } = await supabaseAdmin
          .from('products')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_branch_services': {
        const { branchId } = payload;
        if (!branchId) throw new Error('Branch ID is required.');
        const { data, error } = await supabaseAdmin
          .from('branch_services')
          .select(`
            *,
            service:service_id (*)
          `)
          .eq('tenant_id', tenantId)
          .eq('branch_id', branchId);
        if (error) throw error;
        responseData = data.map((item: any) => ({
          id: item.service_id, // ID del servicio maestro
          branch_service_id: item.id, // ID de la relación branch_services
          name: item.service?.name, // Nombre del servicio maestro
          description: item.service?.description, // Descripción del servicio maestro
          duration_minutes: item.service?.duration_minutes, // Duración del servicio maestro
          selling_price: item.selling_price, // Precio de venta en esta sucursal
          is_branch_active: item.is_active, // Estado activo en esta sucursal
        }));
        break;
      }

      case 'get_branch_products': {
        const { branchId } = payload;
        if (!branchId) throw new Error('Branch ID is required.');
        const { data, error } = await supabaseAdmin
          .from('branch_products')
          .select(`
            *,
            product:product_id (*)
          `)
          .eq('tenant_id', tenantId)
          .eq('branch_id', branchId);
        if (error) throw error;
        responseData = data.map((item: any) => ({
          ...item.product,
          ...item,
          id: item.product_id,
          branch_product_id: item.id,
          is_branch_active: item.is_active,
        }));
        break;
      }

      case 'assign_service_to_branch': {
        const { service_id, branch_ids, defaults } = payload;
        if (!service_id || !branch_ids || !defaults) throw new Error('Missing required payload for assignment.');
        const assignments = branch_ids.map((branch_id: string) => ({
          service_id,
          branch_id,
          tenant_id: tenantId,
          selling_price: defaults.selling_price,
          duration_minutes: defaults.duration_minutes,
          is_active: defaults.is_active ?? true,
        }));
        const { data, error } = await supabaseAdmin.from('branch_services').insert(assignments).select();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'assign_product_to_branch': {
        const { product_id, branch_ids, defaults } = payload;
        if (!product_id || !branch_ids || !defaults) throw new Error('Missing required payload for assignment.');
        const assignments = branch_ids.map((branch_id: string) => ({
          product_id,
          branch_id,
          tenant_id: tenantId,
          selling_price: defaults.selling_price,
          stock_quantity: defaults.stock_quantity,
          is_active: defaults.is_active ?? true,
        }));
        const { data, error } = await supabaseAdmin.from('branch_products').insert(assignments).select();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_branch_service': {
        const { id, updates } = payload;
        const { data, error } = await supabaseAdmin
          .from('branch_services')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_branch_product': {
        const { id, updates } = payload;
        const { data, error } = await supabaseAdmin
          .from('branch_products')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'remove_service_from_branch': {
        const { branch_service_id } = payload;
        const { error } = await supabaseAdmin
          .from('branch_services')
          .delete()
          .eq('id', branch_service_id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'remove_product_from_branch': {
        const { branch_product_id } = payload;
        const { error } = await supabaseAdmin
          .from('branch_products')
          .delete()
          .eq('id', branch_product_id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'get_service_branch_prices': {
        const { serviceId } = payload;
        if (!serviceId) throw new Error('Service ID is required for get_service_branch_prices.');

        const { data, error } = await supabaseAdmin
          .from('branch_services')
          .select(`
            id,
            branch_id,
            selling_price,
            duration_minutes,
            is_active,
            branches(name)
          `)
          .eq('tenant_id', tenantId)
          .eq('service_id', serviceId);

        if (error) throw error;
        responseData = data.map((item: any) => ({
          branch_service_id: item.id,
          branch_id: item.branch_id,
          branch_name: item.branches?.name,
          selling_price: item.selling_price,
          duration_minutes: item.duration_minutes,
          is_active: item.is_active,
        }));
        break;
      }

      case 'get_product_branch_prices': {
        const { productId } = payload;
        if (!productId) throw new Error('Product ID is required for get_product_branch_prices.');

        const { data, error } = await supabaseAdmin
          .from('branch_products')
          .select(`
            id,
            branch_id,
            selling_price,
            stock_quantity,
            is_active,
            branches(name)
          `)
          .eq('tenant_id', tenantId)
          .eq('product_id', productId);

        if (error) throw error;
        responseData = data.map((item: any) => ({
          branch_product_id: item.id,
          branch_id: item.branch_id,
          branch_name: item.branches?.name,
          selling_price: item.selling_price,
          stock_quantity: item.stock_quantity,
          is_active: item.is_active,
        }));
        break;
      }

      case 'get_client_settings': {
        const { data, error } = await supabaseAdmin
          .from('tenant_client_settings')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();

        if (error && error.code !== 'PGRST116') { // Ignorar si no se encuentra la fila
          throw error;
        }
        responseData = data;
        break;
      }

      case 'update_client_settings': {
        const { settings } = payload;
        if (!settings) throw new Error('Settings payload is required.');

        const { data, error } = await supabaseAdmin
          .from('tenant_client_settings')
          .upsert({ ...settings, tenant_id: tenantId }, { onConflict: 'tenant_id' })
          .select()
          .single();

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_document_templates': {
        const { data, error } = await supabaseAdmin
          .from('client_document_templates')
          .select('id, name, description, schema, is_active, version')
          .eq('tenant_id', tenantId)
          .order('name');

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_document_template': {
        const { name, description, schema } = payload;
        if (!name) throw new Error('Template name is required.');

        const { data, error } = await supabaseAdmin
          .from('client_document_templates')
          .insert([{ tenant_id: tenantId, name, description, schema: schema || {} }])
          .select();

        if (error) throw error;
        responseData = data?.[0]; // Devolver el primer (y único) objeto creado
        break;
      }

      case 'update_document_template': {
        const { id, updates } = payload;
        if (!id || !updates) throw new Error('Template ID and updates are required.');

        const { data, error } = await supabaseAdmin
          .from('client_document_templates')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select();

        if (error) throw error;
        responseData = data?.[0]; // Devolver el primer (y único) objeto actualizado
        break;
      }

      case 'toggle_document_template_status': {
        const { id, is_active } = payload;
        if (id === undefined || is_active === undefined) throw new Error('Template ID and status are required.');

        const { data, error } = await supabaseAdmin
          .from('client_document_templates')
          .update({ is_active })
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'save_client_document_instance': {
        const { client_id, template_id, data: formData } = payload;
        if (!client_id || !template_id || !formData) throw new Error('Client ID, Template ID, and form data are required.');

        const { data, error } = await supabaseAdmin
          .from('client_document_instances')
          .insert([{ tenant_id: tenantId, client_id, template_id, data: formData }])
          .select();

        if (error) throw error;
        responseData = data?.[0];
        break;
      }

      case 'get_client_document_instances': {
        const { client_id } = payload;
        if (!client_id) throw new Error('Client ID is required.');

        const { data, error } = await supabaseAdmin
          .from('client_document_instances')
          .select('*, template:template_id(name, description, version)')
          .eq('tenant_id', tenantId)
          .eq('client_id', client_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'save_client_consent_record': {
        const { client_id, consent_type, signature_data, metadata } = payload;
        if (!client_id || !consent_type) throw new Error('Client ID and consent type are required.');

        const { data, error } = await supabaseAdmin
          .from('client_consent_records')
          .insert([{ tenant_id: tenantId, client_id, consent_type, signature_data, metadata }])
          .select();

        if (error) throw error;
        responseData = data?.[0];
        break;
      }

      case 'get_client_consent_records': {
        const { client_id } = payload;
        if (!client_id) throw new Error('Client ID is required.');

        const { data, error } = await supabaseAdmin
          .from('client_consent_records')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('client_id', client_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        responseData = data;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
    });
  } catch (error) {
    status = 400;
    console.error("Error in tenant-actions Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  } finally {
    const endTime = performance.now();
    const duration = endTime - startTime;
    await supabaseAdmin.from('api_request_metrics').insert({
      endpoint: 'tenant-actions',
      action: action,
      duration_ms: duration,
      status_code: status,
      error_message: status === 400 ? 'An error occurred' : null,
    });
  }
});