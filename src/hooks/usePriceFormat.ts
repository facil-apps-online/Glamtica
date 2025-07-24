import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useCurrencies } from '@/hooks/useCurrencies';

export const usePriceFormat = () => {
  const { profile, loading: isAuthLoading } = useAuth();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();

  const formatPrice = useMemo(() => {
    if (isAuthLoading || isLoadingSettings || isLoadingCurrencies) {
      return (price: number) => `${price.toFixed(2)}...`;
    }

    const tenantDefaultCurrencyId = settings?.find(s => s.key === 'default_currency_id')?.value;
    const finalCurrencyId = profile?.currency_id || tenantDefaultCurrencyId;

    const currencyDetails = currencies?.find(c => c.id === finalCurrencyId);

    const symbol = currencyDetails?.symbol || '$';
    const decimalPlaces = currencyDetails?.decimal_places ?? 2;
    const symbolPosition = currencyDetails?.symbol_position || 'before';
    const decimalSeparator = currencyDetails?.decimal_separator || '.';
    const thousandsSeparator = currencyDetails?.thousands_separator || ',';

    return (price: number): string => {
      if (typeof price !== 'number') {
        price = 0;
      }
      
      const fixedPrice = price.toFixed(decimalPlaces);
      const [integerPart, decimalPart] = fixedPrice.split('.');
      
      const formattedInteger = integerPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        thousandsSeparator
      );
      
      const formattedNumber = decimalPlaces > 0 
        ? `${formattedInteger}${decimalSeparator}${decimalPart}`
        : formattedInteger;

      if (symbolPosition === 'after') {
        return `${formattedNumber}${symbol}`;
      }
      return `${symbol}${formattedNumber}`;
    };
  }, [profile, isAuthLoading, settings, currencies, isLoadingSettings, isLoadingCurrencies]);

  return { formatPrice };
};