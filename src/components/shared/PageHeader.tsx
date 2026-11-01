import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, children, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB] dark:border-[#292B2F] mb-8 ${className}`}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111827] dark:text-[#F2F0EC]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-[#4B5563] dark:text-[#92969D] font-normal">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}
