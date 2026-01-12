import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LegalPageLayout } from '@/components/LegalPageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const PrivacyPolicy: React.FC = () => {
  return (
    <LegalPageLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Política de Privacidad / Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="es" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="es">Español</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            <TabsContent value="es" className="prose max-w-none mt-4">
              <p>Última actualización: 19 de septiembre de 2025</p>
              <p>Esta Política de Privacidad describe cómo Glamtica ("nosotros", "nuestro" o "nuestra") recopila, utiliza y divulga su información personal cuando utiliza nuestro servicio (el "Servicio").</p>

              <h2>1. Recopilación y Uso de Información</h2>
              <p>Recopilamos varios tipos de información para proporcionar y mejorar nuestro Servicio. Los tipos de información personal que podemos recopilar incluyen:</p>
              <ul>
                <li><strong>Datos de Uso:</strong> Información sobre cómo se accede y utiliza el Servicio.</li>
                <li><strong>Datos Personales:</strong> Nombre, dirección de correo electrónico, número de teléfono, etc.</li>
              </ul>

              <h2>2. Uso de Datos</h2>
              <p>Glamtica utiliza los datos recopilados para diversos fines:</p>
              <ul>
                <li>Para proporcionar y mantener nuestro Servicio.</li>
                <li>Para notificarle sobre cambios en nuestro Servicio.</li>
                <li>Para permitirle participar en funciones interactivas de nuestro Servicio cuando elija hacerlo.</li>
                <li>Para proporcionar soporte al cliente.</li>
                <li>Para monitorear el uso de nuestro Servicio.</li>
                <li>Para detectar, prevenir y abordar problemas técnicos.</li>
              </ul>

              <h2>3. Divulgación de Datos</h2>
              <p>Podemos divulgar su información personal de buena fe cuando dicha acción sea necesaria para:</p>
              <ul>
                <li>Cumplir con una obligación legal.</li>
                <li>Proteger y defender los derechos o la propiedad de Glamtica.</li>
                <li>Prevenir o investigar posibles infracciones en relación con el Servicio.</li>
                <li>Proteger la seguridad personal de los usuarios del Servicio o del público.</li>
                <li>Protegerse contra la responsabilidad legal.</li>
              </ul>

              <h2>4. Seguridad de los Datos</h2>
              <p>La seguridad de sus datos es importante para nosotros, pero recuerde que ningún método de transmisión por Internet o método de almacenamiento electrónico es 100% seguro. Si bien nos esforzamos por utilizar medios comercialmente aceptables para proteger su información personal, no podemos garantizar su seguridad absoluta.</p>

              <h2>5. Enlaces a Otros Sitios</h2>
              <p>Nuestro Servicio puede contener enlaces a otros sitios que no son operados por nosotros. Si hace clic en un enlace de terceros, será dirigido al sitio de ese tercero. Le recomendamos encarecidamente que revise la Política de Privacidad de cada sitio que visite.</p>

              <h2>6. Cambios en esta Política de Privacidad</h2>
              <p>Podemos actualizar nuestra Política de Privacidad de vez en cuando. Le notificaremos cualquier cambio publicando la nueva Política de Privacidad en esta página.</p>

              <h2>7. Contáctenos</h2>
              <p>Si tiene alguna pregunta sobre esta Política de Privacidad, contáctenos:</p>
              <ul>
                <li>Por correo electrónico: soporte@glamtica.app</li>
              </ul>
            </TabsContent>
            <TabsContent value="en" className="prose max-w-none mt-4">
              <p>Last updated: September 19, 2025</p>
              <p>This Privacy Policy describes how Glamtica ("we", "us", or "our") collects, uses, and discloses your personal information when you use our service (the "Service").</p>

              <h2>1. Information Collection and Use</h2>
              <p>We collect several different types of information to provide and improve our Service. The types of personal information we may collect include:</p>
              <ul>
                <li><strong>Usage Data:</strong> Information on how the Service is accessed and used.</li>
                <li><strong>Personal Data:</strong> Name, email address, phone number, etc.</li>
              </ul>

              <h2>2. Use of Data</h2>
              <p>Glamtica uses the collected data for various purposes:</p>
              <ul>
                <li>To provide and maintain our Service.</li>
                <li>To notify you about changes to our Service.</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so.</li>
                <li>To provide customer support.</li>
                <li>To monitor the usage of our Service.</li>
                <li>To detect, prevent, and address technical issues.</li>
              </ul>

              <h2>3. Disclosure of Data</h2>
              <p>We may disclose your personal information in the good faith belief that such action is necessary to:</p>
              <ul>
                <li>To comply with a legal obligation.</li>
                <li>To protect and defend the rights or property of Glamtica.</li>
                <li>To prevent or investigate possible wrongdoing in connection with the Service.</li>
                <li>To protect the personal safety of users of the Service or the public.</li>
                <li>To protect against legal liability.</li>
              </ul>

              <h2>4. Security of Data</h2>
              <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.</p>

              <h2>5. Links to Other Sites</h2>
              <p>Our Service may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.</p>

              <h2>6. Changes to This Privacy Policy</h2>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

              <h2>7. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us:</p>
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

export default PrivacyPolicy;