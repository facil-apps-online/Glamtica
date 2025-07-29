import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Initializing superadmin-actions function");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    console.log(`superadmin-actions: Received action '${action}'`);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let responseData: any;
    let statusCode = 200;
    const startTime = performance.now();
    let metricsPath = `edge/superadmin-actions/${action}`;

    try {
      switch (action) {
        // --- Platform Actions ---
        case 'get_platforms': {
          const { data, error } = await supabaseAdmin.from('platforms').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          responseData = data;
          break;
        }
        
        case 'get_platform_by_id': {
          const { platformId } = payload;
          if (!platformId) throw new Error('platformId is required.');
          const { data, error } = await supabaseAdmin
            .from('platforms')
            .select('*')
            .eq('id', platformId)
            .single();
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'update_platform_settings': {
          const { platformId, settings } = payload;
          if (!platformId || !settings) throw new Error('platformId and settings are required.');
          const { data, error } = await supabaseAdmin
            .from('platforms')
            .update(settings)
            .eq('id', platformId)
            .select()
            .single();
          if (error) throw error;
          responseData = data;
          break;
        }

        // --- Platform Countries Actions ---
        case 'get_countries_for_platform': {
          const { platformId } = payload;
          if (!platformId) throw new Error('platformId is required.');
          const { data, error } = await supabaseAdmin
            .from('platform_countries')
            .select('country_id')
            .eq('platform_id', platformId);
          if (error) throw error;
          responseData = data.map(item => item.country_id); // Return an array of IDs
          break;
        }

        case 'assign_country_to_platform': {
          const { platformId, countryId } = payload;
          if (!platformId || !countryId) throw new Error('platformId and countryId are required.');
          const { error } = await supabaseAdmin
            .from('platform_countries')
            .insert({ platform_id: platformId, country_id: countryId });
          if (error) throw error;
          responseData = { success: true };
          break;
        }

        case 'remove_country_from_platform': {
          const { platformId, countryId } = payload;
          if (!platformId || !countryId) throw new Error('platformId and countryId are required.');
          const { error } = await supabaseAdmin
            .from('platform_countries')
            .delete()
            .eq('platform_id', platformId)
            .eq('country_id', countryId);
          if (error) throw error;
          responseData = { success: true };
          break;
        }

        // --- Tenant Actions ---
        case 'get_tenants': {
          const { searchTerm, platformId } = payload || {};
          const { data, error } = await supabaseAdmin.rpc('get_tenants', { 
            p_search_term: searchTerm,
            p_platform_id: platformId 
          });
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'get_tenant_by_id': {
          const { id } = payload;
          if (!id) throw new Error('Tenant ID is required.');
          
          const { data, error } = await supabaseAdmin
            .from('tenants')
            .select(`
              *,
              platform:platforms(id, name),
              countries(name, iso_code)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;
          responseData = data;
          break;
        }
        
        case 'set_system_owner': {
          const { tenantId, platformId } = payload || {};
          if (!tenantId || !platformId) throw new Error('tenantId and platformId are required.');
          const { error } = await supabaseAdmin.rpc('set_system_owner', {
            p_new_owner_tenant_id: tenantId,
            p_platform_id: platformId,
          });
          if (error) throw error;
          responseData = { success: true };
          break;
        }

        // --- Subscription Plan Actions ---
        case 'get_subscription_plans_by_platform': {
          const { platformId } = payload;
          if (!platformId) throw new Error('platformId is required.');
          const { data, error } = await supabaseAdmin
            .from('subscription_plans')
            .select('*')
            .eq('platform_id', platformId)
            .order('created_at', { ascending: false });
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'get_subscription_plan_by_id': {
          const { planId } = payload;
          if (!planId) throw new Error('planId is required.');
          const { data, error } = await supabaseAdmin
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single();
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'create_subscription_plan': {
          const { planData } = payload;
          if (!planData || !planData.platform_id) throw new Error('Plan data with platform_id is required.');
          const { data, error } = await supabaseAdmin
            .from('subscription_plans')
            .insert(planData)
            .select()
            .single();
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'update_subscription_plan': {
          const { planId, planData } = payload;
          if (!planId || !planData) throw new Error('planId and planData are required.');
          const { data, error } = await supabaseAdmin
            .from('subscription_plans')
            .update(planData)
            .eq('id', planId)
            .select()
            .single();
          if (error) throw error;
          responseData = data;
          break;
        }

        // --- Plan Asset Actions ---
        case 'get_plan_assets_by_platform': {
          const { platformId } = payload;
          if (!platformId) throw new Error('platformId is required.');
          const { data, error } = await supabaseAdmin
            .from('plan_assets')
            .select('*')
            .eq('platform_id', platformId)
            .order('created_at', { ascending: false });
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'create_plan_asset': {
          const { assetData } = payload;
          if (!assetData || !assetData.platform_id) throw new Error('Asset data with platform_id is required.');
          const { data, error } = await supabaseAdmin
            .from('plan_assets')
            .insert(assetData)
            .select()
            .single();
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'update_plan_asset': {
          const { assetId, assetData } = payload;
          if (!assetId || !assetData) throw new Error('assetId and assetData are required.');
          const { data, error } = await supabaseAdmin
            .from('plan_assets')
            .update(assetData)
            .eq('id', assetId)
            .select()
            .single();
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'delete_plan_asset': {
          const { assetId } = payload;
          if (!assetId) throw new Error('assetId is required.');
          const { error } = await supabaseAdmin
            .from('plan_assets')
            .delete()
            .eq('id', assetId);
          if (error) throw error;
          responseData = { success: true };
          break;
        }

        // --- Plan Asset Limit Actions ---
        case 'get_plan_asset_limits': {
          const { planId } = payload;
          if (!planId) throw new Error('planId is required.');
          const { data, error } = await supabaseAdmin
            .from('plan_asset_limits')
            .select('*, plan_assets(*)')
            .eq('plan_id', planId);
          if (error) throw error;
          responseData = data;
          break;
        }

        case 'update_plan_asset_limits': {
          const { planId, limits } = payload;
          if (!planId || !limits) throw new Error('planId and limits are required.');
          
          const upsertData = limits.map((limit: any) => ({
            plan_id: planId,
            asset_id: limit.asset_id,
            value: limit.value,
            extra_unit_price: limit.extra_unit_price || 0,
            overage_unit_price: limit.overage_unit_price || 0,
            bonus_on_extra: limit.bonus_on_extra || null,
          }));

          const { data, error } = await supabaseAdmin
            .from('plan_asset_limits')
            .upsert(upsertData, { onConflict: 'plan_id, asset_id' });

          if (error) throw error;
          responseData = { success: true, data };
          break;
        }

        // --- Tariff Actions (New Versioned Pricing) ---
        case 'get_tariffs_for_plan': {
          const { planId } = payload;
          if (!planId) throw new Error('planId is required.');
          
          const { data: tariffs, error: tariffsError } = await supabaseAdmin
            .from('price_tariffs')
            .select('*')
            .eq('subscription_plan_id', planId)
            .order('effective_date', { ascending: false });

          if (tariffsError) throw tariffsError;

          const tariffsWithDetails = await Promise.all(
            tariffs.map(async (tariff) => {
              const { data: assetPrices, error: assetPricesError } = await supabaseAdmin
                .from('tariff_asset_prices')
                .select('*')
                .eq('tariff_id', tariff.id);
              
              if (assetPricesError) throw assetPricesError;
              return { ...tariff, asset_prices: assetPrices || [] };
            })
          );

          responseData = tariffsWithDetails;
          break;
        }

        case 'schedule_new_tariff': {
          const { tariffData, assetPricesData } = payload;
          if (!tariffData || !assetPricesData) throw new Error('tariffData and assetPricesData are required.');

          const { data: newTariff, error: tariffError } = await supabaseAdmin
            .from('price_tariffs')
            .insert(tariffData)
            .select()
            .single();
          
          if (tariffError) throw tariffError;

          const pricesToInsert = assetPricesData.map((price: any) => ({
            ...price,
            tariff_id: newTariff.id,
          }));

          const { error: pricesError } = await supabaseAdmin
            .from('tariff_asset_prices')
            .insert(pricesToInsert);

          if (pricesError) {
            await supabaseAdmin.from('price_tariffs').delete().eq('id', newTariff.id);
            throw pricesError;
          }

          responseData = { success: true, tariff: newTariff };
          break;
        }

        // --- Tenant Subscription Actions ---
        case 'get_subscriptions_by_tenant': {
          const { tenantId } = payload;
          if (!tenantId) throw new Error('tenantId is required.');
          
          const { data, error } = await supabaseAdmin
            .from('tenant_subscriptions')
            .select('id, start_date, end_date, is_active, is_trial, subscription_plans:active_plan_id(name), branches(name)')
            .eq('tenant_id', tenantId)
            .order('start_date', { ascending: false });

          if (error) throw error;

          responseData = data.map((sub: any) => ({
            id: sub.id,
            start_date: sub.start_date,
            end_date: sub.end_date,
            is_active: sub.is_active,
            is_trial: sub.is_trial,
            plan_name: sub.subscription_plans?.name || 'N/A',
            branch_name: sub.branches?.name || 'General',
          }));
          break;
        }

        // --- Tenant Integrations Actions ---
        case 'get_tenant_integrations': {
          const { tenantId } = payload;
          if (!tenantId) throw new Error('tenantId is required.');
          
          // Call the RPC without the environment filter to get all integrations for the tenant
          const { data, error } = await supabaseAdmin.rpc('get_tenant_integrations', {
            p_tenant_id: tenantId
          });

          if (error) throw error;
          responseData = data;
          break;
        }

        case 'delete_tenant_integration': {
          const { integrationId } = payload;
          if (!integrationId) throw new Error('integrationId is required.');

          const { error } = await supabaseAdmin
            .from('tenant_integrations')
            .delete()
            .eq('id', integrationId);
          
          if (error) throw error;
          responseData = { success: true };
          break;
        }

        case 'get_tenant_users': {
          const { tenantId } = payload;
          if (!tenantId) throw new Error('tenantId is required.');

          const { data, error } = await supabaseAdmin.rpc('get_tenant_users', {
            target_tenant_id: tenantId
          });

          if (error) throw error;
          responseData = data;
          break;
        }

        default:
          statusCode = 400;
          throw new Error(`Invalid action: ${action}`);
      }
    } catch (error) {
      statusCode = error.code?.startsWith('PGRST') ? 400 : 500;
      console.error(`Error in action '${action}':`, error.message);
      responseData = { success: false, message: error.message };
    } finally {
      const endTime = performance.now();
      const responseTimeMs = endTime - startTime;
      
      console.log(`superadmin-actions: Action '${action}' took ${responseTimeMs.toFixed(2)}ms, status: ${statusCode}`);

      const { error: metricsError } = await supabaseAdmin.from('api_request_metrics').insert({
        path: metricsPath,
        method: 'POST',
        status_code: statusCode,
        response_time_ms: responseTimeMs
      });

      if (metricsError) {
        console.error("Failed to insert metrics:", metricsError);
      }
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
