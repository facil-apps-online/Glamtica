import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Función para convertir HEX a HSL en formato string "H S L"
function hexToHsl(hex: string): string | null {
  if (!hex || !hex.startsWith('#')) return null;

  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export const DynamicStylesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenant } = useAuth();

  useEffect(() => {
    const primaryColor = tenant?.primary_color;
    const secondaryColor = tenant?.secondary_color;

    const primaryHsl = primaryColor ? hexToHsl(primaryColor) : null;
    const secondaryHsl = secondaryColor ? hexToHsl(secondaryColor) : null;

    let css = '';
    if (primaryHsl) {
      css += `--primary: ${primaryHsl};
`;
    }
    if (secondaryHsl) {
      css += `--secondary: ${secondaryHsl};
`;
    }

    // Inyecta los estilos o los elimina si no hay colores personalizados
    const styleElementId = 'glamtica-dynamic-theme';
    let styleElement = document.getElementById(styleElementId) as HTMLStyleElement | null;

    if (css) {
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleElementId;
        document.head.appendChild(styleElement);
      }
      styleElement.innerHTML = `:root {\n${css}}`;
    } else if (styleElement) {
      // Si no hay colores personalizados y el style element existe, lo limpiamos
      styleElement.innerHTML = '';
    }

  }, [tenant]);

  return <>{children}</>;
};
