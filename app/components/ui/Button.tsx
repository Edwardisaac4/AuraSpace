/**
 * Button.tsx — Reusable button component with variant and size presets.
 *
 * Uses `React.forwardRef` so parent components can attach a ref
 * directly to the underlying `<button>` DOM element.
 */

import React from 'react';

/** Props for the Button component. Inherits all native button attributes. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant. Defaults to "primary". */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  /** Size preset. Defaults to "md". */
  size?: 'sm' | 'md' | 'lg';
  /** When true, the button stretches to fill its container's width. */
  fullWidth?: boolean;
}

/**
 * Styled button with variant/size classes: btn, btn--{variant}, btn--{size}.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', children, ...props }, ref) => {
    const classes = [
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      fullWidth ? 'btn--full' : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
