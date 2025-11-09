import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BreakdownData {
  table_name: string;
  size: number;
}

interface StorageUsageChartProps {
  data: BreakdownData[];
}

const TABLE_NAME_MAP: { [key: string]: string } = {
  'product_images': 'Productos',
  'attention_service_evidences': 'Evidencias',
  'attention_payment_evidences': 'Pagos',
  'commission_payment_evidences': 'Comisiones',
  'consent_signatures': 'Consentimientos',
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const StorageUsageChart: React.FC<StorageUsageChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    name: TABLE_NAME_MAP[item.table_name] || item.table_name,
    value: item.size,
  }));

  const totalSize = data.reduce((sum, item) => sum + item.size, 0);

  if (totalSize === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Desglose de Almacenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No hay datos de almacenamiento para mostrar.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Desglose de Almacenamiento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [formatBytes(value), 'Uso']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
