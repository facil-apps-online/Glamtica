import { Button } from "@/components/ui/button";
import { LuMoveRight } from "react-icons/lu";

// Helper component to display a color swatch
const ColorSwatch = ({ name, hslValue, hexValue }: { name: string; hslValue: string; hexValue?: string }) => (
  <div className="flex flex-col items-center">
    <div
      className="w-24 h-24 rounded-lg shadow-md border border-border"
      style={{ backgroundColor: `hsl(${hslValue})` }}
    />
    <div className="mt-2 text-center">
      <p className="font-bold text-sm">{name}</p>
      <p className="text-xs text-muted-foreground">{`hsl(${hslValue})`}</p>
      {hexValue && <p className="text-xs text-muted-foreground">{hexValue}</p>}
    </div>
  </div>
);

// Main UI Kit Component
const UIKit = () => {
  const lightThemeColors = [
    { name: "Background", hslValue: "0 0% 100%" },
    { name: "Foreground", hslValue: "222.2 84% 4.9%" },
    { name: "Card", hslValue: "0 0% 100%" },
    { name: "Card Foreground", hslValue: "222.2 84% 4.9%" },
    { name: "Popover", hslValue: "0 0% 100%" },
    { name: "Popover Foreground", hslValue: "222.2 84% 4.9%" },
    { name: "Primary", hslValue: "300 13% 18%" },
    { name: "Primary Foreground", hslValue: "210 40% 98%" },
    { name: "Secondary", hslValue: "210 40% 96.1%" },
    { name: "Secondary Foreground", hslValue: "222.2 47.4% 11.2%" },
    { name: "Muted", hslValue: "210 40% 96.1%" },
    { name: "Muted Foreground", hslValue: "215.4 16.3% 46.9%" },
    { name: "Accent", hslValue: "210 40% 96.1%" },
    { name: "Accent Foreground", hslValue: "222.2 47.4% 11.2%" },
    { name: "Destructive", hslValue: "0 84.2% 60.2%" },
    { name: "Destructive Foreground", hslValue: "210 40% 98%" },
    { name: "Border", hslValue: "214.3 31.8% 91.4%" },
    { name: "Input", hslValue: "214.3 31.8% 91.4%" },
    { name: "Ring", hslValue: "222.2 84% 4.9%" },
  ];

  const darkThemeColors = [
    { name: "Background", hslValue: "222.2 84% 4.9%" },
    { name: "Foreground", hslValue: "210 40% 98%" },
    { name: "Card", hslValue: "222.2 84% 4.9%" },
    { name: "Card Foreground", hslValue: "210 40% 98%" },
    { name: "Popover", hslValue: "222.2 84% 4.9%" },
    { name: "Popover Foreground", hslValue: "210 40% 98%" },
    { name: "Primary", hslValue: "210 40% 98%" },
    { name: "Primary Foreground", hslValue: "295 20% 18%" },
    { name: "Secondary", hslValue: "217.2 32.6% 17.5%" },
    { name: "Secondary Foreground", hslValue: "210 40% 98%" },
    { name: "Muted", hslValue: "217.2 32.6% 17.5%" },
    { name: "Muted Foreground", hslValue: "215 20.2% 65.1%" },
    { name: "Accent", hslValue: "217.2 32.6% 17.5%" },
    { name: "Accent Foreground", hslValue: "210 40% 98%" },
    { name: "Destructive", hslValue: "0 62.8% 30.6%" },
    { name: "Destructive Foreground", hslValue: "210 40% 98%" },
    { name: "Border", hslValue: "217.2 32.6% 17.5%" },
    { name: "Input", hslValue: "217.2 32.6% 17.5%" },
    { name: "Ring", hslValue: "212.7 26.8% 83.9%" },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">UI Kit / Sistema de Diseño</h1>

      {/* Section: Colors */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Colores</h2>
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Tema Claro</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {lightThemeColors.map((color) => (
              <ColorSwatch key={color.name} {...color} />
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-4">Tema Oscuro</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 p-6 bg-gray-800 rounded-lg">
            {darkThemeColors.map((color) => (
              <ColorSwatch key={color.name} {...color} />
            ))}
          </div>
        </div>
      </section>

      {/* Section: Typography */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Tipografía</h2>
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">H1: Título Extra Grande</h1>
          <h2 className="text-3xl font-semibold tracking-tight">H2: Título Grande</h2>
          <h3 className="text-2xl font-semibold tracking-tight">H3: Título Mediano</h3>
          <h4 className="text-xl font-semibold tracking-tight">H4: Título Pequeño</h4>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            Párrafo de cuerpo de texto. El rápido zorro marrón salta sobre el perro perezoso. Esta es una demostración de cómo se ve el texto normal dentro de la aplicación. Contiene suficiente texto para envolver y mostrar el interlineado.
          </p>
          <blockquote className="mt-6 border-l-2 pl-6 italic">
            "Esto es una cita o blockquote. A menudo se usa para resaltar una frase o testimonio importante."
          </blockquote>
          <p className="text-sm text-muted-foreground">
            Texto silenciado (muted). Ideal para leyendas, pies de foto o información secundaria.
          </p>
        </div>
      </section>

      {/* Section: Buttons */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-6 border-b pb-2">Botones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="flex flex-col space-y-4 items-start">
            <h4 className="font-medium">Default</h4>
            <Button>Botón</Button>
          </div>
          <div className="flex flex-col space-y-4 items-start">
            <h4 className="font-medium">Destructive</h4>
            <Button variant="destructive">Eliminar</Button>
          </div>
          <div className="flex flex-col space-y-4 items-start">
            <h4 className="font-medium">Outline</h4>
            <Button variant="outline">Cancelar</Button>
          </div>
          <div className="flex flex-col space-y-4 items-start">
            <h4 className="font-medium">Secondary</h4>
            <Button variant="secondary">Ver Detalles</Button>
          </div>
          <div className="flex flex-col space-y-4 items-start">
            <h4 className="font-medium">Ghost</h4>
            <Button variant="ghost">Editar</Button>
          </div>
          <div className="flex flex-col space-y-4 items-start">
            <h4 className="font-medium">Link</h4>
            <Button variant="link">Leer más</Button>
          </div>
          <div className="flex flex-col space-y-4 items-start">
            <h4 className="font-medium">Con Icono</h4>
            <Button>
              Siguiente <LuMoveRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col space-y-4 items-start">
            <h4 className="font-medium">Deshabilitado</h4>
            <Button disabled>No disponible</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UIKit;