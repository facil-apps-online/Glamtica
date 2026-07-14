import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegalPageLayout } from '@/components/LegalPageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const TermsOfService: React.FC = () => {
  return (
    <LegalPageLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Términos de Servicio / Terms of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="es" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="es">Español</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            <TabsContent value="es" className="prose max-w-none mt-4">
              <p>Última actualización: 19 de septiembre de 2025</p>
              <p>Bienvenido a Glamtica. Estos Términos de Servicio ("Términos") rigen su acceso y uso de los servicios de Glamtica (el "Servicio"). Al acceder o utilizar el Servicio, usted acepta estar sujeto a estos Términos.</p>

              <h2>1. Uso del Servicio</h2>
              <p>Usted acepta utilizar el Servicio únicamente para fines lícitos y de acuerdo con estos Términos. Usted es responsable de mantener la confidencialidad de su cuenta y contraseña y de restringir el acceso a su computadora, y acepta la responsabilidad de todas las actividades que ocurran bajo su cuenta o contraseña.</p>

              <h2>2. Propiedad Intelectual</h2>
              <p>El Servicio y su contenido original, características y funcionalidad son y seguirán siendo propiedad exclusiva de Facil Apps Online y sus licenciantes. El Servicio está protegido por derechos de autor, marcas comerciales y otras leyes tanto de Colombia como de países extranjeros.</p>

              <h2>3. Cuentas</h2>
              <p>Cuando crea una cuenta con nosotros, debe proporcionarnos información precisa, completa y actualizada en todo momento. El incumplimiento de esto constituye una violación de los Términos, lo que puede resultar en la terminación inmediata de su cuenta en nuestro Servicio.</p>

              <h2>4. Terminación</h2>
              <p>Podemos terminar o suspender su cuenta de inmediato, sin previo aviso ni responsabilidad, por cualquier motivo, incluyendo, entre otros, si incumple los Términos.</p>

              <h2>5. Limitación de Responsabilidad</h2>
              <p>En ningún caso Facil Apps Online, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo, entre otros, la pérdida de ganancias, datos, uso, buena voluntad u otras pérdidas intangibles, resultantes de (i) su acceso o uso o la imposibilidad de acceder o usar el Servicio; (ii) cualquier conducta o contenido de terceros en el Servicio; (iii) cualquier contenido obtenido del Servicio; y (iv) el acceso, uso o alteración no autorizados de sus transmisiones o contenido, ya sea basado en garantía, contrato, agravio (incluida la negligencia) o cualquier otra teoría legal, hayamos sido o no informados de la posibilidad de tales daños, e incluso si se determina que un remedio establecido en este documento ha fallado en su propósito esencial.</p>

              <h2>6. Descargo de Responsabilidad</h2>
              <p>Su uso del Servicio es bajo su propio riesgo. El Servicio se proporciona "TAL CUAL" y "SEGÚN DISPONIBILIDAD" sin garantías de ningún tipo, ya sean expresas o implícitas, incluidas, entre otras, las garantías implícitas de comerciabilidad, idoneidad para un propósito particular, no infracción o curso de ejecución.</p>

              <h2>7. Ley Aplicable</h2>
              <p>Estos Términos se regirán e interpretarán de acuerdo con las leyes de Colombia, sin tener en cuenta sus disposiciones sobre conflictos de leyes.</p>

              <h2>8. Cambios en los Términos</h2>
              <p>Nos reservamos el derecho, a nuestra entera discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que los nuevos términos entren en vigencia. Lo que constituye un cambio material se determinará a nuestra entera discreción.</p>

              <h2>9. Contáctenos</h2>
              <p>Si tiene alguna pregunta sobre estos Términos, contáctenos:</p>
              <ul>
                <li>Por correo electrónico: soporte@glamtica.app</li>
              </ul>
            </TabsContent>
            <TabsContent value="en" className="prose max-w-none mt-4">
                <p>Last updated: September 19, 2025</p>
                <p>Welcome to Glamtica. These Terms of Service ("Terms") govern your access to and use of the Glamtica services (the "Service"). By accessing or using the Service, you agree to be bound by these Terms.</p>

                <h2>1. Use of the Service</h2>
                <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer, and you agree to accept responsibility for all activities that occur under your account or password.</p>

                <h2>2. Intellectual Property</h2>
                <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Facil Apps Online and its licensors. The Service is protected by copyright, trademark, and other laws of both Colombia and foreign countries.</p>

                <h2>3. Accounts</h2>
                <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>

                <h2>4. Termination</h2>
                <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

                <h2>5. Limitation of Liability</h2>
                <p>In no event shall Facil Apps Online, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.</p>

                <h2>6. Disclaimer</h2>
                <p>Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.</p>

                <h2>7. Governing Law</h2>
                <p>These Terms shall be governed and construed in accordance with the laws of Colombia, without regard to its conflict of law provisions.</p>

                <h2>8. Changes to Terms</h2>
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

                <h2>9. Contact Us</h2>
                <p>If you have any questions about these Terms, please contact us:</p>
                <ul>
                    <li>By email: support@glamtica.app</li>
                </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </LegalPageLayout>
  );
};

export default TermsOfService;