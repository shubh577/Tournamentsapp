
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'strong'
}

export default function GlassCard({ children, className, variant = 'default', ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === 'default' ? 'glass-surface' : 'glass-surface-strong',
        "rounded-2xl p-6 transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
