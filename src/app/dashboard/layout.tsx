'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  LogOut,
  Activity,
  Globe,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Notifications } from "@/components/Notifications"

// UserProfileNav Component (Unchanged, included for completeness)
const UserProfileNav = () => {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(profileData)
      }
      setLoading(false)
    }

    getSessionAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        window.location.href = '/login'
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const getInitials = (name: string) => {
    if (!name) return ''
    return name.split(' ').map(n => n[0]).join('')
  }

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-gray-500/30 animate-pulse"></div>
  }

  return (
    <div className="flex items-center gap-4">
        <Notifications />
        <Popover>
        <PopoverTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Avatar>
                <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                <AvatarFallback>{getInitials(profile?.name || 'User')}</AvatarFallback>
            </Avatar>
            </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
            <div className="p-2 mb-2 border-b border-black/5">
            <p className="font-bold text-sm truncate">{profile?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <Link href="/profile">
            <Button variant="ghost" className="w-full justify-start font-normal">My Profile</Button>
            </Link>
            <Link href="/dashboard/settings">
            <Button variant="ghost" className="w-full justify-start font-normal">Settings</Button>
            </Link>
            <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start font-normal text-red-500 hover:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
            </Button>
        </PopoverContent>
        </Popover>
    </div>
  )
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // State for Mobile Drawer and Desktop Collapse
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isMobileOpen])

  const navItems = [
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
    { name: 'Community', href: '/dashboard/community', icon: Globe },
    { name: 'Tournaments', href: '/dashboard/tournaments', icon: Trophy },
    { name: 'Live Pulse', href: '/dashboard/pulse', icon: Activity },
    { name: 'Teams', href: '/dashboard/teams', icon: Users },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      
      {/* Mobile Overlay Background */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed h-screen z-50 border-r border-black/5 glass-surface flex flex-col transition-all duration-300 ease-in-out bg-white/80 backdrop-blur-xl",
          // Mobile positioning
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop collapsing width
          isCollapsed ? "md:w-20" : "w-64"
        )}
      >
        {/* Desktop Collapse Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 bg-white border border-black/10 shadow-sm rounded-full p-1 z-50 hover:bg-black/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo Area */}
        <div className={cn("flex items-center mb-7 pt-6", isCollapsed ? "justify-center px-0" : "px-6 justify-between")}>
          <Link href="/" className="flex items-center justify-center">
            <img 
              src={isCollapsed ? "/icon.png" : "/logo.webp"} 
              alt="Martial Grid Logo" 
              className={cn("transition-all duration-300 object-contain", isCollapsed ? "h-10 w-10" : "h-20 w-auto")} 
            />
          </Link>
          
          {/* Mobile Close Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-black/5 text-muted-foreground"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2 px-4 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined} // Tooltip for collapsed state
                className={cn(
                  "flex items-center rounded-xl text-sm font-medium transition-all group overflow-hidden",
                  isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
                  isActive 
                    ? "bg-primary text-white neon-glow-blue shadow-md" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                
                {/* Text wrapped in span to manage visibility and layout smoothly */}
                <span className={cn(
                  "whitespace-nowrap transition-all duration-300",
                  isCollapsed ? "opacity-0 w-0 translate-x-10 hidden" : "opacity-100 w-auto translate-x-0 block"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out flex flex-col min-w-0",
          isCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        <header className="h-20 px-4 sm:px-8 flex items-center justify-between border-b border-black/5 bg-white/40 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Hamburger Button */}
            <button 
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5 text-muted-foreground transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base sm:text-lg font-headline font-bold text-foreground uppercase tracking-widest line-clamp-1">
              Command Center
            </h1>
          </div>
          
          <UserProfileNav />
        </header>

        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}