
"use client"

import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Zap, LayoutGrid, Trophy, PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function FanZoneLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const slug = params.slug as string

  const tabs = [
    { name: 'Overview', href: `/t/${slug}/overview`, icon: LayoutGrid },
    { name: 'Brackets', href: `/t/${slug}/brackets`, icon: Trophy },
    { name: 'Matches', href: `/t/${slug}/matches`, icon: PlayCircle },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="h-20 border-b border-white/5 backdrop-blur-xl bg-black/20 sticky top-0 z-50 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="text-primary w-6 h-6" />
          <span className="font-headline font-bold text-white tracking-tighter">VORTEX</span>
        </Link>
        
        <div className="flex items-center gap-2 glass-surface p-1 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  isActive ? "bg-primary text-white neon-glow-blue" : "text-white/50 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </Link>
            )
          })}
        </div>
        
        <div className="w-10 h-10 rounded-full glass-surface border-white/10" />
      </nav>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
