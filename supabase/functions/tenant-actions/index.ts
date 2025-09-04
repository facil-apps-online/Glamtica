import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { jwtDecode } from "https://esm.sh/jwt-decode@4.0.0";

const callRpc = async (supabaseAdmin: any, rpcName: string, ...params: any[]) => {
  console.log(`Calling RPC: ${rpcName} with params: ${JSON.stringify(params)}`);
  const { data, error } = await supabaseAdmin.rpc(rpcName, ...params);
  console.log(`RPC ${rpcName} returned - data: ${JSON.stringify(data)}, error: ${JSON.stringify(error)}`);

  if (error) {
    // If error is an empty object or doesn't have a message, create a new Error
    if (typeof error === 'object' && error !== null && !('message' in error)) {
      throw new Error(`RPC Error for ${rpcName}: ${JSON.stringify(error)}`);
    }
    throw error; // Re-throw the original error if it has a message
  }
  return data;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log("SUPABASE_URL:", Deno.env.get('SUPABASE_URL') ? "Loaded" : "MISSING/EMPTY");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ? "Loaded" : "MISSING/EMPTY");

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  console.log("After supabaseAdmin createClient. supabaseAdmin is:", supabaseAdmin ? "VALID" : "NULL/UNDEFINED");

  // --- DIAGNOSTIC TEST REMOVED ---

  const { action, payload } = await req.json();
  console.log("Received action:", action);
  console.log("Received payload:", JSON.stringify(payload, null, 2));
  let responseData: any = null;
  let status = 200;
  const startTime = performance.now();

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase Admin client failed to initialize.');
    }
    console.log("Inside try block");
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization Header');
    }
    const token = authHeader.replace('Bearer ', '');
    const decodedToken: any = jwtDecode(token);

    const userId = decodedToken.sub;
    const tenantId = decodedToken.app_metadata?.assignments?.[0]?.tenant_id;

    console.log("Decoded Token:", JSON.stringify(decodedToken, null, 2));
    console.log("UserId:", userId, "TenantId:", tenantId);

    if (!userId) {
      throw new Error('User ID not found in JWT.');
    }

    if (!tenantId) {
      throw new Error('Tenant ID not found in JWT app_metadata.assignments[0].tenant_id.');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    console.log("After supabaseClient createClient");

    switch (action) {
      // --- CLIENT ACTIONS ---
      case 'get_clients_by_branch': {
        const { branchId, searchTerm, showInactive } = payload;
        if (!branchId) throw new Error('Branch ID is required.');

        const { data, error } = await supabaseAdmin.rpc('search_clients', {
          p_tenant_id: tenantId,
          p_branch_id: branchId,
          p_search_term: searchTerm,
          p_show_inactive: showInactive,
        });

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

      case 'get-dashboard-stats': {
        const { p_tenant_id, p_branch_id, p_user_id } = payload;
        const { data, error } = await supabaseAdmin.rpc('get_dashboard_stats', {
          p_tenant_id,
          p_branch_id,
          p_user_id,
        });
        if (error) throw error;
        responseData = data;
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

      case 'create_supplier': {
        const { name, identification_type, identification_number, address, phone, email, branch_ids } = payload;
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
            branch_ids, // Añadido
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
          .update(updates) // updates ya contiene branch_ids si se envió
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'add_supplier_product': {
        const { supplier_id, product_id, supplier_price } = payload;
        if (!supplier_id || !product_id || supplier_price === undefined) {
          throw new Error('Supplier ID, Product ID, and Supplier Price are required.');
        }
        const { data, error } = await supabaseAdmin
          .from('supplier_products')
          .insert([{ 
            tenant_id: tenantId, 
            supplier_id, 
            product_id, 
            supplier_price,
            is_active: true
          }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_purchase': {
        const { branch_id, supplier_id, purchase_date, total_amount, status, notes, items } = payload;

        if (!branch_id || !items || items.length === 0) {
          throw new Error('Branch ID and at least one item are required.');
        }

        // Fetch tenant settings for costing method
        const { data: tenantSettingsData, error: settingsError } = await supabaseAdmin
          .from('tenant_settings')
          .select('settings_data')
          .eq('tenant_id', tenantId)
          .single();

        if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw settingsError;
        }

        const costingMethod = tenantSettingsData?.settings_data?.costing_method || 'last_purchase'; // Default to last_purchase

        // Validación de sucursal del proveedor
        if (supplier_id) {
          const { data: supplier, error: supplierError } = await supabaseAdmin
            .from('suppliers')
            .select('branch_ids')
            .eq('id', supplier_id)
            .single();

          if (supplierError) throw new Error('Error al verificar el proveedor.');
          if (!supplier.branch_ids || !supplier.branch_ids.includes(branch_id)) {
            throw new Error('La sucursal de la compra no está permitida para este proveedor.');
          }
        }

        // 1. Create the purchase record
        const { data: purchase, error: purchaseError } = await supabaseAdmin
          .from('purchases')
          .insert({
            tenant_id: tenantId,
            branch_id,
            supplier_id,
            purchase_date,
            total_amount,
            status,
            notes,
          })
          .select()
          .single();

        if (purchaseError) throw purchaseError;

        // 2. Create purchase items
        const purchaseItems = items.map((item: any) => ({
          purchase_id: purchase.id,
          product_id: item.product_id,
          quantity: item.quantity,
          cost_price: item.cost_price,
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('purchase_items')
          .insert(purchaseItems);

        if (itemsError) {
          // Rollback purchase creation
          await supabaseAdmin.from('purchases').delete().eq('id', purchase.id);
          throw itemsError;
        }

        // 3. Update stock and cost price for each product in the branch
        for (const item of items) {
          const { data: branchProduct, error: fetchError } = await supabaseAdmin
            .from('branch_products')
            .select('id, stock_quantity, cost_price')
            .eq('branch_id', branch_id)
            .eq('product_id', item.product_id)
            .single();

          if (fetchError) {
            console.warn(`Product ${item.product_id} not found in branch ${branch_id}. Skipping stock update.`);
            continue;
          }

          // Determine costing method from tenant settings
          let newCost = item.cost_price; // Default to last-cost

          if (costingMethod === 'average' || costingMethod === 'ponderado') {
            const currentStock = branchProduct.stock_quantity || 0;
            const currentCost = branchProduct.cost_price || 0;
            const incomingQuantity = item.quantity;
            const incomingCost = item.cost_price;

            const totalQuantity = currentStock + incomingQuantity;

            if (totalQuantity > 0) {
              newCost = ((currentStock * currentCost) + (incomingQuantity * incomingCost)) / totalQuantity;
            } else {
              // If total quantity is 0, and incoming is also 0, cost remains 0 or previous.
              // If incoming is > 0 but current is 0, newCost is incomingCost.
              // This case should ideally not happen if stock is managed correctly.
              newCost = incomingCost;
            }
          }

          const newStock = (branchProduct.stock_quantity || 0) + item.quantity;

          const { error: updateError } = await supabaseAdmin
            .from('branch_products')
            .update({
              stock_quantity: newStock,
              cost_price: newCost,
            })
            .eq('id', branchProduct.id);

          if (updateError) {
            console.error(`Failed to update stock for product ${item.product_id} in branch ${branch_id}`, updateError);
            // Decide on error handling: continue or rollback? For now, continue.
          }
        }

        responseData = purchase;
        break;
      }

      case 'complete_purchase': {
        const { purchase_id } = payload;
        if (!purchase_id) {
          throw new Error('Purchase ID is required to complete a purchase.');
        }

        // 1. Fetch the purchase and its items
        const { data: purchase, error: fetchPurchaseError } = await supabaseAdmin
          .from('purchases')
          .select('*, items:purchase_items(*)')
          .eq('id', purchase_id)
          .eq('tenant_id', tenantId)
          .single();

        if (fetchPurchaseError) throw fetchPurchaseError;
        if (purchase.status === 'completed') {
          throw new Error('La compra ya ha sido completada.');
        }

        // 2. Update stock and cost price for each product in the branch
        for (const item of purchase.items) {
          const { data: branchProduct, error: fetchBranchProductError } = await supabaseAdmin
            .from('branch_products')
            .select('id, stock_quantity, cost_price')
            .eq('branch_id', purchase.branch_id)
            .eq('product_id', item.product_id)
            .single();

          if (fetchBranchProductError) {
            console.warn(`Product ${item.product_id} not found in branch ${purchase.branch_id}. Skipping stock update for completed purchase.`);
            continue;
          }

          const newStock = (branchProduct.stock_quantity || 0) + item.quantity;
          const newCost = item.cost_price; // Use the cost from the purchase item

          const { error: updateError } = await supabaseAdmin
            .from('branch_products')
            .update({
              stock_quantity: newStock,
              cost_price: newCost,
            })
            .eq('id', branchProduct.id);

          if (updateError) {
            console.error(`Failed to update stock for product ${item.product_id} in branch ${purchase.branch_id} during completion.`, updateError);
          }
        }

        // 3. Update the purchase status to 'completed'
        const { data: updatedPurchase, error: updatePurchaseError } = await supabaseAdmin
          .from('purchases')
          .update({ status: 'completed' })
          .eq('id', purchase_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (updatePurchaseError) throw updatePurchaseError;

        responseData = updatedPurchase;
        break;
      }

      case 'get_purchases': {
        const { tenantId: requestedTenantId } = payload;
        if (!requestedTenantId) {
          throw new Error('Tenant ID is required for get_purchases.');
        }

        const { data, error } = await supabaseAdmin
          .from('purchases')
          .select(`
            *,
            supplier:supplier_id (name),
            branch:branch_id (name),
            items:purchase_items(*, product:product_id(name))
          `)
          .eq('tenant_id', requestedTenantId)
          .order('purchase_date', { ascending: false });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'receive_purchase': {
        const { purchase_id, branch_id, received_items, reception_notes } = payload;
        if (!purchase_id || !branch_id || !received_items) {
          throw new Error('Purchase ID, Branch ID, and received items are required.');
        }
        const { data, error } = await supabaseAdmin.rpc('receive_purchase', {
          p_tenant_id: tenantId,
          p_purchase_id: purchase_id,
          p_branch_id: branch_id,
          p_received_items: received_items,
          p_reception_notes: reception_notes,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'cancel_purchase': {
        const { purchase_id } = payload;
        if (!purchase_id) {
          throw new Error('Purchase ID is required.');
        }
        const { data, error } = await supabaseAdmin.rpc('cancel_purchase', {
          p_purchase_id: purchase_id,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_purchase_payment_status': {
        const { purchase_id, payment_status } = payload;
        if (!purchase_id || !payment_status) {
          throw new Error('Purchase ID and payment status are required.');
        }
        const { data, error } = await supabaseAdmin.rpc('update_purchase_payment_status', {
          p_purchase_id: purchase_id,
          p_payment_status: payment_status,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'adjust_purchase_total': {
        const { purchase_id } = payload;
        if (!purchase_id) {
          throw new Error('Purchase ID is required.');
        }
        const { data, error } = await supabaseAdmin.rpc('adjust_purchase_total', {
          p_purchase_id: purchase_id,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_purchase_reception_details': {
        const { purchase_id } = payload;
        if (!purchase_id) {
          throw new Error('Purchase ID is required.');
        }
        const { data, error } = await supabaseAdmin.rpc('get_purchase_reception_details', {
          p_purchase_id: purchase_id,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_product_transfer': {
        const { from_branch_id, to_branch_id, transfer_date, notes, items } = payload;
        if (!from_branch_id || !to_branch_id || !items || items.length === 0) {
          throw new Error('From Branch ID, To Branch ID and at least one item are required.');
        }
        const { data, error } = await supabaseAdmin.rpc('create_product_transfer', {
          p_tenant_id: tenantId,
          p_from_branch_id: from_branch_id,
          p_to_branch_id: to_branch_id,
          p_transfer_date: transfer_date,
          p_notes: notes,
          p_items: items,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_product_transfer_status': {
        const { transfer_id, status } = payload;
        if (!transfer_id || !status) {
          throw new Error('Transfer ID and status are required.');
        }
        const { data, error } = await supabaseAdmin.rpc('update_product_transfer_status', {
          p_tenant_id: tenantId,
          p_transfer_id: transfer_id,
          p_status: status,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_product_transfers': {
        const { branchFilter, statusFilter } = payload;

        let query = supabaseAdmin
          .from('product_transfers')
          .select(`
            *,
            origin_branch:origin_branch_id (name),
            destination_branch:destination_branch_id (name),
            items:product_transfer_items(*, product:products(name))
          `)
          .eq('tenant_id', tenantId)

        if (branchFilter && branchFilter !== 'all') {
          query = query.or(`origin_branch_id.eq.${branchFilter},destination_branch_id.eq.${branchFilter}`);
        }

        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query.order('transfer_date', { ascending: false });

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

      case 'create_branch': {
        // The payload is already prefixed with p_ which matches the RPC function
        const { data, error } = await supabaseAdmin.rpc('create_branch', {
          p_tenant_id: tenantId,
          ...payload
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_branch': {
        // The payload is already prefixed with p_ which matches the RPC function
        const { data, error } = await supabaseAdmin.rpc('update_branch', payload);
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'calculate_batch_activation_proration': {
        const { branchIds } = payload;
        if (!branchIds || branchIds.length === 0) {
          throw new Error('Branch IDs are required for proration calculation.');
        }
        
        const { data, error } = await supabaseAdmin.rpc('calculate_batch_activation_proration', {
          p_tenant_id: tenantId,
          p_branch_ids: branchIds,
        });

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

        const { data, error } = await supabaseAdmin.rpc('get_tenant_users', { 
          p_target_tenant_id: requestedTenantId 
        });

        if (error) throw error;
        responseData = data;
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
          .select(`
            *,
            products:product_id (*),
            suppliers:supplier_id (*)
          `);
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
        const { searchTerm, showInactive, categoryId } = payload;
        const { data, error } = await supabaseAdmin.rpc('search_services', {
          p_tenant_id: tenantId,
          p_search_term: searchTerm || '',
          p_show_inactive: showInactive || false,
          p_category_id: categoryId || null,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_master_products': {
        const { searchTerm, showInactive, category, brandId } = payload;
        const { data, error } = await supabaseAdmin.rpc('search_products', {
          p_tenant_id: tenantId,
          p_search_term: searchTerm || null,
          p_show_inactive: showInactive || false,
          p_category_name: category || null,
          p_brand_id: brandId === '' ? null : (brandId || null),
        });
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

        const userRole = decodedToken.app_metadata?.assignments?.[0]?.role_name;

        let query = supabaseAdmin
          .from('branch_services')
          .select(`
            *,
            service:service_id (*)
          `)
          .eq('tenant_id', tenantId)

        if (branchId === 'all' && userRole !== 'tenant_super_admin') {
          const userBranchId = decodedToken.app_metadata?.assignments?.[0]?.branch_id;
          if (userBranchId) {
            query = query.eq('branch_id', userBranchId);
          } else {
            // Handle case where user has no branch_id, maybe return empty array
            responseData = [];
            break;
          }
        } else if (branchId !== 'all') {
          query = query.eq('branch_id', branchId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (branchId === 'all' && userRole === 'tenant_super_admin') {
          const serviceIds = new Set();
          const uniqueServices = data.filter((item: any) => {
            if (!serviceIds.has(item.service_id)) {
              serviceIds.add(item.service_id);
              return true;
            }
            return false;
          });
          responseData = uniqueServices.map((item: any) => ({
            id: item.service_id,
            branch_service_id: item.id,
            name: item.service?.name,
            description: item.service?.description,
            duration_minutes: item.service?.duration_minutes,
            selling_price: item.selling_price,
            is_branch_active: item.is_active,
          }));
        } else {
          responseData = data.map((item: any) => ({
            id: item.service_id,
            branch_service_id: item.id,
            name: item.service?.name,
            description: item.service?.description,
            duration_minutes: item.service?.duration_minutes,
            selling_price: item.selling_price,
            is_branch_active: item.is_active,
          }));
        }
        break;
      }

      case 'get_branch_products': {
        const { branchId } = payload;
        let query = supabaseAdmin
          .from('branch_products')
          .select(`
            *,
            product:product_id (*),
            branch:branch_id (name) // Incluir el nombre de la sucursal
          `)
          .eq('tenant_id', tenantId);

        if (branchId && branchId !== 'all') { // Filtrar por branchId solo si se proporciona y no es 'all'
          query = query.eq('branch_id', branchId);
        }

        const { data, error } = await query;
        if (error) throw error;
        responseData = data.map((item: any) => ({
          ...item.product,
          ...item,
          id: item.product_id,
          branch_product_id: item.id,
          is_branch_active: item.is_active,
          branch_name: item.branch?.name, // Añadir el nombre de la sucursal
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

      case 'get_service_commissions_by_service_and_branch': {
        const { serviceId, branchId } = payload;
        if (!serviceId || !branchId) throw new Error('Service ID and Branch ID are required.');
        const { data: commissions, error: commissionsError } = await supabaseAdmin
          .from('service_user_commissions')
          .select(`*,
            services(id, name, price)
          `) // Removed users selection
          .eq('tenant_id', tenantId)
          .eq('service_id', serviceId)
          .eq('branch_id', branchId)
          .order('created_at', { ascending: false });
        if (commissionsError) throw commissionsError;

        // Fetch all users for the tenant using the RPC
        const users = await callRpc(supabaseAdmin, 'get_tenant_users', { p_target_tenant_id: tenantId });
        const usersMap = new Map(users.map((user: any) => [user.user_id, user]));

        responseData = commissions.map((commission: any) => ({
          ...commission,
          user: usersMap.get(commission.user_id) || null, // Enrich with user data
        }));
        break;
      }

      case 'get_product_commissions_by_product_and_branch': {
        const { productId, branchId } = payload;
        if (!productId || !branchId) throw new Error('Product ID and Branch ID are required.');
        const { data: commissions, error: commissionsError } = await supabaseAdmin
          .from('product_user_commissions')
          .select(`*,
            products(id, name, price)
          `) // Removed users selection
          .eq('tenant_id', tenantId)
          .eq('product_id', productId)
          .eq('branch_id', branchId)
          .order('created_at', { ascending: false });
        if (commissionsError) throw commissionsError;

        // Fetch all users for the tenant using the RPC
        const users = await callRpc(supabaseAdmin, 'get_tenant_users', { p_target_tenant_id: tenantId });
        const usersMap = new Map(users.map((user: any) => [user.user_id, user]));

        responseData = commissions.map((commission: any) => ({
          ...commission,
          user: usersMap.get(commission.user_id) || null, // Enrich with user data
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

      // --- UNITS OF MEASURE (UOM) ACTIONS ---
      case 'MANAGE_UOM': {
        const { operation, uomData } = payload;
        if (!operation) throw new Error('Operation is required for MANAGE_UOM.');

        switch (operation) {
          case 'GET':
            responseData = await callRpc(supabaseAdmin, 'get_units_of_measure', { p_tenant_id: tenantId });
            break;
          case 'CREATE':
            if (!uomData || !uomData.name || !uomData.abbreviation) {
              throw new Error('Name and abbreviation are required to create a unit of measure.');
            }
            responseData = await callRpc(supabaseAdmin, 'create_unit_of_measure', {
              p_tenant_id: tenantId,
              p_name: uomData.name,
              p_abbreviation: uomData.abbreviation,
            });
            break;
          case 'UPDATE':
            if (!uomData || !uomData.id || !uomData.name || !uomData.abbreviation) {
              throw new Error('ID, name, and abbreviation are required to update a unit of measure.');
            }
            responseData = await callRpc(supabaseAdmin, 'update_unit_of_measure', {
              p_id: uomAata.id,
              p_tenant_id: tenantId,
              p_name: uomData.name,
              p_abbreviation: uomData.abbreviation,
            });
            break;
          case 'DELETE':
            if (!uomData || !uomData.id) {
              throw new Error('ID is required to delete a unit of measure.');
            }
            responseData = await callRpc(supabaseAdmin, 'delete_unit_of_measure', {
              p_id: uomData.id,
              p_tenant_id: tenantId,
            });
            break;
          default:
            throw new Error(`Invalid operation for MANAGE_UOM: ${operation}`);
        }
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
          .select('*, template:template_id(name, description, version, schema)')
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

      case 'get_user_time_off_history': {
        const { userId, statusFilter, typeFilter, dateRange, branchId, searchTerm } = payload;
        const { data, error } = await supabaseAdmin.rpc('get_user_time_off_history', {
          p_tenant_id: tenantId,
          p_user_id: userId || null,
          p_status_filter: statusFilter,
          p_type_filter: typeFilter,
          p_date_range_start: dateRange?.from ? new Date(dateRange.from).toISOString().split('T')[0] : null,
          p_date_range_end: dateRange?.to ? new Date(dateRange.to).toISOString().split('T')[0] : null,
          p_branch_id: branchId || null,
          p_search_term: searchTerm || null,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      // --- EQUIPMENT BRAND ACTIONS ---
      case 'get_equipment_brands': {
        console.log('DEBUG: get_equipment_brands - Inicio');
        const startTime = performance.now();

        const { data, error } = await supabaseAdmin
          .from('equipment_brands')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('name');

        const queryEndTime = performance.now();
        console.log(`DEBUG: get_equipment_brands - Consulta a DB finalizada en ${queryEndTime - startTime} ms`);

        if (error) {
          console.error('DEBUG: get_equipment_brands - Error en consulta:', error);
          throw error;
        }

        const responseEndTime = performance.now();
        console.log(`DEBUG: get_equipment_brands - Preparación de respuesta finalizada en ${responseEndTime - queryEndTime} ms`);

        responseData = data;
        console.log('DEBUG: get_equipment_brands - Fin');
        break;
      }

      case 'create_equipment_brand': {
        const { name, description } = payload;
        if (!name) throw new Error('Equipment brand name is required.');
        const { data, error } = await supabaseAdmin
          .from('equipment_brands')
          .insert([{ tenant_id: tenantId, name, description, is_active: true }])
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_equipment_brand': {
        const { id, ...updates } = payload;
        if (!id) throw new Error('Equipment brand ID is required.');
        const { data, error } = await supabaseAdmin
          .from('equipment_brands')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'delete_equipment_brand': {
        const { id } = payload;
        if (!id) throw new Error('Equipment brand ID is required.');
        const { error } = await supabaseAdmin
          .from('equipment_brands')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      // --- EQUIPMENT TYPE ACTIONS ---
      case 'get_equipment_types': {
        responseData = await callRpc(supabaseAdmin, 'get_equipment_types', { p_tenant_id: tenantId });
        break;
      }

      case 'create_equipment_type': {
        const { name, description } = payload;
        if (!name) throw new Error('Equipment type name is required.');
        responseData = await callRpc(supabaseAdmin, 'create_equipment_type', {
          p_tenant_id: tenantId,
          p_name: name,
          p_description: description,
        });
        break;
      }

      case 'update_equipment_type': {
        const { id, name, description, is_active } = payload;
        if (!id || !name) throw new Error('Equipment type ID and name are required.');
        responseData = await callRpc(supabaseAdmin, 'update_equipment_type', {
          p_tenant_id: tenantId,
          p_type_id: id,
          p_name: name,
          p_description: description,
          p_is_active: is_active,
        });
        break;
      }

      case 'delete_equipment_type': {
        const { id } = payload;
        if (!id) throw new Error('Equipment type ID is required.');
        responseData = await callRpc(supabaseAdmin, 'delete_equipment_type', {
          p_tenant_id: tenantId,
          p_type_id: id,
        });
        break;
      }

      // --- EQUIPMENT ACTIONS ---
      case 'get_equipment': {
        const { searchTerm, showInactive, typeId, brandId } = payload;
        responseData = await callRpc(supabaseAdmin, 'get_equipment', {
          p_tenant_id: tenantId,
          p_search_term: searchTerm || null,
          p_show_inactive: showInactive || false,
          p_type_id: typeId || null,
          p_brand_id: brandId || null,
        });
        break;
      }

      case 'create_equipment': {
        const { equipmentData } = payload;
        const { data, error } = await supabaseAdmin.rpc('create_equipment', {
          p_equipment_data: equipmentData,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_equipment': {
        const { equipmentId, equipmentData } = payload;
        const { data, error } = await supabaseAdmin.rpc('update_equipment', {
          p_equipment_id: equipmentId,
          p_equipment_data: equipmentData,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'delete_equipment': {
        const { equipmentId } = payload;
        const { data, error } = await supabaseAdmin.rpc('delete_equipment', {
          p_equipment_id: equipmentId,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_equipment_assignments': {
        const { equipmentId } = payload;
        const { data, error } = await supabaseAdmin.rpc('get_equipment_assignments', {
          p_equipment_id: equipmentId,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'assign_equipment_to_user': {
        const { equipmentId, userId, branchId, assignmentDate } = payload;
        const { data, error } = await supabaseAdmin.rpc('assign_equipment_to_user', {
          p_equipment_id: equipmentId,
          p_user_id: userId,
          p_branch_id: branchId,
          p_assignment_date: assignmentDate,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'return_equipment': {
        const { assignmentId, returnDate } = payload;
        const { data, error } = await supabaseAdmin.rpc('return_equipment', {
          p_assignment_id: assignmentId,
          p_return_date: returnDate,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_equipment_maintenance_history': {
        const { equipmentId } = payload;
        const { data, error } = await supabaseAdmin.rpc('get_equipment_maintenance_history', {
          p_equipment_id: equipmentId,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_equipment_maintenance_record': {
        const { maintenanceData } = payload;
        const { data, error } = await supabaseAdmin.rpc('create_equipment_maintenance_record', {
          p_maintenance_data: maintenanceData,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      // --- COMBO ACTIONS ---

      // --- PRODUCT IMAGE ACTIONS ---
      case 'get_product_images': {
        const { productId } = payload;
        if (!productId) throw new Error('Product ID is required.');
        const { data, error } = await supabaseAdmin
          .from('product_images')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('product_id', productId)
          .order('sort_order');
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'add_product_image': {
        const { productId, imageUrl } = payload;
        if (!productId || !imageUrl) throw new Error('Product ID and Image URL are required.');
        const { data, error } = await supabaseAdmin
          .from('product_images')
          .insert({
            tenant_id: tenantId,
            product_id: productId,
            image_url: imageUrl,
          })
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'delete_product_image': {
        const { imageId } = payload;
        if (!imageId) throw new Error('Image ID is required.');
        const { error } = await supabaseAdmin
          .from('product_images')
          .delete()
          .eq('id', imageId)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'set_primary_product_image': {
        const { productId, imageId } = payload;
        if (!productId || !imageId) throw new Error('Product ID and Image ID are required.');

        // Use a transaction to ensure atomicity
        const { data, error } = await supabaseAdmin.rpc('set_primary_image_for_product', {
          p_tenant_id: tenantId,
          p_product_id: productId,
          p_image_id: imageId,
        });
        
        if (error) throw error;
        responseData = data;
        break;
      }
      // --- END PRODUCT IMAGE ACTIONS ---

      case 'create_combo': {
        const { comboData, items } = payload;
        if (!comboData || !items || items.length === 0) {
          throw new Error('Combo data and at least one item are required.');
        }

        // 1. Create the master combo
        const { data: newCombo, error: comboError } = await supabaseAdmin
          .from('combos')
          .insert({ ...comboData, tenant_id: tenantId })
          .select()
          .single();

        if (comboError) throw comboError;

        // 2. Prepare and insert the combo items
        const comboItems = items.map((item: any) => ({
          combo_id: newCombo.id,
          product_id: item.product_id || null,
          service_id: item.service_id || null,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabaseAdmin
          .from('combo_items')
          .insert(comboItems);

        if (itemsError) {
          // Rollback combo creation if item insertion fails
          await supabaseAdmin.from('combos').delete().eq('id', newCombo.id);
          throw itemsError;
        }

        responseData = newCombo;
        break;
      }

      case 'get_combos': {
        const { data, error } = await supabaseAdmin
          .from('combos')
          .select(`
            *,
            combo_items (
              *,
              product:products (name),
              service:services (name)
            )
          `)
          .eq('tenant_id', tenantId)
          .order('name');

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_combo': {
        const { comboId, comboData, items } = payload;
        if (!comboId || !comboData) { // Check for items removed
          throw new Error('Combo ID and data are required for update.');
        }

        // 1. Update the master combo details
        const { data: updatedCombo, error: comboError } = await supabaseAdmin
          .from('combos')
          .update(comboData)
          .eq('id', comboId)
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (comboError) throw comboError;

        // 2. If items are provided, update them.
        if (items && Array.isArray(items)) {
          // Delete all existing items for this combo
          const { error: deleteError } = await supabaseAdmin
            .from('combo_items')
            .delete()
            .eq('combo_id', comboId);
          
          if (deleteError) {
            throw new Error(`Failed to delete old combo items: ${deleteError.message}`);
          }

          // Prepare and insert the new combo items if the array is not empty
          if (items.length > 0) {
            const comboItems = items.map((item: any) => ({
              combo_id: comboId,
              product_id: item.product_id || null,
              service_id: item.service_id || null,
              quantity: item.quantity,
              price: item.price,
            }));
    
            const { error: itemsError } = await supabaseAdmin
              .from('combo_items')
              .insert(comboItems);
    
            if (itemsError) {
              throw new Error(`Failed to insert new combo items: ${itemsError.message}`);
            }
          }
        }

        responseData = updatedCombo;
        break;
      }

      case 'delete_combo': {
        const { comboId } = payload;
        if (!comboId) throw new Error('Combo ID is required.');

        const { error } = await supabaseAdmin
          .from('combos')
          .delete()
          .eq('id', comboId)
          .eq('tenant_id', tenantId);

        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'assign_combo_to_branch': {
        const { combo_id, branch_id, is_active } = payload;
        if (!combo_id || !branch_id) throw new Error('Combo ID and Branch ID are required.');

        const { data, error } = await supabaseAdmin
          .from('branch_combos')
          .upsert({
            combo_id,
            branch_id,
            tenant_id: tenantId,
            is_active: is_active ?? true,
          }, { onConflict: 'branch_id, combo_id' })
          .select()
          .single();

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_combo_branch_details': {
        const { comboId, branchId } = payload;
        if (!comboId || !branchId) throw new Error('Combo ID and Branch ID are required.');

        const { data, error } = await supabaseAdmin.rpc('get_combo_branch_details', {
          p_tenant_id: tenantId,
          p_branch_id: branchId,
          p_combo_id: comboId,
        });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_combo_branch_prices': {
        const { branch_id, combo_id, price_overrides } = payload;
        if (!branch_id || !combo_id || !price_overrides) {
          throw new Error('Branch ID, Combo ID, and price overrides are required.');
        }

        const { data, error } = await supabaseAdmin.rpc('update_combo_branch_prices', {
          p_tenant_id: tenantId,
          p_branch_id: branch_id,
          p_combo_id: combo_id,
          p_price_overrides: price_overrides,
        });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'unassign_combo_from_branch': {
        const { combo_id, branch_id } = payload;
        if (!combo_id || !branch_id) throw new Error('Combo ID and Branch ID are required.');

        const { error } = await supabaseAdmin
          .from('branch_combos')
          .delete()
          .eq('combo_id', combo_id)
          .eq('branch_id', branch_id)
          .eq('tenant_id', tenantId);

        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'get_assigned_branches_for_combo': {
        const { comboId } = payload;
        if (!comboId) throw new Error('Combo ID is required.');

        const { data, error } = await supabaseAdmin
          .from('branch_combos')
          .select('branch_id, is_active, branches(name)')
          .eq('combo_id', comboId)
          .eq('tenant_id', tenantId);

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_combos_for_branch': {
        const { branchId } = payload;
        if (!branchId) throw new Error('Branch ID is required.');

        const { data: branchCombosData, error: bcError } = await supabaseAdmin
          .from('branch_combos')
          .select(`
            is_active,
            combo_id
          `)
          .eq('branch_id', branchId)
          .eq('tenant_id', tenantId);

        if (bcError) throw bcError;

        const detailedCombosPromises = branchCombosData.map(async (bc: any) => {
            const { data: comboDetails, error: detailsError } = await supabaseAdmin.rpc('get_combo_branch_details', {
                p_tenant_id: tenantId,
                p_branch_id: branchId,
                p_combo_id: bc.combo_id,
            });
            if (detailsError) {
                console.error(`Error fetching details for combo ${bc.combo_id}:`, detailsError);
                return null; // Or handle error appropriately
            }
            return {
                ...comboDetails,
                is_active_in_branch: bc.is_active // Add the branch-specific active status
            };
        });

        const detailedCombos = (await Promise.all(detailedCombosPromises)).filter(Boolean);

        responseData = detailedCombos;
        break;
      }

      case 'update_branch_combo_status': {
        const { combo_id, branch_id, is_active } = payload;
        if (!combo_id || !branch_id || is_active === undefined) {
          throw new Error('Combo ID, Branch ID, and active status are required.');
        }

        const { data, error } = await supabaseAdmin
          .from('branch_combos')
          .update({ is_active })
          .eq('combo_id', combo_id)
          .eq('branch_id', branch_id)
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (error) throw error;
        responseData = data;
        break;
      }

      // --- USER SERVICE COMMISSIONS ---
      case 'get_user_service_commissions': {
        const { userId } = payload;
        if (!userId) throw new Error('User ID is required.');
        const { data, error } = await supabaseAdmin
          .from('service_user_commissions')
          .select('*, services(id, name)')
          .eq('tenant_id', tenantId)
          .eq('user_id', userId);
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_service_commission': {
        const { commissionData } = payload;
        if (!commissionData) throw new Error('Commission data is required.');
        const { data, error } = await supabaseAdmin
          .from('service_user_commissions')
          .insert({ ...commissionData, tenant_id: tenantId })
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_service_commission': {
        const { id, updates } = payload;
        if (!id || !updates) throw new Error('Commission ID and updates are required.');
        const { data, error } = await supabaseAdmin
          .from('service_user_commissions')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'delete_service_commission': {
        const { id } = payload;
        if (!id) throw new Error('Commission ID is required.');
        const { error } = await supabaseAdmin
          .from('service_user_commissions')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'get_attentions': {
        const { branchId, userId, statusFilter, dateRange } = payload;
        const { data, error } = await supabaseAdmin.rpc('get_attentions_with_details', {
          p_tenant_id: tenantId,
          p_branch_id: branchId === 'all' ? null : branchId,
          p_user_id: userId === 'all' ? null : userId,
          p_status_filter: statusFilter === 'all' ? null : statusFilter,
          p_start_date: dateRange?.from,
          p_end_date: dateRange?.to
        });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_attention_datetimes': {
        const { p_branch_id, p_user_id } = payload;
        const { data, error } = await supabaseAdmin.rpc('get_attention_datetimes', {
            p_branch_id: p_branch_id === 'all' ? null : p_branch_id,
            p_user_id: p_user_id === 'all' ? null : p_user_id
        });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_full_attention': {
        const { p_client_id, p_attention_date, p_attention_time, p_notes, p_services, p_tenant_id, p_branch_id } = payload;
        const { data, error } = await supabaseAdmin.rpc('create_full_attention', {
          p_client_id,
          p_attention_date,
          p_attention_time,
          p_notes,
          p_services,
          p_tenant_id,
          p_branch_id,
        });
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'cancel_attention': {
        const { attentionId } = payload;
        const { error } = await supabaseAdmin
          .from('attentions')
          .update({ status: 'Cancelada' })
          .eq('id', attentionId);
        if (error) throw error;
        responseData = { success: true };
        break;
      }

      case 'add_attention_service': {
        const { newService } = payload;
        const { data, error } = await supabaseAdmin
          .from('attention_services')
          .insert(newService)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_available_users': {
        const { serviceId, appointmentDate, appointmentTime, duration, branchId } = payload;
        if (!serviceId || !appointmentDate || !appointmentTime || !duration || !branchId || !tenantId) {
          responseData = [];
          break;
        }
  
        // 1. Find users who have a commission for this service in this branch
        const { data: usersWithCommission, error: commissionError } = await supabaseAdmin
          .from('service_user_commissions')
          .select('user_id, commission_rate, users!inner(id, first_name, last_name, is_active, is_schedulable)')
          .eq('service_id', serviceId)
          .eq('branch_id', branchId)
          .eq('users.is_active', true)
          .eq('users.is_schedulable', true);
  
        if (commissionError) {
          console.error('Error fetching users with commission:', commissionError);
          throw new Error(commissionError.message);
        }
  
        if (!usersWithCommission || usersWithCommission.length === 0) {
          responseData = [];
          break;
        }
  
        // 2. For each user, check their availability using the DB function
        const availabilityChecks = usersWithCommission.map(commission =>
          supabaseAdmin.rpc('check_user_availability', {
            p_user_id: commission.users!.id,
            p_appointment_date: appointmentDate,
            p_appointment_time: appointmentTime,
            p_duration_minutes: duration,
          })
        );
  
        const availabilityResults = await Promise.all(availabilityChecks);
  
        // 3. Filter the users based on the availability check result
        const availableUsers = usersWithCommission.filter((_, index) => {
          const result = availabilityResults[index];
          if (result.error) {
            console.error(`Error checking availability for user ${usersWithCommission[index].users!.id}:`, result.error);
            return false;
          }
          return result.data === true;
        });
        
        // Format the final result
        responseData = availableUsers.map(u => ({
          user_id: u.users!.id,
          commission_rate: u.commission_rate,
          users: {
              id: u.users!.id,
              name: `${u.users!.first_name || ''} ${u.users!.last_name || ''}`.trim(),
              is_active: u.users!.is_active
          }
        }));
        break;
      }

      // --- USER PRODUCT COMMISSIONS ---
      case 'get_user_product_commissions': {
        const { userId, branchId } = payload;
        if (!userId || !branchId) throw new Error('User ID and Branch ID are required.');
        const { data, error } = await supabaseAdmin
          .from('product_user_commissions')
          .select('*, products(id, name)')
          .eq('tenant_id', tenantId)
          .eq('user_id', userId)
          .eq('branch_id', branchId);
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_product_commission': {
        const { commissionData } = payload;
        if (!commissionData) throw new Error('Commission data is required.');
        const { data, error } = await supabaseAdmin
          .from('product_user_commissions')
          .insert({ ...commissionData, tenant_id: tenantId })
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_product_commission': {
        const { id, updates } = payload;
        if (!id || !updates) throw new Error('Commission ID and updates are required.');
        const { data, error } = await supabaseAdmin
          .from('product_user_commissions')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();
        if (error) throw error;
        responseData = data;
        break;
      }

      case 'delete_product_commission': {
        const { id } = payload;
        if (!id) throw new Error('Commission ID is required.');
        const { error } = await supabaseAdmin
          .from('product_user_commissions')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);
      if (error) throw error;
        responseData = { success: true };
        break;
      }

      // --- COMMISSION MATRIX ACTIONS ---
      case 'get_product_commission_matrix': {
        const { productId } = payload;
        if (!productId) throw new Error('Product ID is required.');
        
        const { data, error } = await supabaseAdmin.rpc('get_product_commission_matrix', {
          product_id_param: productId,
          tenant_id_param: tenantId
        });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_service_commission_matrix': {
        const { serviceId } = payload;
        if (!serviceId) throw new Error('Service ID is required.');

        const { data, error } = await supabaseAdmin.rpc('get_service_commission_matrix', {
          service_id_param: serviceId,
          tenant_id_param: tenantId
        });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_user_product_commission_matrix': {
        const { userId: targetUserId } = payload;
        if (!targetUserId) throw new Error('User ID is required.');
        
        const { data, error } = await supabaseAdmin.rpc('get_user_product_commission_matrix', {
          user_id_param: targetUserId,
          tenant_id_param: tenantId
        });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'get_user_service_commission_matrix': {
        const { userId: targetUserId } = payload;
        if (!targetUserId) throw new Error('User ID is required.');

        const { data, error } = await supabaseAdmin.rpc('get_user_service_commission_matrix', {
          user_id_param: targetUserId,
          tenant_id_param: tenantId
        });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'update_commission': {
        const {
          item_id,
          user_id,
          branch_id,
          item_type,
          commission_rate,
          can_perform
        } = payload;

        if (!item_id || !user_id || !branch_id || !item_type) {
          throw new Error('Missing required fields for commission update.');
        }

        let data, error;

        if (item_type === 'product') {
          ({ data, error } = await supabaseAdmin
            .from('product_user_commissions')
            .upsert(
              {
                product_id: item_id,
                user_id: user_id,
                branch_id: branch_id,
                tenant_id: tenantId,
                commission_rate: commission_rate,
              },
              {
                onConflict: 'product_id, user_id, branch_id, tenant_id',
              }
            )
            .select()
            .single());
        } else if (item_type === 'service') {
          ({ data, error } = await supabaseAdmin
            .from('service_user_commissions')
            .upsert(
              {
                service_id: item_id,
                user_id: user_id,
                branch_id: branch_id,
                tenant_id: tenantId,
                commission_rate: commission_rate,
                can_perform: can_perform ?? false,
              },
              {
                onConflict: 'service_id, user_id, branch_id',
              }
            )
            .select()
            .single());
        } else {
          throw new Error(`Invalid item_type: ${item_type}`);
        }

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'create_product_transfer_request': {
        const { requesting_branch_id, origin_branch_id, notes, items } = payload;
        responseData = await callRpc(supabaseAdmin, 'create_product_transfer_request', {
          p_tenant_id: tenantId,
          p_requesting_branch_id: requesting_branch_id,
          p_origin_branch_id: origin_branch_id,
          p_notes: notes,
          p_items: items,
        });
        break;
      }

      case 'approve_product_transfer': {
        const { transfer_id, adjusted_items } = payload;
        responseData = await callRpc(supabaseAdmin, 'approve_product_transfer', {
          p_transfer_id: transfer_id,
          p_adjusted_items: adjusted_items,
          p_tenant_id: tenantId,
          p_user_id: userId,
        });
        break;
      }

      case 'reject_product_transfer': {
        const { transfer_id } = payload;
        responseData = await callRpc(supabaseAdmin, 'reject_product_transfer', {
          p_transfer_id: transfer_id,
        });
        break;
      }

      case 'ship_product_transfer': {
        const { transfer_id } = payload;
        responseData = await callRpc(supabaseAdmin, 'ship_product_transfer', {
          p_transfer_id: transfer_id,
          p_tenant_id: tenantId,
          p_user_id: userId,
        });
        break;
      }

      case 'receive_product_transfer': {
        const { transfer_id, reception_notes, received_items } = payload;
        responseData = await callRpc(supabaseAdmin, 'receive_product_transfer', {
          p_transfer_id: transfer_id,
          p_reception_notes: reception_notes,
          p_received_items: received_items,
          p_tenant_id: tenantId,
          p_user_id: userId,
        });
        break;
      }

      case 'cancel_product_transfer': {
        const { transfer_id } = payload;
        responseData = await callRpc(supabaseAdmin, 'cancel_product_transfer', {
          p_transfer_id: transfer_id,
          p_tenant_id: tenantId,
          p_user_id: userId,
        });
        break;
      }

      case 'get_transfer_details': {
        const { transfer_id } = payload;
        responseData = await callRpc(supabaseAdmin, 'get_transfer_details', {
          p_transfer_id: transfer_id,
          p_tenant_id: tenantId,
        });
        break;
      }

      case 'get_branch_commission_matrix': {
        const { branchId } = payload;
        if (!branchId) {
          throw new Error('Branch ID is required for get_branch_commission_matrix.');
        }
        
        const { data, error } = await supabaseAdmin.rpc('get_branch_commission_matrix', {
          tenant_id_param: tenantId,
          branch_id_param: branchId,
        });

        if (error) throw error;
        responseData = data;
        break;
      }

      case 'GET_SUBSCRIPTION_STATUS': {
        if (!tenantId) {
          throw new Error('Tenant ID is required to get subscription status.');
        }

        // Llama a la función RPC para obtener el estado de la suscripción
        const { data, error } = await supabaseAdmin.rpc('get_subscription_status_for_tenant', {
          p_tenant_id: tenantId
        });

        if (error) {
          console.error('Error calling get_subscription_status_for_tenant RPC:', error);
          throw error;
        }
        
        // La RPC devuelve directamente el objeto que necesitamos
        responseData = data;
        break;
      }

      case 'start_attention_service': {
        const { serviceId } = payload;
        if (!serviceId) {
          throw new Error('serviceId (attention_service_id) is required to start a service.');
        }

        // Llama a la función RPC que ya existe en la base de datos
        const { error } = await supabaseAdmin.rpc('start_service', {
          p_attention_service_id: serviceId
        });

        if (error) {
          console.error('Error calling start_service RPC:', error);
          throw error;
        }
        
        responseData = { success: true, message: 'Servicio iniciado correctamente.' };
        break;
      }

      case 'finish_attention_service': {
        const { serviceId } = payload;
        if (!serviceId) {
          throw new Error('serviceId (attention_service_id) is required to finish a service.');
        }

        // Llama a la función RPC que ya existe en la base de datos
        const { error } = await supabaseAdmin.rpc('end_service', {
          p_attention_service_id: serviceId
        });

        if (error) {
          console.error('Error calling end_service RPC:', error);
          throw error;
        }
        
        responseData = { success: true, message: 'Servicio finalizado correctamente.' };
        break;
      }

      case 'call_client_for_service': {
        const { serviceId } = payload; // This is attention_service_id
        if (!serviceId) {
          throw new Error('serviceId (attention_service_id) is required to call a client.');
        }

        // 1. Get attention details from the serviceId
        const { data: attentionService, error: serviceError } = await supabaseAdmin
          .from('attention_services')
          .select(`
            user_id,
            attentions (
              branch_id,
              client_id
            )
          `)
          .eq('id', serviceId)
          .single();

        if (serviceError) throw new Error(`Error fetching attention details: ${serviceError.message}`);
        if (!attentionService) throw new Error(`Attention service with ID ${serviceId} not found.`);

        const { user_id: stylist_id, attentions } = attentionService;
        const { branch_id, client_id } = attentions;

        if (!stylist_id || !branch_id || !client_id) {
          throw new Error('Could not determine stylist, branch, or client from the attention service.');
        }

        // 2. Insert a new record into the turns table
        const { error: turnError } = await supabaseAdmin
          .from('turns')
          .insert({
            tenant_id: tenantId, // tenantId is available from the JWT
            branch_id,
            client_id,
            stylist_id,
            status: 'called', // Assuming 'called' is a valid status
            called_at: new Date().toISOString()
          });

        if (turnError) {
          console.error('Error creating turn:', turnError);
          throw new Error(`Could not create turn: ${turnError.message}`);
        }

        responseData = { success: true, message: 'Cliente llamado a la TV correctamente.' };
        break;
      }

      case 'create_branch': {
        const { data, error } = await supabaseAdmin.rpc('create_branch', {
          p_tenant_id: tenantId, // Aseguramos el tenant_id del usuario autenticado
          ...payload
        });

        if (error) {
          console.error('Error calling create_branch RPC:', error);
          throw error;
        }
        
        responseData = data;
        break;
      }

      case 'update_branch': {
        const { data, error } = await supabaseAdmin.rpc('update_branch', {
          p_tenant_id: tenantId, // Aseguramos el tenant_id del usuario autenticado
          ...payload
        });

        if (error) {
          console.error('Error calling update_branch RPC:', error);
          throw error;
        }
        
        responseData = data;
        break;
      }

      case 'update_equipment_maintenance_record': {
        const { recordId, updates } = payload;
        if (!recordId || !updates) {
          throw new Error('recordId and updates are required.');
        }

        const { error } = await supabaseAdmin.rpc('update_equipment_maintenance_record', {
          p_tenant_id: tenantId,
          p_record_id: recordId,
          p_updates: updates
        });

        if (error) {
          console.error('Error calling update_equipment_maintenance_record RPC:', error);
          throw error;
        }
        
        responseData = { success: true, message: 'Registro de mantenimiento actualizado.' };
        break;
      }

      case 'delete_equipment_maintenance_record': {
        const { recordId } = payload;
        if (!recordId) {
          throw new Error('recordId is required.');
        }

        const { error } = await supabaseAdmin.rpc('delete_equipment_maintenance_record', {
          p_tenant_id: tenantId,
          p_record_id: recordId
        });

        if (error) {
          console.error('Error calling delete_equipment_maintenance_record RPC:', error);
          throw error;
        }
        
        responseData = { success: true, message: 'Registro de mantenimiento eliminado.' };
        break;
      }

      case 'get_product_sellers': {
        const { productId, branchId, tenantId: payloadTenantId } = payload;
        if (!productId || !branchId || !payloadTenantId) {
          throw new Error('productId, branchId, and tenantId are required.');
        }

        const { data, error } = await supabaseAdmin.rpc('get_product_sellers', {
          p_product_id: productId,
          p_branch_id: branchId,
          p_tenant_id: payloadTenantId
        });

        if (error) {
          console.error('Error calling get_product_sellers RPC:', error);
          throw error;
        }
        
        responseData = data;
        break;
      }

      case 'get_master_combos': {
        const { data, error } = await supabaseAdmin
          .from('combos')
          .select(`
            *,
            combo_items (
              *,
              product:products (name),
              service:services (name)
            )
          `)
          .eq('tenant_id', tenantId);

        if (error) {
          console.error('Error fetching master combos:', error);
          throw error;
        }
        
        responseData = data;
        break;
      }

      case 'update_combo_branch_prices': {
        const { combo_id, branch_id, price_overrides } = payload;
        if (!combo_id || !branch_id || !price_overrides) {
          throw new Error('combo_id, branch_id, and price_overrides are required.');
        }

        const { error } = await supabaseAdmin.rpc('update_combo_branch_prices', {
          p_tenant_id: tenantId,
          p_combo_id: combo_id,
          p_branch_id: branch_id,
          p_price_overrides: price_overrides
        });

        if (error) {
          console.error('Error calling update_combo_branch_prices RPC:', error);
          throw error;
        }
        
        responseData = { success: true, message: 'Precios de ítems del combo actualizados.' };
        break;
      }

      case 'update_tenant': {
        const { id, values } = payload;
        if (!id || !values) {
          throw new Error('Tenant ID and values are required for update.');
        }

        // Asegurarnos de que el tenant que se intenta actualizar es el mismo del token
        if (id !== tenantId) {
          throw new Error('Authorization error: You can only update your own tenant.');
        }

        const { data, error } = await supabaseAdmin
          .from('tenants')
          .update(values)
          .eq('id', tenantId)
          .select()
          .single();

        if (error) {
          console.error('Error updating tenant:', error);
          throw error;
        }
        
        responseData = data;
        break;
      }

      case 'update_attention_items': {
        const { p_payload } = payload;
        if (!p_payload) {
          throw new Error('p_payload is required.');
        }

        const { error } = await supabaseAdmin.rpc('update_attention_items', {
          p_payload
        });

        if (error) {
          console.error('Error calling update_attention_items RPC:', error);
          throw error;
        }
        
        responseData = { success: true, message: 'Ítems de la atención actualizados.' };
        break;
      }

      case 'GET_SUBSCRIPTION_PLANS': {
        const { tenantId: payloadTenantId } = payload;
        if (!payloadTenantId) {
          throw new Error('tenantId is required.');
        }

        const { data, error } = await supabaseAdmin.rpc('get_subscription_plans_for_tenant', {
          p_tenant_id: payloadTenantId
        });

        if (error) {
          console.error('Error calling get_subscription_plans_for_tenant RPC:', error);
          throw error;
        }
        
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
    status = 500;
    console.error("Error in tenant-actions Edge Function (raw):", error);
    console.error("Error in tenant-actions Edge Function (JSON):", JSON.stringify(error, null, 2));
    console.error("Error in tenant-actions Edge Function (typeof):", typeof error);
    console.error("Error in tenant-actions Edge Function (constructor):", error ? error.constructor.name : 'null/undefined');

    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) {
        errorMessage = 'An unknown object error occurred (stringify failed).';
      }
    } else {
      errorMessage = String(error);
    }

    if (!errorMessage || errorMessage === '{}' || errorMessage === 'null' || errorMessage === 'undefined' || errorMessage === '[object Object]') {
        errorMessage = 'An unexpected error occurred in the Edge Function. Check Supabase logs for details.';
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status,
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