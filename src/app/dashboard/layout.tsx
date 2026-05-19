
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Zap, 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Settings, 
  LogOut,
  BrainCircuit,
  Activity
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
    { name: 'Tournaments', href: '/dashboard/tournaments', icon: Trophy },
    { name: 'Smart Seeding', href: '/dashboard/seeding', icon: BrainCircuit },
    { name: 'Live Pulse', href: '/dashboard/pulse', icon: Activity },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Light Glass Sidebar */}
      <aside className="w-64 border-r border-black/5 glass-surface p-6 flex flex-col fixed h-screen z-50">
        <div className="flex items-center gap-2 mb-12">
          <Zap className="text-primary w-6 h-6" />
          <span className="font-headline font-bold text-foreground text-xl tracking-tighter">VORTEX CORE</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-primary text-white neon-glow-blue" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-black/5 flex flex-col gap-2">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-all">
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pl-64">
        {/* Top Navbar */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-black/5 bg-white/40 backdrop-blur-md sticky top-0 z-40">
          <h1 className="text-lg font-headline font-bold text-foreground">COMMAND CENTER</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full neon-glow-blue" />
              <button className="w-10 h-10 rounded-full glass-surface flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Activity className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-black/10">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-foreground">Coach Marcus</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Elite Org</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-sm">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-bold text-xs text-primary">MC</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
