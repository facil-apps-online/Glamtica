import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ElementType;
  trend?: "up" | "down";
}

export function StatsCard({ title, value, change, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl mt-1">{value}</CardTitle>
            {change && trend && (
              <p className={`text-xs sm:text-sm mt-2 truncate ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {change}
              </p>
            )}
          </div>
          {Icon && (
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}