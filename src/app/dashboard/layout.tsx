'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserPlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Notifications } from "@/components/Notifications"

// Define safe routes for unauthenticated users
const PUBLIC_DASHBOARD_ROUTES = ['/dashboard/pulse', '/dashboard/tournaments', '/dashboard/teams', '/dashboard/community'];

// --- USER PROFILE NAV ---
const UserProfileNav = ({ profile, loading, isCollapsed }: { profile: any, loading: boolean, isCollapsed: boolean }) => {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-black/10 animate-pulse"></div>
  }

  // If the user is our spoofed guest profile, show a prompt to sign in instead of a logout menu
  if (profile?.isGuest) {
    return (
      <Link href="/login" className="w-full">
        <Button className={cn("w-full shadow-lg gap-2", isCollapsed && "justify-center")} variant="default">
          <UserPlus className="w-4 h-4" />
          {!isCollapsed && <span>Sign In / Join</span>}
        </Button>
      </Link>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-3 w-full hover:bg-black/5 p-2 rounded-xl transition-colors text-left group">
            <Avatar className="border-2 border-transparent group-hover:border-primary/50 transition-all">
                <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className={cn("flex-1 overflow-hidden", isCollapsed ? "hidden" : "block")}>
                <p className="text-sm font-bold truncate text-foreground">{profile?.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{profile?.role}</p>
            </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-xl p-2" align="end" side="top">
          <div className="space-y-1">
              <Link href="/profile"><Button variant="ghost" className="w-full justify-start hover:bg-white/5">My Profile</Button></Link>
              <Link href="/dashboard/settings"><Button variant="ghost" className="w-full justify-start hover:bg-white/5">Settings</Button></Link>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10">
              <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
              </Button>
          </div>
      </PopoverContent>
    </Popover>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // If not logged in, check if they are trying to access a public fan zone
        const isPublicRoute = PUBLIC_DASHBOARD_ROUTES.some(route => pathname.startsWith(route));
        
        if (isPublicRoute) {
          // Spoof a guest fan profile so the sidebar renders correctly
          setProfile({ role: 'fan', name: 'Spectator', isGuest: true });
          setLoading(false);
          return;
        } else {
          // Kick them out if trying to hit a restricted route
          router.push('/login');
          return;
        }
      }

      // If logged in, fetch normal profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      } else {
        router.push('/onboarding')
      }
      setLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  // Dynamically change names based on role (Fans see "Tournaments", Organizers see "My Tournaments")
  const getNavItems = (role: string) => [
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard, roles: ['organizer'] },
    { name: 'Live Pulse', href: '/dashboard/pulse', icon: Activity, roles: ['organizer', 'coach', 'player', 'fan'] },
    { name: role === 'fan' ? 'Tournaments' : 'My Tournaments', href: '/dashboard/tournaments', icon: Trophy, roles: ['organizer', 'coach', 'player', 'fan'] },
    { name: role === 'fan' ? 'Teams' : 'My Teams', href: '/dashboard/teams', icon: Users, roles: ['coach', 'player', 'fan'] },
    { name: 'Community Hub', href: '/dashboard/community', icon: Globe, roles: ['organizer', 'coach', 'player', 'fan'] },
  ].filter(item => item.roles.includes(role));

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-background"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
  }

  const filteredNavItems = getNavItems(profile?.role || 'fan');

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-background border-r border-white/5 transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
           {!isCollapsed && (
              <Link href="/" className="font-headline font-black text-lg tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src="/icon.png" 
                alt="Martial Grid Icon" 
                className="w-10 h-10 object-contain" 
              />
              MARTIAL GRID
            </Link>
           )}
           <button 
             onClick={() => setIsCollapsed(!isCollapsed)} 
             className="hidden md:flex p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground"
           >
             {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
           </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto no-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link key={item.name} href={item.href}>
                <span className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all group",
                  isActive 
                    ? "bg-primary/20 text-primary shadow-sm border border-primary/30" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                )}>
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "group-hover:text-foreground")} />
                  <span className={cn(
                    "overflow-hidden transition-all duration-300 whitespace-nowrap",
                    isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto translate-x-0 block"
                  )}>
                    {item.name}
                  </span>
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Profile / Sign In Section */}
        <div className="p-4 border-t border-white/5 bg-black/20">
            <UserProfileNav profile={profile} loading={loading} isCollapsed={isCollapsed} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out flex flex-col min-w-0 relative",
          isCollapsed ? "md:pl-20" : "md:pl-64"
        )}
      >
        <header className="h-20 px-4 sm:px-8 flex items-center justify-between border-b border-white/5 bg-background/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base sm:text-lg font-headline font-bold text-foreground uppercase tracking-widest line-clamp-1">
              {profile?.role === 'fan' ? 'Fan Zone' : 'Command Center'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {!profile?.isGuest && <Notifications />}
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden relative">
           <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-screen pointer-events-none z-0" />
           <div className="relative z-10 p-4 sm:p-8">
             {children}
           </div>
        </div>
      </main>

    </div>
  )
}