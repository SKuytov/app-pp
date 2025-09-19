import React from 'react';
import { cn } from '@/lib/utils';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'blue', 
  className = '',
  text = '',
  showText = true 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    red: 'border-red-600 border-t-transparent'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg', 
    xlarge: 'text-xl'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div 
        className={cn(
          'border-2 rounded-full animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
      {showText && text && (
        <p className={cn(
          'mt-2 text-gray-600 dark:text-gray-300',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
