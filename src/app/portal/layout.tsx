
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Users, 
  Calendar, 
  Settings,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function PlayerPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Home', href: '/portal', icon: Home },
    { name: 'Teams', href: '/portal/teams', icon: Users },
    { name: 'Schedule', href: '/portal/schedule', icon: Calendar },
    { name: 'Settings', href: '/portal/settings', icon: Settings },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-slate-100/30">
      <header className="h-16 px-6 border-b border-black/5 flex items-center justify-between backdrop-blur-md sticky top-0 z-40 bg-white/40">
        <div className="flex items-center gap-2">
          <Zap className="text-primary w-5 h-5" />
          <span className="font-headline font-bold text-foreground tracking-tighter">VORTEX PORTAL</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent shadow-sm" />
      </header>

      <main className="flex-1 pb-24 p-6">
        {children}
      </main>

      {/* Frosted Glass Bottom Tab Bar */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 glass-surface-strong rounded-3xl z-50 flex items-center justify-around px-4 border-black/5 shadow-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 relative",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-md -z-10" />
              )}
              <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[2px]")} />
              <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{tab.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
