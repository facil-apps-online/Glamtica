import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface AddressAutocompleteInputProps {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void;
  defaultValue?: string;
  countryRestriction?: string;
}

export function AddressAutocompleteInput({ onPlaceSelected, defaultValue, countryRestriction }: AddressAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      return;
    }

    const options: google.maps.places.AutocompleteOptions = {
      fields: ['address_components', 'geometry', 'formatted_address'],
    };

    if (countryRestriction) {
      options.componentRestrictions = { country: countryRestriction };
    }

    // Limpiar la instancia anterior si existe
    if (autocompleteRef.current) {
      // No hay un método 'destroy' directo, pero podemos desvincular el input
      // y dejar que el GC se encargue. Para asegurar, creamos una nueva instancia.
      autocompleteRef.current = null;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, options);
    autocompleteRef.current = autocomplete;

    if (defaultValue) {
      inputRef.current.value = defaultValue;
    }

    const handlePlaceChanged = () => {
      const place = autocomplete.getPlace();
      if (place && place.geometry) {
        onPlaceSelected(place);
      }
    };

    autocomplete.addListener('place_changed', handlePlaceChanged);

    return () => {
      if (autocompleteRef.current) {
        // Eliminar el listener para evitar fugas de memoria
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, [countryRestriction, defaultValue, onPlaceSelected]);

  return (
    <Input
      ref={inputRef}
      type="text"
      placeholder={countryRestriction ? "Buscar dirección en el país seleccionado..." : "Selecciona un país para buscar..."}
      defaultValue={defaultValue}
      disabled={!countryRestriction}
    />
  );
}