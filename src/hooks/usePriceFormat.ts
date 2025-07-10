import { useMemo } from 'react';
import { useSettings } from '@/hooks/useSettings';

export const usePriceFormat = () => {
  const { data: settings } = useSettings();

  const formatPrice = useMemo(() => {
    const currency = settings?.find(s => s.key === 'currency')?.value || 'EUR';
    const currencySymbol = settings?.find(s => s.key === 'currency_symbol')?.value || '€';
    const currencyPosition = settings?.find(s => s.key === 'currency_position')?.value || 'before';
    const decimalPlaces = parseInt(settings?.find(s => s.key === 'decimal_places')?.value || '2');

    return (price: number): string => {
      // Formatear número con separadores de miles y decimales configurables
      const formattedNumber = new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(price);
      
      if (currencyPosition === 'after') {
        return `${formattedNumber} ${currencySymbol}`;
      }
      
      return `${currencySymbol}${formattedNumber}`;
    };
  }, [settings]);

  return { formatPrice };
};