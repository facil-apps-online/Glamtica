import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PaymentSuccess = () => {
  return (
    <div className="container mx-auto p-4 max-w-md flex items-center justify-center min-h-[60vh]">
      <Card className="w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="mt-4">¡Pago Exitoso!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Tu transacción ha sido procesada correctamente. Gracias por tu pago.
          </p>
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Volver al Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
