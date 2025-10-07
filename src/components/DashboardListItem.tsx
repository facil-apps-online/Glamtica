import React from 'react';

interface DashboardListItemProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  trailingContent: React.ReactNode;
  badge?: React.ReactNode;
}

export const DashboardListItem: React.FC<DashboardListItemProps> = ({ 
  icon, 
  title, 
  subtitle, 
  trailingContent, 
  badge 
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50/80 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{subtitle}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        {trailingContent}
      </div>
      {badge && (
        <div className="ml-2 flex-shrink-0">
          {badge}
        </div>
      )}
    </div>
  );
};