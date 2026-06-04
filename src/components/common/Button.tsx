import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled = false,
  ...props
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2';

  const variantStyles = {
    primary: 'bg-aerospace-accent hover:bg-aerospace-accent-light text-black disabled:bg-gray-600 disabled:text-gray-400',
    secondary: 'bg-aerospace-secondary hover:bg-indigo-600 text-white disabled:bg-gray-600 disabled:text-gray-400',
    danger: 'bg-aerospace-danger hover:bg-red-600 text-white disabled:bg-gray-600 disabled:text-gray-400',
    success: 'bg-aerospace-success hover:bg-green-500 text-black disabled:bg-gray-600 disabled:text-gray-400',
    outline: 'border-2 border-aerospace-accent hover:bg-aerospace-accent/10 text-aerospace-accent disabled:border-gray-600 disabled:text-gray-600',
    warning: "bg-yellow-500 hover:bg-yellow-600 text-black",
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${
        loading || disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;
