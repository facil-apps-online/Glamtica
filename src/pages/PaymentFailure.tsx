import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const PaymentFailure = () => {
  return (
    <div className="container mx-auto p-4 max-w-md flex items-center justify-center min-h-[60vh]">
      <Card className="w-full text-center">
        <CardHeader>
          <div className="mx-auto bg-red-100 rounded-full h-16 w-16 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="mt-4">Pago Fallido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Hubo un problema al procesar tu pago. Por favor, inténtalo de nuevo o contacta a soporte.
          </p>
          <Link to="/wompi-checkout" className="text-blue-600 hover:underline">
            Volver a intentar el pago
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailure;
