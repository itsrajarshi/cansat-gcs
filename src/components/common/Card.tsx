import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  compact?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  className = '',
  glow = false,
  compact = false,
}) => {
  return (
    <div
      className={`
        bg-aerospace-panel border border-aerospace-secondary/20 rounded-lg
        ${glow ? 'shadow-glow' : 'shadow-lg'}
        ${compact ? 'p-3' : 'p-4'}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="mb-3 border-b border-aerospace-secondary/20 pb-2">
          {title && <h3 className="text-lg font-semibold text-aerospace-accent">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={title || subtitle ? '' : ''}>{children}</div>
    </div>
  );
};

export default Card;
