'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Loader2, Calendar, Users, Share2, Trophy, Clock, CheckCircle2, ShieldCheck, Check, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const PublicTournamentPage = () => {
    const params = useParams();
    const tournamentId = params.id as string;
    const { toast } = useToast();
    
    const [tournament, setTournament] = useState<any>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
    const [hasApplied, setHasApplied] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            // Fetch Tournament
            const { data: tData } = await supabase
                .from('tournaments')
                .select('*, profiles:organizer_id(name, avatar_url)')
                .eq('id', tournamentId)
                .single();
            
            if (tData) setTournament(tData);

            // Fetch Approved Teams
            const { data: teamsData } = await supabase
                .from('teams')
                .select('id, name, logo_url')
                .eq('tournament_id', tournamentId)
                .eq('status', 'approved');
            
            if (teamsData) setTeams(teamsData);

            // Check if current user has already applied
            if (user && tData?.registration_mode === 'open') {
                const { data: appData } = await supabase
                    .from('tournament_applications')
                    .select('id')
                    .eq('tournament_id', tournamentId)
                    .eq('applicant_id', user.id)
                    .single();
                if (appData) setHasApplied(true);
            }

            setLoading(false);
        };

        fetchDetails();
    }, [tournamentId]);

    // Countdown Timer Logic
    useEffect(() => {
        if (!tournament) return;

        const targetDate = new Date(
            tournament.registration_mode === 'announcement' && tournament.registration_deadline 
                ? tournament.registration_deadline 
                : tournament.start_date
        ).getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(interval);
                setCountdown({ days: 0, hours: 0, minutes: 0 });
            } else {
                setCountdown({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [tournament]);

    const handleShare = async () => {
        const url = window.location.href;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: tournament?.name,
                    text: `Check out ${tournament?.name} on our platform!`,
                    url: url,
                });
                return;
            } catch (error) {
                console.log('Native share failed or aborted, falling back to copy.', error);
            }
        } 
        
        try {
            await navigator.clipboard.writeText(url);
            setIsCopied(true);
            toast({
                title: "Link Copied!",
                description: "Tournament URL saved to clipboard.",
            });
            
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        } catch (err) {
            toast({
                title: "Failed to copy",
                description: "Please copy the URL manually from your browser.",
                variant: "destructive",
            });
        }
    };

    const handleApply = async () => {
        if (!currentUser) {
            toast({
                title: "Login Required",
                description: "Please log in to apply for this tournament.",
                variant: "destructive"
            });
            // Optional: Redirect them to login
            // window.location.href = '/login'
            return;
        }
        
        const { error } = await supabase.from('tournament_applications').insert({
            tournament_id: tournamentId,
            applicant_id: currentUser.id
        });

        if (!error) {
            setHasApplied(true);
            toast({
                title: "Application Sent!",
                description: "The organizer has received your request.",
            });
        } else {
            toast({
                title: "Error",
                description: "Failed to send application. Try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div></DashboardLayout>;
    if (!tournament) return <DashboardLayout><div className="p-10 text-center text-2xl font-bold">Tournament not found.</div></DashboardLayout>;

    const isAnnouncement = tournament.registration_mode === 'announcement';
    const isOpen = tournament.registration_mode === 'open';
    const maxTeamsDisplay = tournament.max_teams > 0 ? tournament.max_teams : '∞';

    // Extract dynamic categories safely
    const categories = tournament.rules?.registration_categories || [];

    return (
        <DashboardLayout>
            {/* HERO BANNER SECTION */}
            <div className="relative w-full h-[400px] border-b border-white/10 overflow-hidden bg-black rounded-b-3xl">
                {tournament.banner_url ? (
                    <img src={tournament.banner_url} alt="Banner" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-primary/20 to-background" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 bg-primary/20 border border-primary/50 rounded-full text-xs font-bold text-primary uppercase tracking-widest">{tournament.sport}</span>
                            <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest">{tournament.level}</span>
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-extrabold font-headline leading-tight">{tournament.name}</h1>
                        <p className="text-lg text-muted-foreground mt-2 flex items-center gap-2">
                            Organized by <Avatar className="w-6 h-6"><AvatarImage src={tournament.profiles?.avatar_url}/><AvatarFallback className="bg-primary/20 text-primary">O</AvatarFallback></Avatar> <span className="text-foreground font-semibold">{tournament.profiles?.name}</span>
                        </p>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            className={`bg-background/50 backdrop-blur-md transition-all ${isCopied ? 'border-green-500/50 text-green-400' : ''}`} 
                            onClick={handleShare}
                        >
                            {isCopied ? <Check className="w-5 h-5 mr-2 text-green-400" /> : <Share2 className="w-5 h-5 mr-2" />} 
                            {isCopied ? 'Copied!' : 'Share'}
                        </Button>
                        
                        {isOpen && (
                            <Button 
                                size="lg" 
                                className={`shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] ${hasApplied ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                                onClick={handleApply}
                                disabled={hasApplied}
                            >
                                {hasApplied ? <><CheckCircle2 className="w-5 h-5 mr-2"/> Application Sent</> : 'Apply Now'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN - Details */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* COUNTDOWN WIDGET */}
                    <GlassCard className="p-8 border-primary/30 relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary-rgb),0.05)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-[50px] pointer-events-none" />
                        <h3 className="text-center text-muted-foreground font-semibold mb-4 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> 
                            {isAnnouncement ? 'Registration Closes In' : 'Tournament Kicks Off In'}
                        </h3>
                        <div className="flex justify-center gap-6 text-center">
                            <div className="flex flex-col"><span className="text-5xl font-black font-mono">{countdown.days}</span><span className="text-sm text-muted-foreground">Days</span></div>
                            <span className="text-5xl font-black text-white/20">:</span>
                            <div className="flex flex-col"><span className="text-5xl font-black font-mono">{countdown.hours.toString().padStart(2, '0')}</span><span className="text-sm text-muted-foreground">Hours</span></div>
                            <span className="text-5xl font-black text-white/20">:</span>
                            <div className="flex flex-col"><span className="text-5xl font-black font-mono">{countdown.minutes.toString().padStart(2, '0')}</span><span className="text-sm text-muted-foreground">Minutes</span></div>
                        </div>
                    </GlassCard>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <GlassCard className="p-4 text-center"><MapPin className="w-6 h-6 mx-auto mb-2 text-primary"/><p className="text-xs text-muted-foreground">Location</p><p className="font-bold">{tournament.location}</p></GlassCard>
                        <GlassCard className="p-4 text-center"><Calendar className="w-6 h-6 mx-auto mb-2 text-primary"/><p className="text-xs text-muted-foreground">Dates</p><p className="font-bold">{new Date(tournament.start_date).toLocaleDateString()}</p></GlassCard>
                        <GlassCard className="p-4 text-center"><Users className="w-6 h-6 mx-auto mb-2 text-primary"/><p className="text-xs text-muted-foreground">Format</p><p className="font-bold capitalize">{tournament.format}</p></GlassCard>
                        <GlassCard className="p-4 text-center"><ShieldCheck className="w-6 h-6 mx-auto mb-2 text-primary"/><p className="text-xs text-muted-foreground">Max Teams</p><p className="font-bold">{maxTeamsDisplay}</p></GlassCard>
                    </div>

                    <GlassCard className="p-8">
                        <h2 className="text-2xl font-bold mb-4">About & Rules</h2>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap mb-8">{tournament.additional_rules || "No additional rules provided."}</p>
                        
                        {/* REGISTRATION CATEGORIES RENDERER */}
                        {categories.length > 0 && (
                            <div className="mb-8 p-6 bg-black/20 rounded-xl border border-white/5">
                                <h3 className="font-bold flex items-center gap-2 mb-4"><Layers className="w-5 h-5 text-primary"/> Official Registration Categories</h3>
                                <div className="space-y-4">
                                    {categories.map((cat: any) => (
                                        <div key={cat.id}>
                                            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">{cat.name}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {cat.options.map((opt: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-sm font-medium">
                                                        {opt}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* OTHER DEEP CONFIG RULES */}
                        {Object.keys(tournament.rules || {}).length > 0 && (
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(tournament.rules).map(([key, val]) => {
                                    if(key === 'invited_coaches' || key === 'registration_categories') return null;
                                    return (
                                        <div key={key} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                            <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                                            <p className="font-bold">{String(val)}</p>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* RIGHT COLUMN - Prizing & Teams */}
                <div className="space-y-8">
                    
                    <GlassCard className="p-6 border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.05)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-green-500/20 rounded-full"><Trophy className="w-6 h-6 text-green-400" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground font-semibold">Total Prize Pool</p>
                                <p className="text-3xl font-black text-green-400">{tournament.prize_pool ? `${tournament.currency} ${tournament.prize_pool}` : 'TBA'}</p>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {tournament.prizes?.first && <div className="flex justify-between p-3 bg-white/5 rounded-lg"><span className="font-semibold text-yellow-500">1st Place</span><span className="font-bold text-right ml-4">{tournament.prizes.first}</span></div>}
                            {tournament.prizes?.second && <div className="flex justify-between p-3 bg-white/5 rounded-lg"><span className="font-semibold text-gray-400">2nd Place</span><span className="font-bold text-right ml-4">{tournament.prizes.second}</span></div>}
                            {tournament.prizes?.mvp && <div className="flex justify-between p-3 bg-white/5 rounded-lg"><span className="font-semibold text-primary">MVP</span><span className="font-bold text-right ml-4">{tournament.prizes.mvp}</span></div>}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-xl font-bold">Confirmed Teams</h2>
                            <span className="text-sm font-bold text-primary">{teams.length} / {maxTeamsDisplay}</span>
                        </div>
                        
                        {teams.length === 0 ? (
                            <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10 border-dashed">
                                <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">No teams have locked in yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {teams.map((team, i) => (
                                    <motion.div key={team.id} initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay: i * 0.1}} className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-lg border border-white/10">
                                        <Avatar className="w-10 h-10 border border-white/20">
                                            <AvatarImage src={team.logo_url} />
                                            <AvatarFallback className="bg-primary/20 text-primary font-bold">{team.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-bold">{team.name}</span>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </GlassCard>

                </div>
            </div>
        </DashboardLayout>
    );
};

export default PublicTournamentPage;