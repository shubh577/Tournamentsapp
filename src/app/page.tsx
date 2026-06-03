'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
import { Trophy, Zap, Shield, Globe, ArrowRight, Activity, Users, Calendar, ChevronRight, Play } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/layout/AppHeader'

const SPORTS = ["Cricket", "Football", "Badminton", "Wrestling", "Kabaddi", "Basketball", "Tennis", "Volleyball"];

export default function LandingPage() {
  const router = useRouter()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  const [authChecking, setAuthChecking] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()

        if (profile && !profile.onboarding_completed) {
          router.push('/onboarding')
        } else if (!profile) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard/overview') // Auto-redirect logged-in users to dashboard
        }
      } else {
        setAuthChecking(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // Fade-in animation variants
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  if (authChecking) return null; // Prevent flash of landing page if logged in

  return (
    <div className="min-h-screen bg-[#050505] text-foreground overflow-hidden selection:bg-primary/30">
      
      {/* --- AMBIENT BACKGROUND GLOWS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div style={{ y }} className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[150px]" />
        <motion.div style={{ y }} className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-500/10 blur-[150px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10">
        <AppHeader />

        {/* --- HERO SECTION --- */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* Left Copy */}
            <motion.div 
              initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              className="flex-1 text-center lg:text-left"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-primary mb-6 backdrop-blur-md">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>
                Platform v2.0 is Live
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-8xl font-black font-headline tracking-tighter leading-[1.1] mb-6">
                Stop playing by <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/40">the old rules.</span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A new era of tournament management is here. Everything you need to scale your event, manage your squad, and broadcast in real-time. All in one place.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/login" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] transition-all flex items-center justify-center gap-2 group">
                    Enter The Arena <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 h-14 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-lg transition-all flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" /> How it Works
                  </button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Visual (Abstract Floating UI) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex-1 w-full max-w-lg lg:max-w-none relative perspective-1000"
            >
              <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-tr from-white/5 to-white/10 border border-white/10 backdrop-blur-3xl p-4 sm:p-8 flex flex-col gap-4 shadow-2xl overflow-hidden transform-gpu">
                {/* Mock UI Element 1 */}
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-3/4 p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md">
                  <div className="flex justify-between items-center mb-3"><div className="h-2 w-1/3 bg-white/20 rounded-full" /><div className="h-4 w-12 bg-primary/20 rounded-sm" /></div>
                  <div className="h-2 w-full bg-white/10 rounded-full mb-2" /><div className="h-2 w-5/6 bg-white/10 rounded-full" />
                </motion.div>
                
                {/* Mock UI Element 2 - The Live Score */}
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="self-end w-4/5 p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 backdrop-blur-md shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-white/20" /><div className="h-8 w-12 bg-white/20 rounded-md font-bold text-white flex items-center justify-center">2</div></div>
                     <span className="text-white/50 text-xl font-bold">VS</span>
                     <div className="flex items-center gap-3"><div className="h-8 w-12 bg-primary rounded-md font-bold text-white flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">3</div><div className="w-8 h-8 rounded-full bg-white/20" /></div>
                  </div>
                </motion.div>

                {/* Mock UI Element 3 */}
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} className="w-2/3 p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-md mt-auto">
                   <div className="flex gap-2"><div className="w-6 h-6 rounded-md bg-green-500/20" /><div className="flex-1 h-6 bg-white/10 rounded-md" /></div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- INFINITE MARQUEE --- */}
        <div className="w-full border-y border-white/5 bg-black/50 py-6 overflow-hidden flex whitespace-nowrap relative">
            <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-[#050505] to-transparent z-10" />
            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-[#050505] to-transparent z-10" />
            <motion.div 
              animate={{ x: [0, -1035] }} // Adjust based on content width
              transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
              className="flex gap-16 items-center px-8"
            >
              {[...SPORTS, ...SPORTS, ...SPORTS].map((sport, i) => (
                <span key={i} className="text-2xl font-black font-headline text-white/20 uppercase tracking-widest flex items-center gap-4">
                  {sport} <span className="text-primary/50 text-3xl">•</span>
                </span>
              ))}
            </motion.div>
        </div>

        {/* --- BENTO GRID FEATURES --- */}
        <section id="features" className="py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black font-headline mb-6">The Ultimate Ecosystem</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Built from the ground up to eliminate spreadsheets, chaotic WhatsApp groups, and manual scorekeeping.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              
              {/* Feature 1: Brackets (Large) */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:col-span-2 md:row-span-2 rounded-3xl p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6 border border-primary/30">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3">Auto-Bracket Engine</h3>
                    <p className="text-muted-foreground text-lg max-w-md">Our algorithm pairs approved teams, generates rounds, and manages byes instantly. Just click generate and watch the magic happen.</p>
                  </div>
                  {/* Abstract Bracket Visual */}
                  <div className="mt-8 relative h-32 w-full">
                     <div className="absolute right-0 bottom-0 w-[120%] h-[150%] bg-[url('/bracket-pattern.svg')] bg-cover opacity-20 group-hover:scale-105 transition-transform duration-700 origin-bottom-right" />
                     {/* CSS-drawn abstract bracket for effect */}
                     <div className="absolute right-4 bottom-4 flex gap-4 text-white/10">
                        <div className="flex flex-col gap-4 border-r-2 border-white/10 pr-4 py-4"><div className="w-24 h-8 bg-white/5 rounded-md" /><div className="w-24 h-8 bg-white/5 rounded-md" /></div>
                        <div className="flex flex-col justify-center border-r-2 border-white/10 pr-4"><div className="w-24 h-8 bg-primary/20 border border-primary/30 rounded-md" /></div>
                        <div className="flex flex-col justify-center"><div className="w-32 h-12 bg-white/10 rounded-md" /></div>
                     </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2: Telemetry */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-3xl p-8 bg-white/5 border border-white/10 relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/30">
                      <Activity className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Live Pulse</h3>
                    <p className="text-muted-foreground">Real-time match telemetry. Broadcast scores live to thousands of fans without refreshing.</p>
                </div>
              </motion.div>

              {/* Feature 3: Security */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-3xl p-8 bg-white/5 border border-white/10 relative overflow-hidden group">
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
                      <Shield className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Enterprise Security</h3>
                    <p className="text-muted-foreground">Bank-level RLS policies protect your tournament data, participants, and financial records.</p>
                </div>
              </motion.div>

              {/* Feature 4: Roster Management (Horizontal) */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:col-span-3 rounded-3xl p-8 lg:p-12 bg-gradient-to-r from-white/5 to-white/5 border border-white/10 relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                <div className="relative z-10 max-w-xl">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3">The Squad Registry</h3>
                    <p className="text-muted-foreground text-lg">Coaches manage persistent team identities. Upload a logo once, build a roster, and apply to tournaments instantly without re-typing player data.</p>
                </div>
                <div className="relative z-10 shrink-0 w-full md:w-auto">
                    <div className="flex -space-x-4">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-16 h-16 rounded-full border-4 border-[#050505] bg-white/10 flex items-center justify-center backdrop-blur-md z-10 relative shadow-xl">
                          <Users className="w-6 h-6 text-white/50" />
                        </div>
                      ))}
                      <div className="w-16 h-16 rounded-full border-4 border-[#050505] bg-primary flex items-center justify-center backdrop-blur-md z-10 relative shadow-xl text-black font-black">
                        +12
                      </div>
                    </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* --- BOTTOM CTA --- */}
        <section className="py-32 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/20 blur-[150px] pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-black font-headline mb-6 leading-tight">Are you ready to play?</h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">Join the organizers and coaches who are already scaling their operations. No credit card required.</p>
            
            <Link href="/login">
              <button className="px-10 h-16 rounded-2xl bg-white text-black font-black text-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:scale-105 transition-all">
                Create Your Account
              </button>
            </Link>
            <p className="mt-6 text-sm text-muted-foreground uppercase tracking-widest font-bold">#PlayByNewRules</p>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="border-t border-white/10 bg-black/50 py-12 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <span className="font-headline font-bold text-xl tracking-tight">TOURNEY HUB</span>
            </div>
            
            <div className="flex gap-6 text-sm text-muted-foreground font-medium">
              <Link href="/login" className="hover:text-white transition-colors">Login</Link>
              <Link href="/dashboard/overview" className="hover:text-white transition-colors">Dashboard</Link>
              <span className="cursor-not-allowed">Privacy</span>
              <span className="cursor-not-allowed">Terms</span>
            </div>
            
            <p className="text-xs text-white/30">© 2026 Tourney Hub. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </div>
  )
}