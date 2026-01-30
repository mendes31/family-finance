import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'default' | 'monogram';
}

export function Logo({ className, size = 'md', showText = true, variant = 'default' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  if (variant === 'monogram') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div
          className={cn(
            'rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md',
            sizeClasses[size]
          )}
        >
          <span className="text-white font-bold font-display" style={{ fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem' }}>
            F
          </span>
        </div>
        {showText && (
          <div>
            <h1 className={cn('font-display font-bold text-white', textSizeClasses[size])}>
              FinFamily
            </h1>
            {size !== 'sm' && (
              <p className="text-xs text-white/70">Finanças em Família</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br from-primary via-primary/90 to-secondary flex items-center justify-center shadow-md',
          sizeClasses[size]
        )}
      >
        <span className="text-white font-bold font-display" style={{ fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem' }}>
          F
        </span>
      </div>
      {showText && (
        <div>
          <h1 className={cn('font-display font-bold text-foreground', textSizeClasses[size])}>
            FinFamily
          </h1>
          {size !== 'sm' && (
            <p className="text-xs text-muted-foreground">Finanças em Família</p>
          )}
        </div>
      )}
    </div>
  );
}

