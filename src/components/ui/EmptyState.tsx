import React from 'react';

interface EmptyStateProps {
  Icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ Icon, title, description, action }) => {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
