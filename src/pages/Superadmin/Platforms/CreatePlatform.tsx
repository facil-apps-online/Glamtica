import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { PlatformForm, PlatformFormValues } from './PlatformForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreatePlatform() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (values: PlatformFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('superadmin-actions', {
        body: { action: 'create_platform', payload: values },
      });

      if (error) throw new Error(error.message);

      toast({
        title: "Plataforma Creada",
        description: "La nueva plataforma ha sido creada exitosamente.",
      });
      navigate('/superadmin/platforms');
    } catch (err: any) {
      toast({
        title: "Error al crear la plataforma",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/superadmin/platforms')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Crear Nueva Plataforma</h1>
      </div>
      <div className="max-w-2xl">
        <PlatformForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}