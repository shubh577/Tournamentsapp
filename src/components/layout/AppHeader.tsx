'use client'

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import GlassButton from '@/components/glass/GlassButton';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Notifications } from '@/components/Notifications';

export default function AppHeader() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*, roles(*)')
          .eq('id', session.user.id)
          .single();
        setProfile(profileData);
      }
      setLoading(false);
    };

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/60 border-b border-white/10">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-headline font-bold text-xl tracking-tight text-foreground flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/icon.png" 
            alt="Martial Grid Icon" 
            className="w-10 h-10 object-contain" 
          />
          MARTIAL GRID
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse"></div>
        ) : session ? (
          <div className="flex items-center gap-4">
            <Notifications />
            <Popover>
              <PopoverTrigger asChild>
                <button className="rounded-full border-2 border-transparent hover:border-primary/50 transition-all">
                    <Avatar className="w-10 h-10 shadow-lg">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">{profile ? getInitials(profile.name) : 'U'}</AvatarFallback>
                    </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-background/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-xl p-2" align="end">
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                      <p className="font-bold text-sm truncate">{profile?.name}</p>
                      <p className="text-xs text-primary uppercase tracking-widest font-bold mt-1">{profile?.role}</p>
                  </div>
                  <div className="space-y-1">
                      <Link href="/profile"><Button variant="ghost" className="w-full justify-start hover:bg-white/5"><User className="w-4 h-4 mr-2" /> My Profile</Button></Link>
                      <Link href="/dashboard/overview"><Button variant="ghost" className="w-full justify-start hover:bg-white/5"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Button></Link>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10">
                      <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10">
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                      </Button>
                  </div>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" className="hover:bg-white/5 font-bold">Sign In</Button>
            </Link>
            <Link href="/login">
              <GlassButton className="px-6 py-2 text-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">Create Account</GlassButton>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}