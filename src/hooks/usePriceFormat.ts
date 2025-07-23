import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useCurrencies } from '@/hooks/useCurrencies';

// Este es el nuevo hook de formato de precios centralizado.
// Sigue la regla de negocio: Configuración del Usuario > Configuración del Tenant > Falla segura.
// Utiliza los detalles de formato directamente desde la tabla 'currencies'.
export const usePriceFormat = () => {
  const { user } = useAuth();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();

  const formatPrice = useMemo(() => {
    if (isLoadingSettings || isLoadingCurrencies) {
      // Mientras carga, devuelve una función placeholder
      return (price: number) => `${price.toFixed(2)}...`;
    }

    // 1. Determinar el ID de la moneda a usar (Usuario > Tenant)
    const tenantDefaultCurrencyId = settings?.find(s => s.key === 'default_currency_id')?.value;
    const finalCurrencyId = user?.currency_id || tenantDefaultCurrencyId;

    // 2. Encontrar los detalles completos de la moneda final
    const currencyDetails = currencies?.find(c => c.id === finalCurrencyId);

    // 3. Definir valores de formato, usando los de la DB o fallando de forma segura
    const symbol = currencyDetails?.symbol || '$';
    const decimalPlaces = currencyDetails?.decimal_places ?? 2;
    const symbolPosition = currencyDetails?.symbol_position || 'before';
    const decimalSeparator = currencyDetails?.decimal_separator || '.';
    const thousandsSeparator = currencyDetails?.thousands_separator || ',';

    // 4. Crear y devolver la función de formato
    return (price: number): string => {
      if (typeof price !== 'number') {
        price = 0;
      }
      
      // Formatear el número base usando los separadores de la DB
      const fixedPrice = price.toFixed(decimalPlaces);
      const [integerPart, decimalPart] = fixedPrice.split('.');
      
      const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        thousandsSeparator
      );
      
      const formattedNumber = decimalPlaces > 0 
        ? `${formattedInteger}${decimalSeparator}${decimalPart}`
        : formattedInteger;

      // Posicionar el símbolo
      if (symbolPosition === 'after') {
        return `${formattedNumber}${symbol}`; // Espacio añadido para claridad
      }
      return `${symbol}${formattedNumber}`;
    };
  }, [user, settings, currencies, isLoadingSettings, isLoadingCurrencies]);

  return { formatPrice };
};
