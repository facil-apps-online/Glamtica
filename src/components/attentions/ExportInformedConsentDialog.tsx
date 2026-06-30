import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGoogleDriveImage } from '@/hooks/useGoogleDriveImage';
import { useAuth } from '@/contexts/AuthContext';
import { SignedConsent } from '@/hooks/useConsentTemplates';
import { useClientDetails } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { sanitizeHtml } from '@/lib/sanitize';

// Helper to fetch an image and convert it to a data URL
const fetchImageAsDataURL = async (url: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image for PDF:', error);
    return null;
  }
};

interface ExportInformedConsentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedConsent: SignedConsent | null;
  attention: any;
}

export const ExportInformedConsentDialog: React.FC<ExportInformedConsentDialogProps> = ({ 
  open, 
  onOpenChange, 
  signedConsent,
  attention,
}) => {
  const { session, tenant } = useAuth();
  const { toast } = useToast();
  const { displayUrl: signatureDisplayUrl } = useGoogleDriveImage(signedConsent?.signature_file_id);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { data: client } = useClientDetails(signedConsent?.client_id || '');
  
  const handlePrint = useCallback(async () => {
    if (!signedConsent || !session?.access_token || !client || !tenant) {
      toast({ title: "Error", description: "Faltan datos para generar el documento.", variant: "destructive" });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // 1. Fetch images as Base64
      const logoProxyUrl = tenant.logo_url
        ? `${import.meta.env.VITE_CORE_SUPABASE_URL}/functions/v1/proxy-google-drive-image?fileId=${tenant.logo_url}&tenantId=${tenant.id}&platformId=${import.meta.env.VITE_PLATFORM_ID}`
        : '/glamtica.app.png';
      
      const logoDataUrl = await fetchImageAsDataURL(logoProxyUrl);
      const signatureDataUrl = signatureDisplayUrl 
        ? await fetchImageAsDataURL(signatureDisplayUrl) 
        : null;

      // 2. Construct full HTML for the new window
      const cleanSignedContent = sanitizeHtml(signedConsent.signed_content);
      const fullHtml = `
        <html>
          <head>
            <title>Consentimiento Informado - ${client.name}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
            <style>
              @media print {
                @page {
                  margin: 40pt;
                }
                body { 
                  -webkit-print-color-adjust: exact; /* Chrome, Safari */
                  color-adjust: exact; /* Firefox */
                }
                #print-button { display: none; }
              }
              body { font-family: 'Roboto', Helvetica, Arial, sans-serif; font-size: 9pt; color: #333; }
              strong, b { font-weight: 700; }
            </style>
          </head>
          <body>
            <div style="width: 90%; margin: 0 auto; padding: 2rem;">
              <table style="width: 100%; padding-bottom: 10pt;">
                <tr>
                  <td style="vertical-align: top;">
                    <h1 style="font-size: 18pt; margin: 0;">${tenant.name || ''}</h1>
                    <p style="font-size: 9pt; margin: 5pt 0 0 0;">${tenant.billing_address || ''}</p>
                    <p style="font-size: 9pt; margin: 5pt 0 0 0;">NIT: ${tenant.tax_id || ''}</p>
                    <p style="font-size: 9pt; margin: 5pt 0 0 0;">Tel: ${tenant.contact_phone || ''}</p>
                  </td>
                  <td style="text-align: right; vertical-align: top;">
                    ${logoDataUrl ? `<img src="${logoDataUrl}" style="width: 120pt;" />` : ''}
                  </td>
                </tr>
              </table>
              <h2 style="font-size: 14pt; margin-top: 20pt; padding-bottom: 5pt; text-align: center;">Consentimiento Informado</h2>
              <div style="margin-top: 20pt; padding-top: 15pt;">
                ${cleanSignedContent}
              </div>
              ${signedConsent.form_data && Object.keys(signedConsent.form_data).length > 0 ? `
                <div style="margin-top: 20pt; page-break-before: auto;">
                  <h3 style="font-size: 12pt;">Datos del Formulario</h3>
                  <div style="background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 5px; padding: 10pt; font-size: 9pt;">
                    ${Object.entries(signedConsent.form_data).map(([key, value]) => `
                      <p style="margin: 0 0 5pt 0;"><strong>${key}:</strong> ${JSON.stringify(value)}</p>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              <div style="margin-top: 30pt; padding-top: 20pt; page-break-inside: avoid;">
                <h3 style="font-size: 12pt;">Firma del Cliente</h3>
                ${signatureDataUrl 
                  ? `<img src="${signatureDataUrl}" style="width: 180pt; height: 90pt; border: 1px solid #ddd;" />`
                  : '<p>Pendiente de Firma</p>'
                }
              </div>
              <div style="text-align: center; margin-top: 2rem;">
                <button id="print-button" onclick="window.print()">Imprimir o Guardar como PDF</button>
              </div>
            </div>
            <script>
              setTimeout(() => {
                window.print();
              }, 500); // Timeout to ensure images and fonts are rendered
            </script>
          </body>
        </html>
      `;

      // 3. Open a new window and write the HTML
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(fullHtml);
        printWindow.document.close();
      } else {
        throw new Error("No se pudo abrir la ventana de impresión. Revisa si tu navegador está bloqueando las ventanas emergentes.");
      }

    } catch (error: any) {
      console.error("Error preparing print view:", error);
      toast({ title: "Error al preparar la vista de impresión", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [signedConsent, session, client, tenant, signatureDisplayUrl, toast]);
  
  if (!signedConsent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ver Consentimiento Informado</DialogTitle>
          <DialogDescription>
            Visualiza el consentimiento informado firmado para la atención seleccionada.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow prose max-w-none border rounded-md p-4 overflow-y-auto space-y-4">
          {signedConsent.signed_content ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(signedConsent.signed_content) }} />
          ) : (
            <p>No se encontró contenido firmado para este consentimiento.</p>
          )}

          {signedConsent.form_data && Object.keys(signedConsent.form_data).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Datos del Formulario</h4>
              <pre className="bg-gray-100 p-2 rounded-md text-sm overflow-x-auto">
                {JSON.stringify(signedConsent.form_data, null, 2)}
              </pre>
            </div>
          )}

          {signatureDisplayUrl && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Firma</h4>
              <div className="border rounded-md p-2">
                <img src={signatureDisplayUrl} alt="Firma" className="mx-auto" />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handlePrint} disabled={isGeneratingPDF || !signedConsent}>
            {isGeneratingPDF ? 'Preparando...' : 'Imprimir / Guardar PDF'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};