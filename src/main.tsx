import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'react-datepicker/dist/react-datepicker.css';
import './lib/i18n';
import { ThemeProvider } from '@/components/ThemeProvider';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider 
    attribute="class" 
    defaultTheme="system" 
    storageKey="glamtica-theme"
  >
    <App />
  </ThemeProvider>
);
