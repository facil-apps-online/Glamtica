@echo off
setlocal

set "BACKUP_DIR=Superadmin_Backup"

if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
)

echo Recuperando archivos de Superadmin...

git show 34df48dc959fa0d69501ff51e7bc507ef246b6fc:"src/components/SuperadminHeader.tsx" > "%BACKUP_DIR%/SuperadminHeader.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/SuperadminHeader.tsx
) else (
    echo Recuperado SuperadminHeader.tsx
)

git show 34df48dc959fa0d69501ff51e7bc507ef246b6fc:"src/components/SuperadminSidebar.tsx" > "%BACKUP_DIR%/SuperadminSidebar.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/SuperadminSidebar.tsx
) else (
    echo Recuperado SuperadminSidebar.tsx
)

git show 96a6e2cc84c6ce444edb11a2852a8a56fbcaf912:"src/components/superadmin/CurrentPricesTable.tsx" > "%BACKUP_DIR%/CurrentPricesTable.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/CurrentPricesTable.tsx
) else (
    echo Recuperado CurrentPricesTable.tsx
)

git show 96a6e2cc84c6ce444edb11a2852a8a56fbcaf912:"src/components/superadmin/DynamicIntegrationForm.tsx" > "%BACKUP_DIR%/DynamicIntegrationForm.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/DynamicIntegrationForm.tsx
) else (
    echo Recuperado DynamicIntegrationForm.tsx
)

git show 96a6e2cc84c6ce444edb11a2852a8a56fbcaf912:"src/components/superadmin/GeneralSettingsTab.tsx" > "%BACKUP_DIR%/GeneralSettingsTab.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/GeneralSettingsTab.tsx
) else (
    echo Recuperado GeneralSettingsTab.tsx
)

git show 96a6e2cc84c6ce444edb11a2852a8a56fbcaf912:"src/components/superadmin/IntegrationConfigDialog.tsx" > "%BACKUP_DIR%/IntegrationConfigDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/IntegrationConfigDialog.tsx
) else (
    echo Recuperado IntegrationConfigDialog.tsx
)

git show 96a6e2cc84c6ce444edb11a2852a8a56fbcaf912:"src/components/superadmin/NewPriceScheduler.tsx" > "%BACKUP_DIR%/NewPriceScheduler.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/NewPriceScheduler.tsx
) else (
    echo Recuperado NewPriceScheduler.tsx
)

git show 96a6e2cc84c6ce444edb11a2852a8a56fbcaf912:"src/components/superadmin/PlanPriceForm.tsx" > "%BACKUP_DIR%/PlanPriceForm.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/PlanPriceForm.tsx
) else (
    echo Recuperado PlanPriceForm.tsx
)

git show 96a6e2cc84c6ce444edb11a2852a8a56fbcaf912:"src/components/superadmin/PriceHistory.tsx" > "%BACKUP_DIR%/PriceHistory.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/PriceHistory.tsx
) else (
    echo Recuperado PriceHistory.tsx
)

git show 96a6e2cc84c6ce444edb11a2852a8a56fbcaf912:"src/components/superadmin/PriceHistoryTable.tsx" > "%BACKUP_DIR%/PriceHistoryTable.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/PriceHistoryTable.tsx
) else (
    echo Recuperado PriceHistoryTable.tsx
)

git show 96a6e2cc84c6ce444edb11a2852a8a56fbcaf912:"src/components/superadmin/ScheduledPrices.tsx" > "%BACKUP_DIR%/ScheduledPrices.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/ScheduledPrices.tsx
) else (
    echo Recuperado ScheduledPrices.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/components/superadmin/TenantInvoicesList.tsx" > "%BACKUP_DIR%/TenantInvoicesList.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/TenantInvoicesList.tsx
) else (
    echo Recuperado TenantInvoicesList.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/components/superadmin/TenantSubscriptionsManager.tsx" > "%BACKUP_DIR%/TenantSubscriptionsManager.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/components/superadmin/TenantSubscriptionsManager.tsx
) else (
    echo Recuperado TenantSubscriptionsManager.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/config/superadminNavigation.ts" > "%BACKUP_DIR%/superadminNavigation.ts"
if %errorlevel% neq 0 (
    echo Error al recuperar src/config/superadminNavigation.ts
) else (
    echo Recuperado superadminNavigation.ts
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/AuthMethodSettings.tsx" > "%BACKUP_DIR%/AuthMethodSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/AuthMethodSettings.tsx
) else (
    echo Recuperado AuthMethodSettings.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/BodyFormatSettings.tsx" > "%BACKUP_DIR%/BodyFormatSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/BodyFormatSettings.tsx
) else (
    echo Recuperado BodyFormatSettings.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/CategoryDialog.tsx" > "%BACKUP_DIR%/CategoryDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/CategoryDialog.tsx
) else (
    echo Recuperado CategoryDialog.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/CountriesSettings.tsx" > "%BACKUP_DIR%/CountriesSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/CountriesSettings.tsx
) else (
    echo Recuperado CountriesSettings.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/CountryDialog.tsx" > "%BACKUP_DIR%/CountryDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/CountryDialog.tsx
) else (
    echo Recuperado CountryDialog.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/CreateSubscriptionPlan.tsx" > "%BACKUP_DIR%/CreateSubscriptionPlan.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/CreateSubscriptionPlan.tsx
) else (
    echo Recuperado CreateSubscriptionPlan.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/CreateTenant.tsx" > "%BACKUP_DIR%/CreateTenant.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/CreateTenant.tsx
) else (
    echo Recuperado CreateTenant.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/CreateTenantAdmin.tsx" > "%BACKUP_DIR%/CreateTenantAdmin.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/CreateTenantAdmin.tsx
) else (
    echo Recuperado CreateTenantAdmin.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/CurrenciesSettings.tsx" > "%BACKUP_DIR%/CurrenciesSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/CurrenciesSettings.tsx
) else (
    echo Recuperado CurrenciesSettings.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/CurrencyDialog.tsx" > "%BACKUP_DIR%/CurrencyDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/CurrencyDialog.tsx
) else (
    echo Recuperado CurrencyDialog.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/EditSubscriptionPlan.tsx" > "%BACKUP_DIR%/EditSubscriptionPlan.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/EditSubscriptionPlan.tsx
) else (
    echo Recuperado EditSubscriptionPlan.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/EditTenant.tsx" > "%BACKUP_DIR%/EditTenant.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/EditTenant.tsx
) else (
    echo Recuperado EditTenant.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/ErrorReports.tsx" > "%BACKUP_DIR%/ErrorReports.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/ErrorReports.tsx
) else (
    echo Recuperado ErrorReports.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/GlobalIntegrationsManager.tsx" > "%BACKUP_DIR%/GlobalIntegrationsManager.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/GlobalIntegrationsManager.tsx
) else (
    echo Recuperado GlobalIntegrationsManager.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/GlobalSettings.tsx" > "%BACKUP_DIR%/GlobalSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/GlobalSettings.tsx
) else (
    echo Recuperado GlobalSettings.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/HttpMethodSettings.tsx" > "%BACKUP_DIR%/HttpMethodSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/HttpMethodSettings.tsx
) else (
    echo Recuperado HttpMethodSettings.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/IntegrationProviderForm.tsx" > "%BACKUP_DIR%/IntegrationProviderForm.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/IntegrationProviderForm.tsx
) else (
    echo Recuperado IntegrationProviderForm.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/Integrations.tsx" > "%BACKUP_DIR%/Integrations.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/Integrations.tsx
) else (
    echo Recuperado Integrations.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/LocaleDialog.tsx" > "%BACKUP_DIR%/LocaleDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/LocaleDialog.tsx
) else (
    echo Recuperado LocaleDialog.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/LocalizationDialog.tsx" > "%BACKUP_DIR%/LocalizationDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/LocalizationDialog.tsx
) else (
    echo Recuperado LocalizationDialog.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/LocalizationsSettings.tsx" > "%BACKUP_DIR%/LocalizationsSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/LocalizationsSettings.tsx
) else (
    echo Recuperado LocalizationsSettings.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/PerformanceMetrics.tsx" > "%BACKUP_DIR%/PerformanceMetrics.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/PerformanceMetrics.tsx
) else (
    echo Recuperado PerformanceMetrics.tsx
)

git show 34df48dc959fa0d69501ff51e7bc507ef246b6fc:"src/pages/Superadmin/PersonalInfoTab.tsx" > "%BACKUP_DIR%/PersonalInfoTab.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/PersonalInfoTab.tsx
) else (
    echo Recuperado PersonalInfoTab.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/PlanPricingManager.tsx" > "%BACKUP_DIR%/PlanPricingManager.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/PlanPricingManager.tsx
) else (
    echo Recuperado PlanPricingManager.tsx
)

git show 34df48dc959fa0d69501ff51e7bc507ef246b6fc:"src/pages/Superadmin/ProfileSettings.tsx" > "%BACKUP_DIR%/ProfileSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/ProfileSettings.tsx
) else (
    echo Recuperado ProfileSettings.tsx
)

git show 34df48dc959fa0d69501ff51e7bc507ef246b6fc:"src/pages/Superadmin/RegionalSettingsTab.tsx" > "%BACKUP_DIR%/RegionalSettingsTab.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/RegionalSettingsTab.tsx
) else (
    echo Recuperado RegionalSettingsTab.tsx
)

git show 34df48dc959fa0d69501ff51e7bc507ef246b6fc:"src/pages/Superadmin/SecurityTab.tsx" > "%BACKUP_DIR%/SecurityTab.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/SecurityTab.tsx
) else (
    echo Recuperado SecurityTab.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/SubscriptionPlans.tsx" > "%BACKUP_DIR%/SubscriptionPlans.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/SubscriptionPlans.tsx
) else (
    echo Recuperado SubscriptionPlans.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/SuperadminLayout.tsx" > "%BACKUP_DIR%/SuperadminLayout.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/SuperadminLayout.tsx
) else (
    echo Recuperado SuperadminLayout.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/SuperadminStats.tsx" > "%BACKUP_DIR%/SuperadminStats.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/SuperadminStats.tsx
) else (
    echo Recuperado SuperadminStats.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/SystemAlerts.tsx" > "%BACKUP_DIR%/SystemAlerts.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/SystemAlerts.tsx
) else (
    echo Recuperado SystemAlerts.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/TenantDetails.tsx" > "%BACKUP_DIR%/TenantDetails.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/TenantDetails.tsx
) else (
    echo Recuperado TenantDetails.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/TenantIntegrationManager.tsx" > "%BACKUP_DIR%/TenantIntegrationManager.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/TenantIntegrationManager.tsx
) else (
    echo Recuperado TenantIntegrationManager.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/TenantUsersManager.tsx" > "%BACKUP_DIR%/TenantUsersManager.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/TenantUsersManager.tsx
) else (
    echo Recuperado TenantUsersManager.tsx
)

git show 5a0bd5a88d7d1bea863d87298094455575f145c5:"src/pages/Superadmin/TenantsList.tsx" > "%BACKUP_DIR%/TenantsList.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/TenantsList.tsx
) else (
    echo Recuperado TenantsList.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/TestResultDialog.tsx" > "%BACKUP_DIR%/TestResultDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/TestResultDialog.tsx
) else (
    echo Recuperado TestResultDialog.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/components/TenantInvoicesList.tsx" > "%BACKUP_DIR%/TenantInvoicesList.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/components/TenantInvoicesList.tsx
) else (
    echo Recuperado TenantInvoicesList.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/components/TenantSubscriptionsManager.tsx" > "%BACKUP_DIR%/TenantSubscriptionsManager.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/components/TenantSubscriptionsManager.tsx
) else (
    echo Recuperado TenantSubscriptionsManager.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/config/navigation.ts" > "%BACKUP_DIR%/navigation.ts"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/config/navigation.ts
) else (
    echo Recuperado navigation.ts
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/hooks/usePlatforms.ts" > "%BACKUP_DIR%/usePlatforms.ts"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/hooks/usePlatforms.ts
) else (
    echo Recuperado usePlatforms.ts
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/hooks/useSuperadminDashboardStats.ts" > "%BACKUP_DIR%/useSuperadminDashboardStats.ts"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/hooks/useSuperadminDashboardStats.ts
) else (
    echo Recuperado useSuperadminDashboardStats.ts
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/hooks/useSuperadminTenants.ts" > "%BACKUP_DIR%/useSuperadminTenants.ts"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/hooks/useSuperadminTenants.ts
) else (
    echo Recuperado useSuperadminTenants.ts
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/index.tsx" > "%BACKUP_DIR%/index.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/index.tsx
) else (
    echo Recuperado index.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/layouts/MainLayout.tsx" > "%BACKUP_DIR%/MainLayout.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/layouts/MainLayout.tsx
) else (
    echo Recuperado MainLayout.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/AccessManagement/index.tsx" > "%BACKUP_DIR%/AccessManagement.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/AccessManagement/index.tsx
) else (
    echo Recuperado AccessManagement.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Platforms/AssetCatalog.tsx" > "%BACKUP_DIR%/AssetCatalog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Platforms/AssetCatalog.tsx
) else (
    echo Recuperado AssetCatalog.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Platforms/CreatePlatform.tsx" > "%BACKUP_DIR%/CreatePlatform.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Platforms/CreatePlatform.tsx
) else (
    echo Recuperado CreatePlatform.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Platforms/EditPlatform.tsx" > "%BACKUP_DIR%/EditPlatform.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Platforms/EditPlatform.tsx
) else (
    echo Recuperado EditPlatform.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Platforms/PlanForm.tsx" > "%BACKUP_DIR%/PlanForm.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Platforms/PlanForm.tsx
) else (
    echo Recuperado PlanForm.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Platforms/PlatformForm.tsx" > "%BACKUP_DIR%/PlatformForm.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Platforms/PlatformForm.tsx
) else (
    echo Recuperado PlatformForm.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Platforms/PlatformPlans.tsx" > "%BACKUP_DIR%/PlatformPlans.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Platforms/PlatformPlans.tsx
) else (
    echo Recuperado PlatformPlans.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Platforms/PlatformSettings.tsx" > "%BACKUP_DIR%/PlatformSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Platforms/PlatformSettings.tsx
) else (
    echo Recuperado PlatformSettings.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Platforms/PlatformsList.tsx" > "%BACKUP_DIR%/PlatformsList.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Platforms/PlatformsList.tsx
) else (
    echo Recuperado PlatformsList.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/SetupSuperadmin.tsx" > "%BACKUP_DIR%/SetupSuperadmin.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/SetupSuperadmin.tsx
) else (
    echo Recuperado SetupSuperadmin.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/SystemCatalogs/CountriesSettings.tsx" > "%BACKUP_DIR%/CountriesSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/SystemCatalogs/CountriesSettings.tsx
) else (
    echo Recuperado CountriesSettings.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/SystemCatalogs/CountryDialog.tsx" > "%BACKUP_DIR%/CountryDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/SystemCatalogs/CountryDialog.tsx
) else (
    echo Recuperado CountryDialog.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/SystemCatalogs/CurrenciesSettings.tsx" > "%BACKUP_DIR%/CurrenciesSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/SystemCatalogs/CurrenciesSettings.tsx
) else (
    echo Recuperado CurrenciesSettings.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/SystemCatalogs/CurrencyDialog.tsx" > "%BACKUP_DIR%/CurrencyDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/SystemCatalogs/CurrencyDialog.tsx
) else (
    echo Recuperado CurrencyDialog.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/SystemCatalogs/LocalizationDialog.tsx" > "%BACKUP_DIR%/LocalizationDialog.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/SystemCatalogs/LocalizationDialog.tsx
) else (
    echo Recuperado LocalizationDialog.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/SystemCatalogs/LocalizationsSettings.tsx" > "%BACKUP_DIR%/LocalizationsSettings.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/SystemCatalogs/LocalizationsSettings.tsx
) else (
    echo Recuperado LocalizationsSettings.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/SystemCatalogs/SystemCatalogs.tsx" > "%BACKUP_DIR%/SystemCatalogs.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/SystemCatalogs/SystemCatalogs.tsx
) else (
    echo Recuperado SystemCatalogs.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Tenants/CreateTenant.tsx" > "%BACKUP_DIR%/CreateTenant.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Tenants/CreateTenant.tsx
) else (
    echo Recuperado CreateTenant.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Tenants/CreateTenantAdmin.tsx" > "%BACKUP_DIR%/CreateTenantAdmin.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Tenants/CreateTenantAdmin.tsx
) else (
    echo Recuperado CreateTenantAdmin.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Tenants/EditTenant.tsx" > "%BACKUP_DIR%/EditTenant.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Tenants/EditTenant.tsx
) else (
    echo Recuperado EditTenant.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Tenants/TenantDetails.tsx" > "%BACKUP_DIR%/TenantDetails.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Tenants/TenantDetails.tsx
) else (
    echo Recuperado TenantDetails.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Tenants/TenantIntegrationManager.tsx" > "%BACKUP_DIR%/TenantIntegrationManager.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Tenants/TenantIntegrationManager.tsx
) else (
    echo Recuperado TenantIntegrationManager.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/pages/Tenants/TenantList.tsx" > "%BACKUP_DIR%/TenantList.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/pages/Tenants/TenantList.tsx
) else (
    echo Recuperado TenantList.tsx
)

git show 5cf826e333c04036f4f8492776404a3ce9f4b2f8:"src/pages/Superadmin/routes/index.tsx" > "%BACKUP_DIR%/routes.tsx"
if %errorlevel% neq 0 (
    echo Error al recuperar src/pages/Superadmin/routes/index.tsx
) else (
    echo Recuperado routes.tsx
)

echo.
echo Proceso de recuperacion de archivos finalizado.
endlocal