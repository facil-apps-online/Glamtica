# Listado de Toasts con Variante "default" (Implícita y Explícita)

Este documento contiene una lista de todas las llamadas a la función `toast` que utilizan la variante "default", ya sea de forma explícita (`variant: "default"`) o implícita (omitiendo el parámetro `variant`).

## Toasts con Variante Explícita "default"

*   **Archivo:** `src\pages\RegisterTenant.tsx`
    *   **Línea 227**
*   **Archivo:** `src\components\ConsentManagerDialog.tsx`
    *   **Línea 74**
*   **Archivo:** `src\contexts\AuthContext.tsx`
    *   **Línea 258**

## Toasts con Variante Implícita "default"

A continuación se listan los archivos y las líneas donde se llama a `toast({...})` sin especificar una variante, por lo que se asume "default".

### Pages

*   **`src\pages\UpdatePasswordPage.tsx`**: Líneas 53, 70, 78
*   **`src\pages\SecurityTab.tsx`**: Línea 51
*   **`src\pages\ResetPassword.tsx`**: Líneas 77, 85
*   **`src\pages\RegisterTenant.tsx`**: Línea 309
*   **`src\pages\Auth.tsx`**: Líneas 61, 66, 78, 97, 108, 133, 138
*   **`src\pages\Settings\SubscriptionTab.tsx`**: Líneas 76, 117
*   **`src\pages\Settings\InventorySettingsTab.tsx`**: Líneas 61, 68
*   **`src\pages\Settings\ActivateBranchesBatchDialog.tsx`**: Línea 72

### Contexts

*   **`src\contexts\AuthContext.tsx`**: Línea 270

### Hooks

*   **`src\hooks\useUpdateCommission.ts`**: Líneas 38, 44
*   **`src\hooks\useUpdateAttentionStatus.ts`**: Líneas 31, 37
*   **`src\hooks\useTranslationsAdmin.ts`**: Líneas 53, 59, 83, 89, 111, 117
*   **`src\hooks\useTenantAction.ts`**: Líneas 41, 51
*   **`src\hooks\useSuppliers.ts`**: Líneas 80, 102, 124
*   **`src\hooks\useSupplierProducts.ts`**: Líneas 92, 117, 142
*   **`src\hooks\useSettings.ts`**: Líneas 76, 82
*   **`src\hooks\useServiceCategories.ts`**: Línea 191
*   **`src\hooks\useSaveIntegration.ts`**: Líneas 83, 91
*   **`src\hooks\useRenewSubscription.ts`**: Líneas 40, 52
*   **`src\hooks\useProductCategories.ts`**: Línea 191
*   **`src\hooks\useMaintenanceHistory.ts`**: Líneas 36, 66, 74, 99, 107, 129, 137
*   **`src\hooks\useGenerateInvoice.ts`**: Líneas 28, 42
*   **`src\hooks\useEquipmentTypes.ts`**: Líneas 43, 49, 63, 69, 83, 89
*   **`src\hooks\useEquipmentBrands.ts`**: Líneas 44, 50, 64, 70, 84, 90
*   **`src\hooks\useEquipmentAssignments.ts`**: Líneas 38, 68, 77, 106, 115
*   **`src\hooks\useEquipment.ts`**: Líneas 59, 65, 79, 85
*   **`src\hooks\useCompletePurchase.ts`**: Línea 39
*   **`src\hooks\useCombos.ts`**: Líneas 127, 172
*   **`src\hooks\useClients.ts`**: Líneas 89, 95, 118, 124, 146, 152, 175, 181, 204, 210
*   **`src\hooks\useBrands.ts`**: Líneas 111, 118, 158, 165, 244
*   **`src\hooks\useAuth.ts`**: Línea 16
*   **`src\hooks\useAttentions.ts`**: Líneas 168, 175
*   **`src\hooks\useAppointmentEvidence.ts`**: Líneas 88, 94

### Components

*   **`src\components\UserScheduleDialog.tsx`**: Líneas 161, 169
*   **`src\components\TranslationAdmin.tsx`**: Líneas 42, 84
*   **`src\components\TenantUsersManager.tsx`**: Línea 146
*   **`src\components\RegisterTvDialog.tsx`**: Líneas 33, 38, 67, 74
*   **`src\components\MediaPlaylistDialog.tsx`**: Líneas 58, 69, 77
*   **`src\components\ManageServiceCommissionsDialog.tsx`**: Líneas 116, 124
*   **`src\components\ManageProductCommissionsDialog.tsx`**: Líneas 61, 69
*   **`src\components\MaintenanceRecordFormDialog.tsx`**: Línea 60
*   **`src\components\EquipmentDialog.tsx`**: Líneas 90, 115
*   **`src\components\BranchCommissionsTabContent.tsx`**: Líneas 121, 132
*   **`src\components\AttentionForm.tsx`**: Línea 248
*   **`src\components\AssignPlaylistDialog.tsx`**: Líneas 40, 68, 75
*   **`src\components\AssignEquipmentDialog.tsx`**: Línea 49