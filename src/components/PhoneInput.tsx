import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { usePhonePrefixes } from '@/hooks/usePhonePrefixes';
import { useCountryPlaceholders } from '@/hooks/useCountryPlaceholders';
import { Input } from '@/components/ui/input';

interface PhoneInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  defaultCountryIsoCode?: string | null;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, defaultCountryIsoCode }, ref) => {
    const { data: prefixes } = usePhonePrefixes();
    const { data: placeholders } = useCountryPlaceholders(defaultCountryIsoCode);

    const [currentNumber, setCurrentNumber] = useState('');

    const dynamicPlaceholder = useMemo(() => {
      if (!placeholders || placeholders.length === 0) {
        return "300 123 4567";
      }
      return placeholders[0].value;
    }, [placeholders]);

    const defaultPrefix = useMemo(() => {
        if (!prefixes) return '';
        const country = defaultCountryIsoCode
          ? prefixes.find(p => p.iso_code === defaultCountryIsoCode) 
          : prefixes.find(p => p.prefix === '+1') || prefixes[0];
        return country?.prefix || '';
    }, [defaultCountryIsoCode, prefixes]);


    useEffect(() => {
        if (value) {
            setCurrentNumber(value);
        } else {
            setCurrentNumber('');
        }
    }, [value]);

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.value;
      setCurrentNumber(newNumber);

      if (newNumber.startsWith('+')) {
        onChange(newNumber);
      } else {
        onChange(`${defaultPrefix} ${newNumber}`);
      }
    };

    return (
        <Input
          type="tel"
          value={currentNumber}
          onChange={handleNumberChange}
          placeholder={dynamicPlaceholder}
          ref={ref}
        />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
