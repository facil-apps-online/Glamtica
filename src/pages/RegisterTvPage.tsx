
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const RegisterTvPage: React.FC = () => {
  const { registrationCode } = useParams<{ registrationCode: string }>();
  const navigate = useNavigate();
  const { currentAssignment, assignments } = useAuth();
  const { toast } = useToast();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const userBranches = assignments.filter(a => a.branch_id && a.branch_id !== '').map(a => ({ id: a.branch_id, name: a.branch_name }));

  console.log("RegisterTvPage - selectedBranchId:", selectedBranchId);
  console.log("RegisterTvPage - userBranches:", userBranches);

  useEffect(() => {
    if (userBranches.length === 1) {
      setSelectedBranchId(userBranches[0].id!);
    }
  }, [assignments]);

  const handleRegister = async () => {
    if (!registrationCode || !selectedBranchId || !currentAssignment) {
      toast({ title: "Error", description: "Faltan datos para el registro.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.rpc('register_tv', {
        p_registration_code: registrationCode,
        p_branch_id: selectedBranchId,
        p_tenant_id: currentAssignment.tenant_id,
      });

      if (error) {
        throw error;
      }

      toast({ title: "Éxito", description: "TV registrada correctamente.", variant: "success" });
      navigate('/settings/tv-management');
    } catch (err: any) {
      setError("Error al registrar la TV: " + err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex flex-col items-center justify-center p-4">
      <img src="/glamtica.app.png" alt="Glamtica Logo" className="w-40 mb-6" />
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-800">Registrar Nueva TV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-gray-600 text-center">Estás a punto de registrar la TV con el código:</p>
            <p className="text-3xl font-bold text-center bg-gray-100 text-purple-700 p-4 rounded-md mt-2">{registrationCode}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="branch-select" className="font-medium text-gray-700">Asociar a la Sucursal:</label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger id="branch-select" className="w-full">
                <SelectValue placeholder="Selecciona una sucursal" />
              </SelectTrigger>
              <SelectContent>
                {userBranches.map(branch => {
                  console.log("RegisterTvPage - SelectItem branch:", branch);
                  return (
                    <SelectItem key={branch.id} value={branch.id!}>{branch.name}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <Button onClick={handleRegister} disabled={loading || !selectedBranchId} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 rounded-lg">
            {loading ? 'Registrando...' : 'Confirmar y Activar TV'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterTvPage;
