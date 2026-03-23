import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl text-sm transition-colors disabled:pointer-events-none disabled:opacity-50 py-3 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-white ${className || ''}`}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button };
