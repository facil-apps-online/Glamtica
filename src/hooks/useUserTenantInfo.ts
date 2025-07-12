import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { jwtDecode } from 'jwt-decode';

interface UserTenantInfo {
  tenant_id: string | null;
  branch_id: string | null;
  isLoading: boolean;
}

export const useUserTenantInfo = (): UserTenantInfo => {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserTenantInfo = async () => {
      try {
        const token = localStorage.getItem('supabase.auth.token');

        if (token) {
          const decodedToken: any = jwtDecode(token);
          const userTenantId = decodedToken.tenant_id || null;
          const userBranchId = decodedToken.branch_id || null;

          setTenantId(userTenantId);
          setBranchId(userBranchId);
        } else {
          setTenantId(null);
          setBranchId(null);
        }
      } catch (error) {
        console.error("Error fetching user tenant info:", error);
        setTenantId(null);
        setBranchId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTenantInfo();
  }, []);

  return { tenant_id: tenantId, branch_id: branchId, isLoading };
};