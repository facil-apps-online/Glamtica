import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'react-datepicker/dist/react-datepicker.css'; // Estilos para el nuevo calendario
import './lib/i18n'; // Importa la configuración de i18n

createRoot(document.getElementById("root")!).render(<App />);
