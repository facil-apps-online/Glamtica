import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, backButton, children }) => {
  return (
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-start gap-4">
        {backButton}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
};
