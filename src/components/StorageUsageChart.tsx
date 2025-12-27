import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { CardContent } from "@/components/ui/card";
import { useScreenSize } from '@/hooks/useScreenSize';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface BreakdownData {
  table_name: string;
  size: number;
}

interface StorageUsageChartProps {
  data: BreakdownData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0', '#546E7A'];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = Math.ceil(bytes / Math.pow(k, i));
  return value + ' ' + sizes[i];
};

const categoryMapping: { [key: string]: string } = {
    'Evidencias de Servicios': 'Evidencias',
    'Evidencias de Pagos': 'Evidencias',
    'Evidencias de Liquidaciones': 'Evidencias',
    'Productos': 'Productos y Servicios',
    'Servicios': 'Productos y Servicios',
    'Combos': 'Productos y Servicios',
    'Tratamientos': 'Productos y Servicios',
    'Consentimientos': 'Firmas',
    'Sucursales': 'Otros',
};
const defaultCategory = 'Otros';


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const categoryName = label;
    const totalSize = payload[0].value;
    const details = payload[0].payload.details;

    // Don't show tooltip for "Otros" if it has only one item (itself)
    // or if we are in the detail view.
    if (!details || details.length <= 1) {
      return (
        <div className="bg-background border p-2 rounded-md shadow-lg">
          <p className="font-bold">{`${categoryName}: ${formatBytes(totalSize)}`}</p>
        </div>
      );
    }

    return (
      <div className="bg-background border p-4 rounded-md shadow-lg max-w-sm">
        <p className="font-bold mb-2">{`${categoryName} - Total: ${formatBytes(totalSize)}`}</p>
        <ul className="text-sm space-y-1">
          {details.map((item: any, index: number) => (
            <li key={index} className="flex justify-between gap-4">
              <span className="truncate pr-2">{item.name}:</span>
              <span className="font-semibold whitespace-nowrap">{formatBytes(item.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return null;
};

export const StorageUsageChart: React.FC<StorageUsageChartProps> = ({ data }) => {
  const screenSize = useScreenSize();
  const isMobile = screenSize === 'sm' || screenSize === 'md';

  const [detailView, setDetailView] = useState<{ category: string; data: any[] } | null>(null);

  const groupedData = useMemo(() => {
    const grouped = data.reduce((acc, item) => {
      const category = categoryMapping[item.table_name] || defaultCategory;
      if (!acc[category]) {
        acc[category] = { name: category, value: 0, details: [] };
      }
      acc[category].value += item.size;
      acc[category].details.push({ name: item.table_name, value: item.size });
      return acc;
    }, {} as { [key: string]: { name: string; value: number; details: any[] } });
    
    return Object.values(grouped).filter(item => item.value > 0);
  }, [data]);
  
  const totalSize = data.reduce((sum, item) => sum + item.size, 0);

  const handleBarClick = (data: any) => {
    if (detailView) return; // Don't drill down further
    if (data && data.activePayload) {
      const payload = data.activePayload[0].payload;
      const categoryData = groupedData.find(g => g.name === payload.name);
      if (categoryData && categoryData.details.length > 1) {
        setDetailView({ category: payload.name, data: categoryData.details });
      }
    }
  };

  const handleBackClick = () => {
    setDetailView(null);
  };

  const chartData = detailView ? detailView.data : groupedData;
  const chartTitle = detailView ? `Desglose de ${detailView.category}` : "Desglose por Categoría";
  
  if (totalSize === 0) {
    return (
      <p className="text-center text-muted-foreground p-4">No hay datos de almacenamiento para mostrar.</p>
    );
  }

  const renderChart = () => {
    const sortedChartData = [...chartData].sort((a, b) => b.value - a.value);

    return (
      <BarChart data={sortedChartData} margin={{ top: 5, right: 20, left: 0, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
        <YAxis tickFormatter={formatBytes} />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted))' }}
          content={<CustomTooltip />} 
        />
        <Bar dataKey="value" onClick={handleBarClick}>
          {sortedChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cursor={!detailView && groupedData.find(g => g.name === entry.name)?.details.length > 1 ? 'pointer' : 'default'} />
          ))}
        </Bar>
      </BarChart>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-4">
        {detailView && (
          <Button variant="ghost" size="sm" onClick={handleBackClick} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        )}

      </div>
      <ResponsiveContainer width="100%" height={isMobile ? 300 : 250}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};