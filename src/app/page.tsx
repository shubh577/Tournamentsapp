'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
import { Trophy, Zap, Shield, ArrowRight, Activity, Users, Play, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/layout/AppHeader'

const SPORTS = ["Cricket", "Football", "Badminton", "Wrestling", "Kabaddi", "Basketball", "Tennis", "Volleyball"];

export default function LandingPage() {
  const router = useRouter()
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])

  const [authChecking, setAuthChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        // Double check onboarding status
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()

        if (!profile || !profile.onboarding_completed) {
          router.push('/onboarding')
        } else {
          setIsAuthenticated(true)
        }
      } else {
        setIsAuthenticated(false)
      }
      setAuthChecking(false)
    })

    return () => subscription.unsubscribe()
  }, [router])

  // Fade-in animation variants
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  }

  // Dynamic values for CTA buttons
  const ctaText = authChecking ? "Loading..." : (isAuthenticated ? "Access Dashboard" : "Get Started")
  const ctaLink = isAuthenticated ? "/dashboard/overview" : "/login"

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden selection:bg-primary/30">
      
      {/* --- AMBIENT BACKGROUND GLOWS (Light Theme) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div style={{ y }} className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <motion.div style={{ y }} className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-400/10 blur-[120px]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

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
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold uppercase tracking-widest text-primary mb-6">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span></span>
                Platform is Live
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-8xl font-black font-headline tracking-tighter leading-[1.1] mb-6 text-slate-900">
                Stop playing by <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500">the old rules.</span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A new era of tournament management is here. Everything you need to scale your event, manage your squad, and broadcast in real-time. All in one place.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href={ctaLink} className="w-full sm:w-auto">
                  <button 
                    disabled={authChecking}
                    className="w-full sm:w-auto px-8 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_15px_40px_rgba(var(--primary-rgb),0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group disabled:opacity-80 disabled:hover:translate-y-0"
                  >
                    {authChecking && <Loader2 className="w-5 h-5 animate-spin" />}
                    {!authChecking && ctaText}
                    {!authChecking && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </Link>
                <Link href="#features" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 h-14 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:shadow-sm text-slate-700 font-bold text-lg transition-all flex items-center justify-center gap-2">
                    <Play className="w-5 h-5 text-slate-400" /> How it Works
                  </button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Visual (Abstract Floating UI - Light Theme) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="flex-1 w-full max-w-lg lg:max-w-none relative perspective-1000"
            >
              <div className="relative w-full aspect-square md:aspect-[4/3] rounded-3xl bg-white/60 border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] backdrop-blur-3xl p-4 sm:p-8 flex flex-col gap-4 overflow-hidden transform-gpu">
                
                {/* Mock UI Element 1 */}
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="w-3/4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm backdrop-blur-md">
                  <div className="flex justify-between items-center mb-3"><div className="h-2 w-1/3 bg-slate-200 rounded-full" /><div className="h-4 w-12 bg-primary/10 rounded-sm" /></div>
                  <div className="h-2 w-full bg-slate-100 rounded-full mb-2" /><div className="h-2 w-5/6 bg-slate-100 rounded-full" />
                </motion.div>
                
                {/* Mock UI Element 2 - The Live Score */}
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="self-end w-4/5 p-6 rounded-2xl bg-white border border-slate-100 backdrop-blur-md shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.15)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  <div className="flex justify-between items-center relative z-10">
                     <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" /><div className="h-8 w-12 bg-slate-100 rounded-md font-bold text-slate-700 flex items-center justify-center">2</div></div>
                     <span className="text-slate-300 text-xl font-bold">VS</span>
                     <div className="flex items-center gap-3"><div className="h-8 w-12 bg-primary rounded-md font-bold text-white flex items-center justify-center shadow-[0_5px_15px_rgba(var(--primary-rgb),0.4)]">3</div><div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" /></div>
                  </div>
                </motion.div>

                {/* Mock UI Element 3 */}
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} className="w-2/3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm backdrop-blur-md mt-auto">
                   <div className="flex gap-2"><div className="w-6 h-6 rounded-md bg-green-500/10 border border-green-500/20" /><div className="flex-1 h-6 bg-slate-100 rounded-md" /></div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* --- INFINITE MARQUEE --- */}
        <div className="w-full border-y border-slate-200 bg-white py-6 overflow-hidden flex whitespace-nowrap relative">
            <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-white to-transparent z-10" />
            <motion.div 
              animate={{ x: [0, -1035] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
              className="flex gap-16 items-center px-8"
            >
              {[...SPORTS, ...SPORTS, ...SPORTS].map((sport, i) => (
                <span key={i} className="text-2xl font-black font-headline text-slate-200 uppercase tracking-widest flex items-center gap-4">
                  {sport} <span className="text-primary/30 text-3xl">•</span>
                </span>
              ))}
            </motion.div>
        </div>

        {/* --- BENTO GRID FEATURES --- */}
        <section id="features" className="py-32 px-4 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-black font-headline mb-6 text-slate-900">The Ultimate Ecosystem</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">Built from the ground up to eliminate spreadsheets, chaotic WhatsApp groups, and manual scorekeeping.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
              
              {/* Feature 1: Brackets (Large) */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:col-span-2 md:row-span-2 rounded-3xl p-8 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-200 relative overflow-hidden group hover:border-primary/20 hover:shadow-[0_20px_50px_-10px_rgba(var(--primary-rgb),0.1)] transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3 text-slate-900">Auto-Bracket Engine</h3>
                    <p className="text-slate-600 text-lg max-w-md">Our algorithm pairs approved teams, generates rounds, and manages byes instantly. Just click generate and watch the magic happen.</p>
                  </div>
                  
                  <div className="mt-8 relative h-32 w-full">
                     <div className="absolute right-0 bottom-0 w-[120%] h-[150%] bg-[url('/bracket-pattern.svg')] bg-cover opacity-[0.03] group-hover:scale-105 transition-transform duration-700 origin-bottom-right" />
                     <div className="absolute right-4 bottom-4 flex gap-4">
                        <div className="flex flex-col gap-4 border-r-2 border-slate-100 pr-4 py-4"><div className="w-24 h-8 bg-slate-50 border border-slate-100 rounded-md" /><div className="w-24 h-8 bg-slate-50 border border-slate-100 rounded-md" /></div>
                        <div className="flex flex-col justify-center border-r-2 border-slate-100 pr-4"><div className="w-24 h-8 bg-primary/10 border border-primary/20 rounded-md" /></div>
                        <div className="flex flex-col justify-center"><div className="w-32 h-12 bg-white shadow-sm border border-slate-200 rounded-md" /></div>
                     </div>
                  </div>
                </div>
              </motion.div>

              {/* Feature 2: Telemetry */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-3xl p-8 bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:border-red-500/20 transition-colors">
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-6 border border-red-100">
                      <Activity className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-900">Live Pulse</h3>
                    <p className="text-slate-600">Real-time match telemetry. Broadcast scores live to thousands of fans without refreshing.</p>
                </div>
              </motion.div>

              {/* Feature 3: Security */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="rounded-3xl p-8 bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:border-blue-500/20 transition-colors">
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6 border border-blue-100">
                      <Shield className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-900">Enterprise Security</h3>
                    <p className="text-slate-600">Bank-level RLS policies protect your tournament data, participants, and financial records.</p>
                </div>
              </motion.div>

              {/* Feature 4: Roster Management (Horizontal) */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:col-span-3 rounded-3xl p-8 lg:p-12 bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-8 hover:border-primary/20 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
                <div className="relative z-10 max-w-xl">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-6">
                      <Users className="w-6 h-6 text-slate-700" />
                    </div>
                    <h3 className="text-3xl font-bold mb-3 text-slate-900">The Squad Registry</h3>
                    <p className="text-slate-600 text-lg">Coaches manage persistent team identities. Upload a logo once, build a roster, and apply to tournaments instantly without re-typing player data.</p>
                </div>
                <div className="relative z-10 shrink-0 w-full md:w-auto">
                    <div className="flex -space-x-4">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="w-16 h-16 rounded-full border-4 border-white bg-slate-50 flex items-center justify-center backdrop-blur-md z-10 relative shadow-sm">
                          <Users className="w-6 h-6 text-slate-300" />
                        </div>
                      ))}
                      <div className="w-16 h-16 rounded-full border-4 border-white bg-primary flex items-center justify-center z-10 relative shadow-md text-white font-black">
                        +12
                      </div>
                    </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* --- BOTTOM CTA --- */}
        <section className="py-32 px-4 relative overflow-hidden bg-white border-t border-slate-200">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-black font-headline mb-6 leading-tight text-slate-900">Are you ready to play?</h2>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto">Join the organizers and coaches who are already scaling their operations. No credit card required.</p>
            
            <Link href={ctaLink}>
              <button 
                disabled={authChecking}
                className="px-10 h-16 rounded-2xl bg-slate-900 text-white font-black text-xl shadow-[0_15px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-80 disabled:hover:translate-y-0"
              >
                {authChecking && <Loader2 className="w-5 h-5 animate-spin" />}
                {!authChecking && ctaText}
              </button>
            </Link>
            <p className="mt-6 text-sm text-slate-400 uppercase tracking-widest font-bold">#PlayByNewRules</p>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="bg-slate-50 border-t border-slate-200 py-12 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-headline font-bold text-xl tracking-tight text-slate-900">TOURNEY HUB</span>
            </div>
            
            <div className="flex gap-6 text-sm text-slate-500 font-medium">
              <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
              <Link href="/dashboard/overview" className="hover:text-primary transition-colors">Dashboard</Link>
              <span className="cursor-not-allowed">Privacy</span>
              <span className="cursor-not-allowed">Terms</span>
            </div>
            
            <p className="text-xs text-slate-400">© 2026 Tourney Hub. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </div>
  )
}