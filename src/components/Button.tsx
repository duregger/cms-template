type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonVariant = 'primary' | 'secondary' | 'outline'

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 py-2 text-label-sm gap-1',
  md: 'h-10 px-4 py-2.5 text-xs gap-1.5',
  lg: 'h-12 px-6 py-3 text-sm gap-2',
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary text-brand-on shadow-button hover:bg-brand-wash hover:text-brand-ink-on-tint',
  secondary: 'btn-secondary hover:brightness-110',
  outline: 'bg-transparent border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-brand-on',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize
  variant?: ButtonVariant
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export function Button({
  size = 'md',
  variant = 'primary',
  children,
  icon,
  iconPosition = 'right',
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-control font-button
        transition-[color,background-color,box-shadow,filter,opacity] duration-state
        active:opacity-[0.85]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1
        ${SIZE_CLASSES[size]}
        ${VARIANT_CLASSES[variant]}
        ${className}
      `}
      {...rest}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </button>
  )
}
