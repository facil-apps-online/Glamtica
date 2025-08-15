import { useQuery } from "@tanstack/react-query";
import { callTenantAction } from "@/lib/tenantActions";

export const useTransferDetails = (transferId: string) => {
  return useQuery({
    queryKey: ["transferDetails", transferId],
    queryFn: () => callTenantAction('get_transfer_details', { transfer_id: transferId }),
    enabled: !!transferId,
  });
};
