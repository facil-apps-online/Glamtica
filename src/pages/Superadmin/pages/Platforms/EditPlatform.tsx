import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { PlatformForm, PlatformFormValues } from './PlatformForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditPlatform() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<PlatformFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchPlatform = async () => {
      if (!id) {
        setError("No se proporcionó un ID de plataforma.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('superadmin-actions', {
          body: { action: 'get_platform_by_id', payload: { platformId: id } },
        });
        if (error) throw new Error(error.message);
        setInitialData(data);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error al cargar la plataforma",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPlatform();
  }, [id, toast]);

  const handleSubmit = async (values: PlatformFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'update_platform', payload: { id, data: values } },
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Plataforma Actualizada",
        description: "La plataforma ha sido actualizada exitosamente.",
      });
      navigate('/superadmin/platforms');
    } catch (err: any) {
      toast({
        title: "Error al actualizar la plataforma",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Cargando datos de la plataforma...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!initialData) return <div>No se encontraron datos para esta plataforma.</div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/superadmin/platforms')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Editar Plataforma</h1>
      </div>
      <div className="max-w-2xl">
        <PlatformForm
          initialData={initialData}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}