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

    // El cliente de Supabase para realizar las operaciones con el RLS del usuario
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    switch (action) {
      // Aquí añadiremos los casos para cada acción del tenant
      case 'get_suppliers': {
        const { data, error } = await supabaseClient
          .from('suppliers')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_purchase': {
        const purchaseData = payload;
        const total_amount = purchaseData.items.reduce(
          (sum, item) => sum + (item.quantity * item.unit_cost),
          0
        );

        // Usamos supabaseAdmin para operaciones críticas
        const { data: purchase, error: purchaseError } = await supabaseAdmin
          .from('purchases')
          .insert([{
            ...purchaseData,
            tenant_id: tenantId, // Forzado por el backend
            total_amount,
          }])
          .select()
          .single();

        if (purchaseError) throw purchaseError;

        const items = purchaseData.items.map(item => ({
          purchase_id: purchase.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_cost: item.quantity * item.unit_cost,
          tenant_id: tenantId, // Forzado por el backend
        }));

        const { error: itemsError } = await supabaseAdmin.from('purchase_items').insert(items);
        if (itemsError) throw itemsError;

        // Lógica de actualización de costos (ahora segura en el backend)
        const { data: settings } = await supabaseAdmin.from('settings').select('value').eq('key', 'costing_method').single();
        const costingMethod = settings?.value || 'average';

        for (const item of purchaseData.items) {
          const { data: product, error: productError } = await supabaseAdmin
            .from('products')
            .select('cost_price, stock_quantity')
            .eq('id', item.product_id)
            .single();

          if (productError) continue;

          let newCostPrice = item.unit_cost;
          if (costingMethod === 'average' && product.cost_price > 0) {
            newCostPrice = (product.cost_price + item.unit_cost) / 2;
          }

          await supabaseAdmin.from('products').update({
            cost_price: newCostPrice,
            last_purchase_cost: item.unit_cost,
            stock_quantity: (product.stock_quantity || 0) + item.quantity,
          }).eq('id', item.product_id);
        }

        responseData = purchase;
        break;
      }

      case 'get_tenant_by_id': {
        const { tenantId: queryTenantId } = payload;
        const { data, error } = await supabaseAdmin
          .from('tenants')
          .select(`
            *,
            countries (
              name,
              iso_code
            )
          `)
          .eq('id', queryTenantId)
          .single();

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_tenant': {
        const { id, values } = payload;
        const { data, error } = await supabaseAdmin
          .from('tenants')
          .update(values)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_branch': {
        const {
          p_name,
          p_address,
          p_contact_phone,
          p_whatsapp_phone,
          p_commercial_email,
          p_website,
          p_physical_address_line1,
          p_physical_address_line2,
          p_physical_city,
          p_physical_state,
          p_physical_postal_code,
          p_latitude,
          p_longitude,
        } = payload;
        const { data, error } = await supabaseAdmin.rpc('create_branch', {
          p_tenant_id: tenantId,
          p_name,
          p_address,
          p_contact_phone,
          p_whatsapp_phone,
          p_commercial_email,
          p_website,
          p_physical_address_line1,
          p_physical_address_line2,
          p_physical_city,
          p_physical_state,
          p_physical_postal_code,
          p_latitude,
          p_longitude,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_branches': {
        const { data, error } = await supabaseAdmin.rpc('get_tenant_branches', { p_tenant_id: tenantId });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_branch': {
        const {
          p_branch_id,
          p_name,
          p_address,
          p_contact_phone,
          p_whatsapp_phone,
          p_commercial_email,
          p_website,
          p_physical_address_line1,
          p_physical_address_line2,
          p_physical_city,
          p_physical_state,
          p_physical_postal_code,
          p_latitude,
          p_longitude,
        } = payload;
        const { data, error } = await supabaseAdmin.rpc('update_branch', {
          p_tenant_id: tenantId,
          p_branch_id,
          p_name,
          p_address,
          p_contact_phone,
          p_whatsapp_phone,
          p_commercial_email,
          p_website,
          p_physical_address_line1,
          p_physical_address_line2,
          p_physical_city,
          p_physical_state,
          p_physical_postal_code,
          p_latitude,
          p_longitude,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Error in tenant-actions Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  } finally {
    const endTime = performance.now();
    const duration = endTime - startTime;
    // Registrar la métrica de rendimiento
    await supabaseAdmin.from('api_request_metrics').insert({
      endpoint: 'tenant-actions',
      action: action,
      duration_ms: duration,
      status_code: responseData ? 200 : 400,
      error_message: responseData ? null : 'An error occurred',
    });
  }
});