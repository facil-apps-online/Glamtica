import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { usePublicRegistrationData } from '@/hooks/usePublicRegistrationData';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { AddressAutocompleteInput } from '@/components/AddressAutocompleteInput';
import { MapDisplay } from '@/components/MapDisplay';
import { PhoneInput } from '@/components/PhoneInput';
import Logo from '@/assets/images/glamtica.app.png';
import { CheckCircle, XCircle } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

const passwordSchema = z.string()
  .min(8, "Debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")
  .regex(/[!@#$%^&*]/, "Debe contener al menos un carácter especial (!@#$%^&*)");

const formSchema = z.object({
  name: z.string().min(2, "El nombre comercial es requerido."),
  country_id: z.string().min(1, "El país es requerido."),
  default_language_code: z.string().min(1, "El idioma es requerido."),
  default_currency_id: z.string().min(1, "La moneda es requerida."),
  default_timezone: z.string().min(1, "La zona horaria es requerida."),
  contact_phone: z.string().min(1, "El teléfono de contacto es requerido."),
  whatsapp_phone: z.string().min(1, "El WhatsApp es requerido."),
  commercial_email: z.string().email("Debe ser un email válido."),
  legal_name: z.string().min(1, "La razón social es requerida."),
  tax_id: z.string().min(1, "El ID fiscal es requerido."),
  billing_address: z.string().min(1, "La dirección de facturación es requerida."),
  einvoicing_email: z.string().email("El email para facturación electrónica es requerido."),
  physical_address_line1: z.string().min(1, "La dirección es requerida."),
  physical_address_line2: z.string().optional(),
  physical_city: z.string().min(1, "La ciudad es requerida."),
  physical_state: z.string().min(1, "El estado/provincia es requerido."),
  physical_postal_code: z.string().min(1, "El código postal es requerido."),
  website: z.string().optional(),
  latitude: z.number().min(-90).max(90).nullable().refine(val => val !== null, { message: "La ubicación en el mapa es requerida." }),
  longitude: z.number().min(-180).max(180).nullable().refine(val => val !== null, { message: "La ubicación en el mapa es requerida." }),
  admin_email: z.string().email("El email del administrador es requerido."),
  admin_password: passwordSchema,
  admin_confirm_password: passwordSchema,
  recaptcha_token: z.string().min(1, "Por favor, completa el CAPTCHA."),
}).refine(data => data.admin_password === data.admin_confirm_password, {
  message: "Las contraseñas no coinciden",
  path: ["admin_confirm_password"],
});

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const PasswordRequirement = ({ isValid, text }: { isValid: boolean; text: string }) => (
  <div className={`flex items-center text-sm ${isValid ? 'text-green-600' : 'text-muted-foreground'}`}>
    {isValid ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
    {text}
  </div>
);

export default function RegisterTenant() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: publicData, isLoading, isError } = usePublicRegistrationData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usePhysicalAsBilling, setUsePhysicalAsBilling] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      country_id: '',
      default_language_code: '',
      default_currency_id: '',
      default_timezone: '',
      contact_phone: '',
      whatsapp_phone: '',
      commercial_email: '',
      legal_name: '',
      tax_id: '',
      billing_address: '',
      einvoicing_email: '',
      physical_address_line1: '',
      physical_address_line2: '',
      physical_city: '',
      physical_state: '',
      physical_postal_code: '',
      website: '',
      latitude: null,
      longitude: null,
      admin_email: '',
      admin_password: '',
      admin_confirm_password: '',
      recaptcha_token: '',
    },
    mode: 'onChange',
  });

  const watchedCountryId = form.watch('country_id');
  const watchedLat = form.watch('latitude');
  const watchedLng = form.watch('longitude');
  const physicalAddressLine1 = form.watch('physical_address_line1');
  const physicalCity = form.watch('physical_city');
  const physicalState = form.watch('physical_state');
  const physicalPostalCode = form.watch('physical_postal_code');
  const adminPassword = form.watch('admin_password');

  const passwordChecks = {
    length: (adminPassword || '').length >= 8,
    uppercase: /[A-Z]/.test(adminPassword),
    lowercase: /[a-z]/.test(adminPassword),
    number: /[0-9]/.test(adminPassword),
    specialChar: /[!@#$%^&*]/.test(adminPassword),
  };

  useEffect(() => {
    if (usePhysicalAsBilling) {
      const fullAddress = [physicalAddressLine1, physicalCity, physicalState, physicalPostalCode]
        .filter(Boolean)
        .join(', ');
      form.setValue('billing_address', fullAddress);
    } else {
      form.setValue('billing_address', '');
    }
  }, [usePhysicalAsBilling, physicalAddressLine1, physicalCity, physicalState, physicalPostalCode, form]);

  const countryOptions = useMemo(() => publicData?.countries.map(c => ({ value: c.id, label: c.name })) || [], [publicData]);
  const languageOptions = useMemo(() => publicData?.languages.map(l => ({ value: l.iso_code, label: l.name })) || [], [publicData]);
  const currencyOptions = useMemo(() => publicData?.currencies.map(c => ({ value: c.id, label: `${c.name} (${c.symbol})` })) || [], [publicData]);
  const timezoneOptions = useMemo(() => publicData?.timezones.map(t => ({ value: t.name, label: t.name })) || [], [publicData]);

  const countryRestriction = useMemo(() => {
    if (!watchedCountryId || !publicData?.countries) return '';
    return publicData.countries.find(c => c.id === watchedCountryId)?.iso_code || '';
  }, [watchedCountryId, publicData]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue('latitude', position.coords.latitude);
          form.setValue('longitude', position.coords.longitude);
        },
        () => {
          toast({ title: 'Aviso', description: 'No se pudo obtener tu ubicación actual. Por favor, búscala en el mapa.', variant: 'default' });
        }
      );
    }
  }, [toast, form]);

  useEffect(() => {
    if (watchedCountryId && publicData) {
      const country = publicData.countries.find(c => c.id === watchedCountryId);
      if (country) {
        if (country.default_localization_id) {
            const lang = publicData.languages.find(l => l.id === country.default_localization_id);
            if(lang) form.setValue('default_language_code', lang.iso_code);
        }
        if (country.default_currency_id) {
          form.setValue('default_currency_id', country.default_currency_id);
        }
        if (country.timezone) {
          form.setValue('default_timezone', country.timezone);
        }
      }
    }
  }, [watchedCountryId, publicData, form]);

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    const get = (type: string) => place.address_components?.find(c => c.types.includes(type))?.long_name || '';
    form.setValue('physical_address_line1', `${get('route')} ${get('street_number')}`.trim());
    form.setValue('physical_city', get('locality'));
    form.setValue('physical_state', get('administrative_area_level_1'));
    form.setValue('physical_postal_code', get('postal_code'));
    if (place.geometry?.location) {
      form.setValue('latitude', place.geometry.location.lat());
      form.setValue('longitude', place.geometry.location.lng());
    }
    const countryIso = place.address_components?.find(c => c.types.includes('country'))?.short_name;
    if (countryIso && publicData?.countries) {
      const selectedCountry = publicData.countries.find(c => c.iso_code === countryIso);
      if (selectedCountry) form.setValue('country_id', selectedCountry.id);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('register-tenant', { body: values });
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);
      if (data.success === false) throw new Error(data.message);
      toast({
        title: '¡Registro Exitoso!',
        description: 'Tu negocio ha sido registrado. Revisa tu email para verificar tu cuenta y luego inicia sesión.',
      });
      navigate('/auth');
    } catch (error: any) {
      toast({ title: 'Error en el Registro', description: error.message, variant: 'destructive' });
      const recaptchaComponent = form.control.getFieldState('recaptcha_token');
      // @ts-ignore
      if (recaptchaComponent.ref?.current) {
        // @ts-ignore
        recaptchaComponent.ref.current.reset();
      }
      form.setValue('recaptcha_token', '');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Cargando...</div>;
  if (isError) return <div>Error al cargar los datos necesarios para el registro. Por favor, intenta de nuevo más tarde.</div>;
  if (!RECAPTCHA_SITE_KEY) return <div>Error de configuración: La clave de reCAPTCHA no está disponible.</div>

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="h-screen w-full bg-brand-primary lg:relative"
    >
      {/* Columna Izquierda - Panel de Bienvenida */}
      <div className="hidden lg:absolute lg:left-0 lg:top-0 lg:w-1/2 lg:h-full lg:flex lg:flex-col lg:items-center lg:justify-center p-10 text-white">
        <img src={Logo} alt="Glamtica.app Logo" className="w-48 h-48 mb-6" />
        <h1 className="text-4xl font-bold text-center">Crea tu Espacio en Glamtica.app</h1>
        <p className="mt-4 text-lg text-center text-gray-300">Únete a nuestra plataforma y lleva la gestión de tu negocio al siguiente nivel.</p>
      </div>

      {/* Columna Derecha - Formulario */}
      <div className="w-full lg:absolute lg:left-1/2 lg:w-1/2 lg:top-0 lg:h-full lg:overflow-y-auto flex items-start justify-center p-6 sm:p-12 lg:bg-background">
        <div className="w-full max-w-4xl">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={Logo} alt="Glamtica.app Logo" className="w-36 h-36" />
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card className="border-none shadow-none lg:border lg:shadow-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">Completa tu Registro</CardTitle>
                  <CardDescription>Un último paso para configurar tu negocio y empezar a crecer.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Información Principal</h3>
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre Comercial</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Configuración Regional</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller name="country_id" control={form.control} render={({ field }) => (<FormItem><FormLabel>País</FormLabel><SearchableSelect options={countryOptions} value={countryOptions.find(c => c.value === field.value) || null} onChange={(option) => field.onChange(option?.value)} placeholder="Selecciona" /></FormItem>)} />
                      <Controller name="default_language_code" control={form.control} render={({ field }) => (<FormItem><FormLabel>Idioma</FormLabel><SearchableSelect options={languageOptions} value={languageOptions.find(l => l.value === field.value) || null} onChange={(option) => field.onChange(option?.value)} placeholder="Selecciona" /></FormItem>)} />
                      <Controller name="default_currency_id" control={form.control} render={({ field }) => (<FormItem><FormLabel>Moneda</FormLabel><SearchableSelect options={currencyOptions} value={currencyOptions.find(c => c.value === field.value) || null} onChange={(option) => field.onChange(option?.value)} placeholder="Selecciona" /></FormItem>)} />
                      <Controller name="default_timezone" control={form.control} render={({ field }) => (<FormItem><FormLabel>Zona Horaria</FormLabel><SearchableSelect options={timezoneOptions} value={timezoneOptions.find(t => t.value === field.value) || null} onChange={(option) => field.onChange(option?.value)} placeholder="Selecciona" /></FormItem>)} />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Dirección Física y Sitio Web</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormItem><FormLabel>Buscar Dirección</FormLabel><FormControl><AddressAutocompleteInput onPlaceSelected={handlePlaceSelected} countryRestriction={countryRestriction} /></FormControl><FormMessage /></FormItem>
                        <FormField control={form.control} name="physical_address_line1" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="physical_address_line2" render={({ field }) => (<FormItem><FormLabel>Dirección (Línea 2, Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="physical_city" render={({ field }) => (<FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="physical_state" render={({ field }) => (<FormItem><FormLabel>Estado/Provincia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="physical_postal_code" render={({ field }) => (<FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Sitio Web (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                      {watchedLat !== null && watchedLng !== null && (<div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden"><MapDisplay latitude={watchedLat} longitude={watchedLng} /></div>)}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Información de Contacto y Fiscal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="contact_phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><PhoneInput {...field} defaultCountryId={countryRestriction} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="whatsapp_phone" render={({ field }) => (<FormItem><FormLabel>WhatsApp</FormLabel><FormControl><PhoneInput {...field} defaultCountryId={countryRestriction} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="commercial_email" render={({ field }) => (<FormItem><FormLabel>Email Comercial</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="legal_name" render={({ field }) => (<FormItem><FormLabel>Razón Social</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="tax_id" render={({ field }) => (<FormItem><FormLabel>ID Fiscal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="einvoicing_email" render={({ field }) => (<FormItem><FormLabel>Email Fact. Electrónica</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <Checkbox id="use-physical-address" checked={usePhysicalAsBilling} onCheckedChange={(checked) => setUsePhysicalAsBilling(Boolean(checked))} />
                      <label htmlFor="use-physical-address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Usar la dirección física como dirección de facturación
                      </label>
                    </div>
                    {!usePhysicalAsBilling && (
                      <div className="mt-4">
                        <FormField control={form.control} name="billing_address" render={({ field }) => (<FormItem><FormLabel>Dirección de Facturación</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h3 className="text-lg font-semibold mb-4">Crea tu Cuenta de Administrador</h3>
                    <p className="text-sm text-muted-foreground mb-4">Estos serán tus datos para iniciar sesión en la plataforma.</p>
                    <div className="mb-6">
                        <FormField control={form.control} name="admin_email" render={({ field }) => (<FormItem><FormLabel>Email de Administrador</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <FormField control={form.control} name="admin_password" render={({ field }) => (<FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="admin_confirm_password" render={({ field }) => (<FormItem><FormLabel>Confirmar Contraseña</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="space-y-2 pt-2 text-sm">
                            <p className="font-semibold mb-2">La contraseña debe contener:</p>
                            <PasswordRequirement isValid={passwordChecks.length} text="Al menos 8 caracteres" />
                            <PasswordRequirement isValid={passwordChecks.uppercase} text="Al menos una letra mayúscula" />
                            <PasswordRequirement isValid={passwordChecks.lowercase} text="Al menos una letra minúscula" />
                            <PasswordRequirement isValid={passwordChecks.number} text="Al menos un número" />
                            <PasswordRequirement isValid={passwordChecks.specialChar} text="Al menos un carácter especial (!@#$%^&*)" />
                        </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                    <div className="max-w-full overflow-hidden flex justify-center">
                      <div className="scale-[0.77] sm:scale-100 origin-center">
                        <Controller name="recaptcha_token" control={form.control} render={({ field }) => (<ReCAPTCHA sitekey={RECAPTCHA_SITE_KEY} onChange={(token) => field.onChange(token || '')} />)} />
                      </div>
                    </div>
                    <FormField control={form.control} name="recaptcha_token" render={() => <FormMessage />} />
                  </div>

                  <div className="text-center pt-4">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? 'Registrando...' : 'Finalizar Registro y Crear Cuenta'}
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center text-sm mt-6">
                  <p>¿Ya tienes una cuenta?&nbsp;
                    <Link to="/auth" className="font-semibold text-brand-primary hover:underline">
                      Inicia Sesión Aquí
                    </Link>
                  </p>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </motion.div>
  );
}