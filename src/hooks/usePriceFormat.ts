import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useCurrencies } from '@/hooks/useCurrencies';

export const usePriceFormat = () => {
  const { profile, loading: isAuthLoading } = useAuth();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: currencies, isLoading: isLoadingCurrencies } = useCurrencies();

  const tenantDefaultCurrencyId = settings?.default_currency_id;
  const finalCurrencyId = profile?.currency_id || tenantDefaultCurrencyId;

  const currencyDetails = currencies?.find(c => c.id === finalCurrencyId);

  const symbol = currencyDetails?.symbol || '$';
  const decimalPlaces = currencyDetails?.decimal_places ?? 2;
  const symbolPosition = currencyDetails?.symbol_position || 'before';
  const decimalSeparator = currencyDetails?.decimal_separator || '.';
  const thousandsSeparator = currencyDetails?.thousands_separator || ',';

  const formatPrice = useMemo(() => {
    if (isAuthLoading || isLoadingSettings || isLoadingCurrencies) {
      return (price: number | undefined | null) => {
        const numericPrice = typeof price === 'number' ? price : 0;
        return `${numericPrice.toFixed(2)}...`;
      };
    }

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
  }, [profile, isAuthLoading, settings, currencies, isLoadingSettings, isLoadingCurrencies, decimalPlaces, symbol, symbolPosition, decimalSeparator, thousandsSeparator]);

  return { formatPrice, symbol };
};