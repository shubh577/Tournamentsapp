
import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes } from "react"

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export default function GlassButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: GlassButtonProps) {
  const variants = {
    primary: "bg-primary/80 hover:bg-primary text-white neon-glow-blue",
    accent: "bg-accent/80 hover:bg-accent text-background neon-glow-cyan",
    secondary: "bg-white/10 hover:bg-white/20 text-white backdrop-blur-md",
    outline: "bg-transparent border border-white/20 hover:bg-white/5 text-white backdrop-blur-sm",
    ghost: "bg-transparent hover:bg-white/5 text-white/70 hover:text-white"
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base font-bold",
    icon: "p-2"
  }

  return (
    <button
      className={cn(
        "rounded-xl font-medium transition-all duration-300 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
