import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Logo from '@/assets/images/glamtica.app.png';
import { CheckCircle, Star, Zap } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';

import { usePublicRegistrationData } from '@/hooks/usePublicRegistrationData';

import { usePriceFormat } from '@/hooks/usePriceFormat';
import { usePublicSubscriptionPlans } from '@/hooks/usePublicSubscriptionPlans';
import { PublicSubscriptionPlan } from '@/types/subscription';
import { Currency } from '@/hooks/useCurrencies'; // Import Currency interface

// Declare gtag function
declare global {
  interface Window {
    gtag: (type: string, eventName: string, eventParams: object) => void;
  }
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
    {React.createElement(icon, { className: "w-12 h-12 text-purple-600 mb-4" })}
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default function LandingPage() {
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const platformId = import.meta.env.VITE_GLAMTICA_PLATFORM_ID; // Get platform ID from environment
  const { data: publicData, isLoading: isLoadingCountries } = usePublicRegistrationData(platformId);
  const { data: plans, isLoading: isLoadingPlans } = usePublicSubscriptionPlans(selectedCountryId, platformId);

  // Derive publicCurrencyId and publicCurrencyDetails for usePriceFormat
  const selectedCountry = publicData?.countries.find(c => c.id === selectedCountryId);
  const publicCurrencyId = selectedCountry?.default_currency_id;

  const { formatPrice } = usePriceFormat(publicCurrencyId);

  useEffect(() => {
    if (publicData?.countries && publicData.countries.length > 0) {
      fetch('https://ipapi.co/json/')
        .then((res) => res.json())
        .then((data) => {
          const userCountry = publicData.countries.find(c => c.iso_code === data.country_code);
          if (userCountry) {
            setSelectedCountryId(userCountry.id);
          }
        })
        .catch((error) => {
          console.error('Error fetching user location:', error);
        });
    }
  }, [publicData?.countries]);

  const trackGtagEvent = (eventName, params) => {
    if (window.gtag) {
      window.gtag('event', eventName, params);
    }
  };

  // Plans are already structured as PublicSubscriptionPlan, no need for extra grouping
  const sortedPlans = useMemo(() => {
    return plans?.sort((a, b) => a.calculated_price - b.calculated_price) || [];
  }, [plans]);

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-gray-50 text-gray-800"
    >
      {/* Header */}
      <header className="w-full bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-2xl font-bold text-purple-700">Glamtica.app</span>
        </div>
        <nav className="space-x-4">
          <Link to="/auth" className="text-gray-600 hover:text-purple-700" onClick={() => trackGtagEvent('login_click', { event_category: 'engagement', event_label: 'Header Login' })}>Iniciar Sesión</Link>
          <Link to="/register-tenant">
            <Button onClick={() => trackGtagEvent('register_click', { event_category: 'engagement', event_label: 'Header Register' })}>Regístrate</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/diagmonds.png")' }}></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <img src="/glamtica.app.png" alt="Glamtica.app Logo" className="w-32 h-32 mx-auto mb-4" />
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">Gestiona tu Negocio de Belleza con <span className="text-yellow-300">Glamtica.app</span></h1>
          <p className="text-xl mb-8 opacity-90">La plataforma todo en uno diseñada para salones de belleza, spas y barberías. Simplifica tu administración, deleita a tus clientes y haz crecer tu negocio.</p>
          <div className="space-x-4">
            <Link to="/register-tenant">
              <Button size="lg" className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-lg px-8 py-3 rounded-full shadow-lg" onClick={() => trackGtagEvent('register_click', { event_category: 'engagement', event_label: 'Hero Register' })}>Empieza Gratis</Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-purple-700 border-purple-700 hover:bg-purple-700 hover:text-white font-bold text-lg px-8 py-3 rounded-full" onClick={() => trackGtagEvent('login_click', { event_category: 'engagement', event_label: 'Hero Login' })}>Iniciar Sesión</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-purple-700">Características que te Encantarán</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={CheckCircle} 
              title="Gestión de Citas" 
              description="Organiza tu agenda, evita duplicidades y envía recordatorios automáticos a tus clientes."
            />
            <FeatureCard 
              icon={Star} 
              title="Control de Inventario" 
              description="Lleva un registro preciso de tus productos, gestiona stock y recibe alertas de bajo inventario."
            />
            <FeatureCard 
              icon={Zap} 
              title="Reportes Inteligentes" 
              description="Accede a métricas clave de tu negocio para tomar decisiones informadas y estratégicas."
            />
            <FeatureCard 
              icon={CheckCircle} 
              title="Gestión de Clientes" 
              description="Mantén un historial detallado de tus clientes, sus preferencias y servicios recibidos."
            />
            <FeatureCard 
              icon={Star} 
              title="Comisiones Flexibles" 
              description="Configura esquemas de comisiones personalizados para tu equipo, por servicio o producto."
            />
            <FeatureCard 
              icon={Zap} 
              title="Multi-Sucursal" 
              description="Administra múltiples ubicaciones desde una sola plataforma, con control centralizado."
            />
          </div>
          <div className="text-center mt-12">
            <Link to="/features">
              <Button variant="outline" className="text-purple-700 border-purple-700 hover:bg-purple-700 hover:text-white" onClick={() => trackGtagEvent('features_click', { event_category: 'engagement', event_label: 'View More Features' })}>Ver más características</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-purple-700">Planes y Precios</h2>
          
          <div className="flex justify-center mb-8 space-x-4">
            {isLoadingCountries ? (
              <p>Cargando países...</p>
            ) : (
              publicData?.countries
                .slice() // Create a shallow copy to avoid modifying the original array
                .sort((a, b) => a.iso_code.localeCompare(b.iso_code)) // Sort alphabetically by iso_code
                .map(country => (
                  <button 
                    key={country.id} 
                    onClick={() => setSelectedCountryId(country.id)}
                    className={`rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${selectedCountryId === country.id ? 'ring-2 ring-purple-600' : ''}`}
                    title={country.name}
                  >
                    <img 
                      src={`https://flagcdn.com/w40/${country.iso_code.toLowerCase()}.png`} 
                      alt={`Bandera de ${country.name}`}
                      className="w-10 h-auto rounded-full"
                    />
                  </button>
                ))
            )}
          </div>

          {isLoadingPlans ? (
            <div className="text-center py-10">
              <p>Cargando planes...</p>
            </div>
          ) : selectedCountryId && sortedPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {sortedPlans.map(plan => (
                <div key={plan.plan_id} className="bg-white rounded-lg shadow-lg p-8 text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{plan.plan_name}</h3>
                  <p className="text-gray-600 mb-6">{plan.plan_description}</p>
                  <div className="text-5xl font-extrabold text-purple-600 mb-2">{formatPrice(plan.calculated_price)}</div>
                  {plan.billing_frequency_months > 1 ? (
                    <p className="text-gray-500 text-sm mb-6">Equivale a {formatPrice(plan.calculated_price / plan.billing_frequency_months)}/mes</p>
                  ) : (
                    <div className="h-6 mb-6"></div> // Placeholder for alignment
                  )}
                  {/* Features - This part needs to be dynamic based on plan_id or a feature list from the backend */}
                  <ul className="text-gray-700 space-y-3 mb-8 text-left">
                    {plan.plan_features.map((feature, index) => (
                      <li key={index} className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> {feature}</li>
                    ))}
                    {plan.included_einvoices > 0 && (
                        <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-2" /> {plan.included_einvoices} facturas electrónicas</li>
                    )}
                  </ul>
                  <div className="text-center my-4">
                    {plan.calculated_extra_branch_price > 0 && (
                        <div>
                            <p className="text-lg font-semibold">Sucursal Adicional</p>
                            <div className="text-sm text-gray-500">{formatPrice(plan.calculated_extra_branch_price)}</div>
                            {plan.extra_branch_bonus_einvoices > 0 && (
                                <div className="text-sm text-gray-500">+ {plan.extra_branch_bonus_einvoices} facturas electrónicas</div>
                            )}
                        </div>
                    )}
                    {plan.included_einvoices > 0 && (
                        <div className="mt-4">
                            <p className="text-lg font-semibold">Facturas Electrónicas</p>
                            <div className="text-sm text-gray-500">Factura adicional: {formatPrice(plan.extra_einvoice_price)}</div>
                        </div>
                    )}
                  </div>
                  <Link to="/register-tenant">
                    <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => trackGtagEvent('select_plan', { event_category: 'ecommerce', event_label: plan.plan_name, value: plan.calculated_price })}>Elegir Plan</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-10">
              <p>Selecciona un país para ver los planes y precios disponibles.</p>
            </div>
          )}
        </div>
      </section>

      {/* Social Commitment Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <img src="/Logo-fundacion.jpeg" alt="Fundación Peludos por una vida digna" className="w-40 h-40 mx-auto mb-6 rounded-full shadow-lg"/>
          <h2 className="text-4xl font-bold text-center mb-6 text-purple-700">Nuestro Compromiso Social</h2>
          <p className="text-lg text-gray-700 mb-4">
            En Glamtica, creemos en el poder de la comunidad y en el bienestar de quienes no tienen voz. Por eso, nos enorgullece profundamente colaborar con la fundación <strong>"Peludos por una vida digna"</strong>.
          </p>
          <p className="text-lg text-gray-700">
            Desde 2016, esta organización sin ánimo de lucro se dedica a rescatar, rehabilitar y ofrecer una mejor calidad de vida a más de 160 perritos y gatitos en situación de abandono y maltrato. Con cada suscripción a Glamtica, contribuyes directamente a su misión, ayudando a que estos peludos reciban el cuidado que merecen y la oportunidad de encontrar un hogar para siempre.
          </p>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-purple-700 text-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">¿Listo para Transformar tu Negocio?</h2>
          <p className="text-xl mb-8 opacity-90">Únete a cientos de salones que ya están optimizando su gestión con Glamtica.app.</p>
          <Link to="/register-tenant">
            <Button size="lg" className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg" onClick={() => trackGtagEvent('register_click', { event_category: 'engagement', event_label: 'Footer Register' })}>Regístrate Ahora</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 px-4 text-center text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p>&copy; {new Date().getFullYear()} Glamtica.app. Todos los derechos reservados.</p>
          <nav className="space-x-4">
            <Link to="/privacy-policy" className="hover:text-white">Política de Privacidad</Link>
            <Link to="/terms-of-service" className="hover:text-white">Términos de Servicio</Link>
          </nav>
        </div>
      </footer>
    </motion.div>
  );
};
