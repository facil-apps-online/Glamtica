import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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

interface LegalPageLayoutProps {
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ children }) => {
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
      <header className="w-full bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center">
          <Link to="/">
            <span className="text-2xl font-bold text-purple-700">Glamtica</span>
          </Link>
        </div>
        <nav className="space-x-4">
          <Link to="/auth" className="text-gray-600 hover:text-purple-700">Iniciar Sesión</Link>
          <Link to="/register-tenant">
            <Button>Regístrate</Button>
          </Link>
        </nav>
      </header>

      {/* Page Content */}
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 px-4 text-center text-sm mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p>&copy; {new Date().getFullYear()} Glamtica. Todos los derechos reservados.</p>
          <nav className="space-x-4">
            <Link to="/privacy-policy" className="hover:text-white">Política de Privacidad</Link>
            <Link to="/terms-of-service" className="hover:text-white">Términos de Servicio</Link>
          </nav>
        </div>
      </footer>
    </motion.div>
  );
};
