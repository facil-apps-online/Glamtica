import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { useCurrencies, Currency } from '@/hooks/useCurrencies';

export const usePriceFormat = (publicCurrencyId?: string) => {
  const { profile, loading: isAuthLoading, isAuthenticated } = useAuth();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  const { data: allCurrencies, isLoading: isLoadingCurrencies } = useCurrencies();

  const currentCurrencyDetails = useMemo(() => {
    let details: Currency | undefined;

    if (isAuthenticated) {
      const tenantDefaultCurrencyId = settings?.default_currency_id;
      const authenticatedCurrencyId = profile?.currency_id || tenantDefaultCurrencyId;
      details = allCurrencies?.find(c => c.id === authenticatedCurrencyId);
    } else {
      // For public users, find currency details using publicCurrencyId from allCurrencies
      if (allCurrencies && publicCurrencyId) {
        details = allCurrencies.find(c => c.id === publicCurrencyId);
      }
      if (!details) {
        details = allCurrencies?.find(c => c.code === 'USD'); // Fallback
      }
    }
    return details;
  }, [isAuthenticated, settings, profile, allCurrencies, publicCurrencyId]);

  const symbol = currentCurrencyDetails?.symbol || '$';
  const decimalPlaces = currentCurrencyDetails?.decimal_places ?? 2;
  const symbolPosition = currentCurrencyDetails?.symbol_position || 'before';
  const decimalSeparator = currentCurrencyDetails?.decimal_separator || '.';
  const thousandsSeparator = currentCurrencyDetails?.thousands_separator || ',';

  const formatPrice = useMemo(() => {
    return (price: number): string => {
      if (typeof price !== 'number' || isNaN(price)) {
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
  }, [decimalPlaces, symbol, symbolPosition, decimalSeparator, thousandsSeparator]);

  const isLoading = isAuthLoading || isLoadingSettings || isLoadingCurrencies;

  // Return a stable function during loading states to avoid crashes
  if (isLoading) {
    return {
      formatPrice: () => '',
      symbol: '...',
      isLoading: true,
    };
  }

  return { formatPrice, symbol, isLoading: false };
};
