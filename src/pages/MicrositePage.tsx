import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicAction } from '@/lib/fetchPublicAction';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Phone, Globe } from 'lucide-react';

const MicrositePageSkeleton = () => (
  <div className="bg-gray-50 min-h-screen p-8">
    <div className="max-w-4xl mx-auto">
      <header className="text-center mb-12">
        <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
        <Skeleton className="h-10 w-3/4 mx-auto" />
      </header>
      <div className="space-y-8">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-48 w-full" />
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const MicrositePage = () => {
  const { countryIso, slug } = useParams<{ countryIso: string; slug: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['microsite', countryIso, slug],
    queryFn: () => fetchPublicAction('get_microsite_data', { country_iso_code: countryIso, slug }),
    enabled: !!countryIso && !!slug,
  });

  if (isLoading) {
    return <MicrositePageSkeleton />;
  }

  if (error || !data || data.error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center text-center p-4">
        <div>
          <h2 className="text-2xl font-bold text-red-600">No Encontrado</h2>
          <p className="text-gray-600 mt-2">La página que buscas no existe o no está disponible.</p>
        </div>
      </div>
    );
  }
  
  const { tenant, branches } = data;

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <img
            src={tenant.logo_base64 || `https://ui-avatars.com/api/?name=${encodeURIComponent(tenant.name)}&background=random`}
            alt={tenant.name}
            className="w-28 h-28 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
          />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">{tenant.name}</h1>
        </header>

        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-center text-gray-800">Nuestras Sucursales</h2>
          {branches && branches.length > 0 ? (
            branches.map((branch: any) => (
              <Card key={branch.id} className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                {branch.primary_photo_base64 && (
                  <img
                    src={branch.primary_photo_base64}
                    alt={`Foto de ${branch.name}`}
                    className="w-full h-48 object-cover"
                  />
                )}
                <CardHeader>
                  <CardTitle>{branch.name}</CardTitle>
                  <CardDescription>{branch.address}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4 text-sm">
                  {branch.contact_phone && (
                    <a href={`tel:${branch.contact_phone}`} className="flex items-center gap-2 text-gray-600 hover:text-purple-700">
                      <Phone className="w-4 h-4" />
                      {branch.contact_phone}
                    </a>
                  )}
                  {branch.whatsapp_phone && (
                    <a href={`https://wa.me/${branch.whatsapp_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-purple-700">
                      <Globe className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500">No hay sucursales para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MicrositePage;