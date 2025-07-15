import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { PlusCircle } from 'lucide-react';

// Meta información sobre el componente para Storybook
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  // Describe los argumentos (props) del componente
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'El estilo visual del botón.',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'El tamaño del botón.',
    },
    disabled: {
      control: 'boolean',
      description: 'Si el botón está deshabilitado.',
    },
    children: {
      control: 'text',
      description: 'El contenido del botón (texto o icono).',
    },
  },
  // Añade etiquetas para la búsqueda y filtrado
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

// Historia principal (Default)
export const Default: Story = {
  args: {
    variant: 'default',
    size: 'default',
    children: 'Botón Primario',
  },
};

// Historia para el botón destructivo
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Eliminar',
  },
};

// Historia para el botón secundario
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Botón Secundario',
  },
};

// Historia para el botón de contorno
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Cancelar',
  },
};

// Historia para un botón con icono
export const WithIcon: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <PlusCircle />
        <span>Crear Nuevo</span>
      </>
    ),
  },
};

// Historia para un botón de solo icono
export const IconOnly: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: <PlusCircle />,
  },
};
