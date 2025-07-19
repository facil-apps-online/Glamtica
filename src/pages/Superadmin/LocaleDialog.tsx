import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguages, useCountries, useCreateLocale, Language, Country } from '@/hooks/useLocalization';

const formSchema = z.object({
  language_id: z.string().min(1, "El idioma es requerido."),
  country_id: z.string().min(1, "El país es requerido."),
});

interface LocaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocaleDialog({ isOpen, onClose }: LocaleDialogProps) {
  const { data: languages = [], isLoading: isLoadingLanguages } = useLanguages();
  const { data: countries = [], isLoading: isLoadingCountries } = useCountries();
  const createLocaleMutation = useCreateLocale();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedLanguage || !selectedCountry) return;
    const locale_code = `${selectedLanguage.iso_code}-${selectedCountry.iso_code}`;
    
    await createLocaleMutation.mutateAsync({ ...values, locale_code });
    form.reset();
    onClose();
  };

  const handleLanguageChange = (id: string) => {
    setSelectedLanguage(languages.find(lang => lang.id === id) || null);
    form.setValue('language_id', id);
  };

  const handleCountryChange = (id: string) => {
    setSelectedCountry(countries.find(country => country.id === id) || null);
    form.setValue('country_id', id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Localización</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="language_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idioma</FormLabel>
                  <Select onValueChange={handleLanguageChange} value={field.value || ''} disabled={isLoadingLanguages}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un idioma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select onValueChange={handleCountryChange} value={field.value || ''} disabled={isLoadingCountries}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un país" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.id} value={country.id}>{country.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={createLocaleMutation.isPending}>
                {createLocaleMutation.isPending ? 'Creando...' : 'Crear Localización'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}