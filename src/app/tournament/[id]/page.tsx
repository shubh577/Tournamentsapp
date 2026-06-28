'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Loader2, Calendar, Users, Share2, Trophy, Clock, CheckCircle2, ShieldCheck, Check, Layers, AlertTriangle, Scale, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function PublicTournamentPage() {
    const params = useParams();
    const tournamentId = params.id as string;
    const { toast } = useToast();
    
    const [tournament, setTournament] = useState<any>(null);
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
    
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [isCopied, setIsCopied] = useState(false);

    // --- LINEUP BUILDER STATES ---
    const [myPlayers, setMyPlayers] = useState<any[]>([]);
    const [myRoster, setMyRoster] = useState<any[]>([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
    const [selectedCategories, setSelectedCategories] = useState<Record<string, string>>({});
    const [lineupError, setLineupError] = useState<string | null>(null);
    const [isSubmittingRoster, setIsSubmittingRoster] = useState(false);

    useEffect(() => {
        if (tournamentId) {
            fetchDetails();
        }
    }, [tournamentId]);

    const fetchDetails = async () => {
        setLoading(true);
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
            .select('id, name, logo_url, coach_id')
            .eq('tournament_id', tournamentId)
            .eq('status', 'approved');
        
        if (teamsData) setTeams(teamsData);

        // Fetch user context if logged in
        if (user) {
            const { data: pData } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            setUserProfile(pData);

            // Fetch My Roster Entries
            fetchMyRoster(user.id, pData?.role);

            // --- THE FIX 1: Bulletproof Direct Player Fetch ---
            if (pData?.role === 'coach') {
                const { data: myPlayersData, error: playersError } = await supabase
                    .from('profiles')
                    .select(`
                        id, name, avatar_url, age, gender,
                        players!players_id_fkey!inner(coach_id, weight_kg)
                    `)
                    .eq('players.coach_id', user.id);
                
                if (playersError) console.error("Error fetching coach players:", playersError);
                
                if (myPlayersData) {
                    const formatted = myPlayersData.map((p: any) => {
                        const pDataExt = Array.isArray(p.players) ? p.players[0] : p.players;
                        return {
                            id: p.id, 
                            name: p.name || 'Unknown Athlete', 
                            avatar_url: p.avatar_url,
                            stats: { 
                                gender: p.gender, 
                                age: p.age, 
                                weight_kg: pDataExt?.weight_kg 
                            }
                        };
                    });
                    setMyPlayers(formatted);
                }
            } else if (pData?.role === 'player') {
                // Safely fetch individual player data
                const { data: myData } = await supabase.from('profiles').select('id, name, avatar_url, age, gender').eq('id', user.id).single();
                const { data: myStats } = await supabase.from('players').select('weight_kg').eq('id', user.id).maybeSingle();
                
                if (myData) {
                    setMyPlayers([{
                        id: myData.id, 
                        name: myData.name, 
                        avatar_url: myData.avatar_url,
                        stats: { gender: myData.gender, age: myData.age, weight_kg: myStats?.weight_kg }
                    }]);
                    setSelectedPlayerId(myData.id); // Auto-select for individuals
                }
            }
        }
        setLoading(false);
    };

    // --- THE FIX 2: Bulletproof 2-Step Roster Fetch ---
    const fetchMyRoster = async (userId: string, role: string) => {
        const query = supabase.from('tournament_roster').select('*').eq('tournament_id', tournamentId);
        if (role === 'coach') query.eq('coach_id', userId);
        else query.eq('player_id', userId);

        const { data, error } = await query;
        if (error) {
            console.error("Roster fetch error:", error);
            return;
        }

        if (data && data.length > 0) {
            const playerIds = data.map(r => r.player_id);
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', playerIds);
            
            const enrichedRoster = data.map(r => {
                const p = profilesData?.find(profile => profile.id === r.player_id);
                return { ...r, profiles: p || { name: 'Unknown Athlete' } };
            });
            
            setMyRoster(enrichedRoster);
        } else {
            setMyRoster([]);
        }
    };

    // Countdown Timer
    useEffect(() => {
        if (!tournament) return;
        const targetDate = new Date(tournament.registration_deadline || tournament.start_date).getTime();
        const interval = setInterval(() => {
            const distance = targetDate - new Date().getTime();
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

    // --- SMART VALIDATION ENGINE ---
    const validateEntry = (player: any, categories: Record<string, string>) => {
        for (const [catName, option] of Object.entries(categories)) {
            const optLower = String(option).toLowerCase();
            const pGender = player.stats?.gender?.toLowerCase();
            const pWeight = player.stats?.weight_kg;

            // 1. Gender Validation
            if (pGender === 'male' && (optLower.includes('female') || optLower.includes('women') || optLower.includes('girls'))) {
                return `Cannot register male athlete in a Female category (${option}).`;
            }
            if (pGender === 'female' && (optLower.includes('male') || optLower.includes('men') || optLower.includes('boys')) && !optLower.includes('female')) {
                return `Cannot register female athlete in a Male category (${option}).`;
            }

            // 2. Weight Validation
            const weightMatch = optLower.match(/([-+u])\s*(\d+(\.\d+)?)/i);
            if (weightMatch && pWeight) {
                const operator = weightMatch[1].toLowerCase();
                const limit = parseFloat(weightMatch[2]);
                if ((operator === '-' || operator === 'u') && pWeight > limit) return `Player weight (${pWeight}kg) exceeds category limit (${limit}kg).`;
                if (operator === '+' && pWeight < limit) return `Player weight (${pWeight}kg) is below category minimum (${limit}kg).`;
            }
        }
        return null;
    };

    const handleLockInPlayer = async () => {
        setLineupError(null);
        if (!selectedPlayerId) return setLineupError("Please select an athlete.");

        const requiredCategories = tournament.rules?.registration_categories || [];
        if (Object.keys(selectedCategories).length < requiredCategories.length) {
            return setLineupError("Please select an option for all required categories.");
        }

        const player = myPlayers.find(p => p.id === selectedPlayerId);
        if (!player) return;

        // Run Smart Validation
        const validationError = validateEntry(player, selectedCategories);
        if (validationError) return setLineupError(validationError);

        // Check if already registered
        if (myRoster.some(r => r.player_id === selectedPlayerId)) {
            return setLineupError("This athlete is already registered in the tournament lineup.");
        }

        setIsSubmittingRoster(true);
        const team = teams.find(t => t.coach_id === currentUser.id);

        const { error } = await supabase.from('tournament_roster').insert({
            tournament_id: tournamentId,
            team_id: team?.id || null,
            coach_id: userProfile?.role === 'coach' ? currentUser.id : null,
            player_id: selectedPlayerId,
            selected_categories: selectedCategories,
            status: 'registered'
        });

        setIsSubmittingRoster(false);

        if (error) {
            setLineupError(error.message || "Failed to register player.");
        } else {
            toast({ title: "Athlete Locked In", description: `${player.name} has been added to the tournament roster.` });
            setSelectedPlayerId('');
            setSelectedCategories({});
            fetchMyRoster(currentUser.id, userProfile?.role);
        }
    };

    const handleRemoveFromRoster = async (rosterId: string) => {
        if (!confirm("Remove this athlete from the tournament?")) return;
        await supabase.from('tournament_roster').delete().eq('id', rosterId);
        setMyRoster(prev => prev.filter(r => r.id !== rosterId));
        toast({ title: "Athlete Removed", description: "Lineup updated." });
    };

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
            toast({ title: "Link Copied!", description: "Tournament URL saved to clipboard." });
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast({ title: "Failed to copy", description: "Please copy the URL manually.", variant: "destructive" });
        }
    };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div></DashboardLayout>;
    if (!tournament) return <DashboardLayout><div className="p-10 text-center text-2xl font-bold">Tournament not found.</div></DashboardLayout>;

    const isAnnouncement = tournament.registration_mode === 'announcement';
    const isOpen = tournament.registration_mode === 'open';
    const isDeadlinePassed = tournament.registration_deadline && new Date(tournament.registration_deadline).getTime() < new Date().getTime();
    
    const hasApprovedTeam = teams.some(t => t.coach_id === currentUser?.id);
    const canBuildLineup = currentUser && (isOpen || hasApprovedTeam);
    const categories = tournament.rules?.registration_categories || [];
    const maxTeamsDisplay = tournament.max_teams > 0 ? tournament.max_teams : '∞';

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
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* COUNTDOWN WIDGET */}
                    <GlassCard className="p-8 border-primary/30 relative overflow-hidden shadow-[0_0_30px_rgba(var(--primary-rgb),0.05)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-[50px] pointer-events-none" />
                        <h3 className="text-center text-muted-foreground font-semibold mb-4 uppercase tracking-widest flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> {isDeadlinePassed ? 'Registration Closed' : 'Registration Closes In'}
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
                    </GlassCard>

                    {/* --- THE LINEUP BUILDER ENGINE --- */}
                    {canBuildLineup && !isAnnouncement && (
                        <GlassCard className="p-6 sm:p-8 border-primary/30 shadow-[0_0_40px_rgba(var(--primary-rgb),0.08)]">
                            <div className="mb-8 border-b border-white/10 pb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-3"><Scale className="w-6 h-6 text-primary"/> Official Weigh-in & Lineup</h2>
                                <p className="text-muted-foreground mt-1">Assign your athletes to their official tournament categories.</p>
                            </div>

                            {/* The Input Form (Locks if Deadline Passed) */}
                            {!isDeadlinePassed ? (
                                <div className="space-y-6 mb-10 p-6 bg-black/20 rounded-2xl border border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Select Athlete</label>
                                        <Select onValueChange={setSelectedPlayerId} value={selectedPlayerId}>
                                            <SelectTrigger className="h-14 bg-white/5 border-white/10">
                                                <SelectValue placeholder="Choose from your roster..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {myPlayers.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        <div className="flex justify-between w-full pr-4">
                                                            <span className="font-bold">{p.name}</span>
                                                            <span className="text-muted-foreground text-xs ml-4">
                                                                {p.stats.weight_kg ? `${p.stats.weight_kg}kg` : 'No Wt'} | {p.stats.gender || 'No Sex'}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                                {myPlayers.length === 0 && <SelectItem value="none" disabled>No athletes available</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {categories.length > 0 && selectedPlayerId && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                                            {categories.map((cat: any) => (
                                                <div key={cat.id} className="space-y-2">
                                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{cat.name}</label>
                                                    <Select onValueChange={v => setSelectedCategories(prev => ({...prev, [cat.name]: v}))}>
                                                        <SelectTrigger className="h-12 bg-white/5"><SelectValue placeholder={`Select ${cat.name}`} /></SelectTrigger>
                                                        <SelectContent>
                                                            {cat.options.map((opt: string, i: number) => <SelectItem key={i} value={opt}>{opt}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <AnimatePresence>
                                        {lineupError && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start text-red-400 text-sm">
                                                    <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                                                    <p>{lineupError}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <Button 
                                        onClick={handleLockInPlayer} 
                                        disabled={isSubmittingRoster || !selectedPlayerId} 
                                        className="w-full h-14 font-bold shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                                    >
                                        {isSubmittingRoster ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lock In Athlete'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                    <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                    <h3 className="font-bold text-red-400">Registration is Closed</h3>
                                    <p className="text-sm text-red-400/80">The deadline has passed. You can no longer alter your lineup.</p>
                                </div>
                            )}

                            {/* Current Submitted Lineup */}
                            <div>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">Your Registered Lineup <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{myRoster.length}</span></h3>
                                {myRoster.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic bg-white/5 p-4 rounded-xl text-center">No athletes registered yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        <AnimatePresence>
                                            {myRoster.map(roster => (
                                                <motion.div key={roster.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 group">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <Avatar className="w-10 h-10 border border-white/20"><AvatarImage src={roster.profiles?.avatar_url}/><AvatarFallback className="bg-primary/20 text-primary">{roster.profiles?.name?.charAt(0)}</AvatarFallback></Avatar>
                                                        <div className="overflow-hidden">
                                                            <h4 className="font-bold text-sm truncate">{roster.profiles?.name}</h4>
                                                            <div className="flex gap-2 mt-1">
                                                                {Object.values(roster.selected_categories).map((val: any, i) => (
                                                                    <span key={i} className="text-[10px] uppercase font-bold tracking-widest text-primary bg-primary/10 px-2 rounded-sm">{val}</span>
                                                                ))}
                                                            </div>
                                                            {roster.status === 'rejected' && <p className="text-xs text-red-400 mt-1 font-bold">Rejected: {roster.rejection_note}</p>}
                                                        </div>
                                                    </div>
                                                    {!isDeadlinePassed && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => handleRemoveFromRoster(roster.id)} 
                                                            className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 opacity-100 shrink-0"
                                                            title="Remove from Lineup"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </Button>
                                                        )}
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    )}
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
}