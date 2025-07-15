import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { usePhonePrefixes } from '@/hooks/usePhonePrefixes';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PhoneInputProps {
  value?: string | null;
  onChange: (value: string) => void;
  defaultCountryId?: string | null;
}

export const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  ({ value, onChange, defaultCountryId }, ref) => {
    const { data: prefixes, isLoading } = usePhonePrefixes();
    
    const [selectedPrefixId, setSelectedPrefixId] = useState<string | undefined>();
    const [currentNumber, setCurrentNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const defaultPrefixInfo = useMemo(() => {
      if (!prefixes) return undefined;
      const country = defaultCountryId 
        ? prefixes.find(p => p.iso_code.toLowerCase() === defaultCountryId.toLowerCase()) 
        : prefixes.find(p => p.prefix === '+1') || prefixes[0];
      return country;
    }, [defaultCountryId, prefixes]);

    useEffect(() => {
      if (prefixes && prefixes.length > 0) {
        if (value) {
          const parts = value.split(' ');
          if (parts.length > 1 && parts[0].startsWith('+')) {
            const prefixStr = parts[0];
            const foundPrefix = prefixes.find(p => p.prefix === prefixStr);
            setSelectedPrefixId(foundPrefix?.id);
            setCurrentNumber(parts.slice(1).join(' '));
          } else {
            setCurrentNumber(value);
            if (!selectedPrefixId && defaultPrefixInfo) {
              setSelectedPrefixId(defaultPrefixInfo.id);
            }
          }
        } else if (defaultPrefixInfo) {
          setSelectedPrefixId(defaultPrefixInfo.id);
          setCurrentNumber('');
        }
      }
    }, [value, prefixes, defaultPrefixInfo]);

    const handlePrefixChange = (newPrefixId: string) => {
      const selected = prefixes?.find(p => p.id === newPrefixId);
      if (selected) {
        setSelectedPrefixId(selected.id);
        if (currentNumber) {
          onChange(`${selected.prefix} ${currentNumber}`);
        }
      }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNumber = e.target.value;

      // Detectar y actualizar prefijo al escribir/pegar
      if (newNumber.startsWith('+')) {
        const parts = newNumber.split(' ');
        const potentialPrefix = parts[0];
        const foundPrefix = prefixes?.find(p => p.prefix === potentialPrefix);
        
        if (foundPrefix) {
          setSelectedPrefixId(foundPrefix.id);
          const restOfNumber = parts.slice(1).join(' ');
          setCurrentNumber(restOfNumber);
          onChange(`${foundPrefix.prefix} ${restOfNumber}`);
          return; // Salir para evitar doble actualización
        }
      }
      
      const selected = prefixes?.find(p => p.id === selectedPrefixId);
      const currentPrefix = selected?.prefix || defaultPrefixInfo?.prefix || '';
      
      setCurrentNumber(newNumber);
      onChange(`${currentPrefix} ${newNumber}`);
    };

    const filteredPrefixes = useMemo(() => {
      if (!prefixes) return [];
      const query = searchQuery.toLowerCase();
      return prefixes.filter(p =>
        p.country_name.toLowerCase().includes(query) ||
        p.prefix.includes(query)
      );
    }, [prefixes, searchQuery]);

    const selectedPrefix = useMemo(() => {
      return prefixes?.find(p => p.id === selectedPrefixId);
    }, [selectedPrefixId, prefixes]);

    return (
      <div className="flex items-center" ref={ref}>
        <Select onValueChange={handlePrefixChange} value={selectedPrefixId} disabled={isLoading}>
          <SelectTrigger className="w-[150px] rounded-r-none">
            {selectedPrefixId && selectedPrefix ? (
              <div className="flex items-center text-left">
                <img
                  src={`https://flagcdn.com/w20/${selectedPrefix.iso_code.toLowerCase()}.png`}
                  alt={`${selectedPrefix.country_name} flag`}
                  className="w-5 h-3 mr-2"
                />
                <span>{selectedPrefix.prefix}</span>
              </div>
            ) : (
              <SelectValue placeholder="Prefijo" />
            )}
          </SelectTrigger>
          <SelectContent>
            <div className="p-2">
              <Input
                placeholder="Buscar país..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            {filteredPrefixes.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center">
                  <img
                    src={`https://flagcdn.com/w20/${p.iso_code.toLowerCase()}.png`}
                    alt={`${p.country_name} flag`}
                    className="w-5 h-3 mr-2"
                  />
                  <span>{`${p.country_name} (${p.prefix})`}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="tel"
          value={currentNumber}
          onChange={handleNumberChange}
          className="rounded-l-none"
          placeholder="300 123 4567"
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
