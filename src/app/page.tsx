"use client"

import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import GlassButton from "@/components/glass/GlassButton";
import GlassCard from "@/components/glass/GlassCard";
import { motion } from "framer-motion";
import { Trophy, Zap, Shield, Globe, ArrowRight, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
      }
      setSession(data.session);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        // Check if the user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          router.push('/onboarding');
        } else if (!profile) {
          // Profile doesn't exist, so they need to onboard
          router.push('/onboarding');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex flex-col">
      {/* Navbar */}
      <nav className="h-20 border-b border-black/5 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg neon-glow-blue flex items-center justify-center">
            <Zap className="text-white w-5 h-5 fill-current" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight text-foreground">VORTEX ARENA</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Explore</Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Coach Dashboard</Link>
          <Link href="/portal" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Player Portal</Link>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <GlassButton disabled>Loading...</GlassButton>
          ) : session ? (
            <GlassButton onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </GlassButton>
          ) : (
            <Link href="/login">
              <GlassButton>Get Started</GlassButton>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6 relative overflow-hidden flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-surface text-accent text-xs font-bold mb-8 animate-pulse-glow">
            <span className="w-2 h-2 bg-accent rounded-full animate-ping" />
            NOW POWERED BY GEN-AI SEEDING
          </div>
          <h1 className="text-6xl md:text-8xl font-headline font-bold text-foreground mb-8 leading-tight tracking-tighter">
            THE EVOLUTION OF <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">SPORTS ARENAS</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 font-body">
            Vortex Arena is the world's most immersive tournament engine. Fluid brackets, real-time pulse analytics, and smart AI seeding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore">
              <GlassButton size="lg" className="w-full sm:w-auto h-16 text-lg group">
                Explore Arenas <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </GlassButton>
            </Link>
            <GlassButton variant="outline" size="lg" className="w-full sm:w-auto h-16 text-lg text-foreground border-foreground/10 hover:bg-foreground/5">
              Book a Demo
            </GlassButton>
          </div>
        </motion.div>

        {/* Mockup effects adjusted for light theme */}
        <div className="mt-20 flex gap-4 rotate-12 -skew-x-12 translate-x-20 opacity-20 select-none pointer-events-none absolute -bottom-40 right-0 hidden lg:flex">
          <GlassCard className="w-80 h-96 border-primary/20 bg-primary/5" />
          <GlassCard className="w-80 h-96 border-accent/20 bg-accent/5 -translate-y-20" />
          <GlassCard className="w-80 h-96 border-black/5 bg-black/5 -translate-y-40" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-headline font-bold text-foreground mb-4">ENGINEERED FOR PERFORMANCE</h2>
            <p className="text-muted-foreground">Modern tools for modern competition.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <GlassCard className="group hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:neon-glow-blue transition-all">
                <Trophy className="text-primary w-6 h-6" />
              </div>
              <h3 className="text-xl font-headline font-bold text-foreground mb-3">Liquid Bracketing</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Interactive knockout stages with curved organic connections and real-time path discovery.</p>
            </GlassCard>
            <GlassCard className="group hover:border-accent/40 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:neon-glow-cyan transition-all">
                <Globe className="text-accent w-6 h-6" />
              </div>
              <h3 className="text-xl font-headline font-bold text-foreground mb-3">Global Discovery</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Reach thousands of fans with customized public zones featuring immersive live score feeds.</p>
            </GlassCard>
            <GlassCard className="group hover:border-foreground/20 transition-colors">
              <div className="w-12 h-12 bg-black/5 rounded-xl flex items-center justify-center mb-6 group-hover:bg-black/10 transition-all">
                <Shield className="text-foreground/70 w-6 h-6" />
              </div>
              <h3 className="text-xl font-headline font-bold text-foreground mb-3">Elite Security</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Enterprise-grade protection for your tournament data, participants, and financial records.</p>
            </GlassCard>
          </div>
        </div>
      </section>
    </div>
  )
}