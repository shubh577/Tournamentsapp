'use client'

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ChevronLeft, Activity, Trophy, AlertCircle, Clock, Zap, Flag, History, Play, Pause, RotateCcw, Pencil, Save, Lock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MatchScoringPage = () => {
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;

    const [match, setMatch] = useState<any>(null);
    const [tournament, setTournament] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // SECURITY STATE
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Dynamic Score State
    const [scoreData, setScoreData] = useState<Record<string, any>>({});
    // Use a ref to track the absolute latest state to prevent rapid-tap race conditions
    const scoreDataRef = useRef<Record<string, any>>({});

    // Timer State
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editMins, setEditMins] = useState("");
    const [editSecs, setEditSecs] = useState("");

    useEffect(() => {
        scoreDataRef.current = scoreData;
    }, [scoreData]);

    useEffect(() => {
        fetchMatchData();

        // REALTIME SYNC: Keep multiple scoring iPads perfectly in sync
        const channel = supabase.channel(`match-control-${matchId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'matches', 
                filter: `id=eq.${matchId}` 
            }, (payload) => {
                // Only update if we aren't the ones currently pushing an update
                if (payload.new.score_data) {
                   setScoreData(payload.new.score_data);
                }
                if (payload.new.status) {
                    // FIX: Added explicit (prev: any) typing
                    setMatch((prev: any) => ({...prev, status: payload.new.status}));
                }
            })
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'match_events', 
                filter: `match_id=eq.${matchId}` 
            }, (payload) => {
                // FIX: Added explicit (prev: any[]) typing
                setEvents((prev: any[]) => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId]);

    const fetchMatchData = async () => {
        setLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        const { data: matchData } = await supabase
            .from('match_details')
            .select('*')
            .eq('id', matchId)
            .single();
            
        const { data: rawMatch, error: rawError } = await supabase
            .from('matches')
            .select('score_data, status')
            .eq('id', matchId)
            .single();
            
        if (rawError) console.error("Database connection issue for scores:", rawError);
            
        if (matchData) {
            setMatch({ ...matchData, status: rawMatch?.status || matchData.status });
            
            const initialScores = rawMatch?.score_data || matchData.score_data || {};
            if (!initialScores[matchData.team_a_id]) initialScores[matchData.team_a_id] = { score: 0, secondary: 0, tertiary: 0, warnings: 0 };
            if (!initialScores[matchData.team_b_id]) initialScores[matchData.team_b_id] = { score: 0, secondary: 0, tertiary: 0, warnings: 0 };
            
            setScoreData(initialScores);

            const { data: tourneyData } = await supabase.from('tournaments').select('id, sport, name, rules, organizer_id').eq('id', matchData.tournament_id).single();
            if (tourneyData) setTournament(tourneyData);

            const { data: eventData } = await supabase
                .from('match_events')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: false });
            if (eventData) setEvents(eventData);
        }
        setLoading(false);
    };

    const isOrganizer = currentUserId === tournament?.organizer_id;
    const sport = tournament?.sport?.toLowerCase() || '';
    const needsTimer = ['football', 'basketball', 'wrestling', 'kabaddi', 'karate', 'judo'].includes(sport);

    useEffect(() => {
        if (tournament && needsTimer && timeLeft === null) {
            const rules = tournament.rules || {};
            const durationMins = rules.half_duration || rules.quarter_duration || rules.period_duration || rules.match_duration || 10;
            setTimeLeft(Number(durationMins) * 60);
        }
    }, [tournament, needsTimer, timeLeft]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && timeLeft !== null && timeLeft > 0) {
            interval = setInterval(() => {
                // FIX: Added explicit (prev: number | null) typing
                setTimeLeft((prev: number | null) => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else if (isTimerRunning && timeLeft === 0) {
            setIsTimerRunning(false);
            setTimeout(() => {
                alert(`⏰ TIME IS UP! The clock has hit zero. Please review the scores and finalize the match manually.`);
            }, 500);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        if (isEditingTime || !isOrganizer) return;
        setIsTimerRunning(!isTimerRunning);
    };

    const resetTimer = () => {
        if (!isOrganizer) return;
        setIsTimerRunning(false);
        setIsEditingTime(false);
        const rules = tournament?.rules || {};
        const durationMins = rules.half_duration || rules.quarter_duration || rules.period_duration || rules.match_duration || 10;
        setTimeLeft(Number(durationMins) * 60);
    };

    const handleEditTimeClick = () => {
        if (!isOrganizer) return;
        setIsTimerRunning(false);
        setEditMins(Math.floor((timeLeft || 0) / 60).toString());
        setEditSecs(((timeLeft || 0) % 60).toString());
        setIsEditingTime(true);
    };

    const handleSaveTime = () => {
        const m = parseInt(editMins || "0", 10);
        const s = parseInt(editSecs || "0", 10);
        
        if (!isNaN(m) && !isNaN(s)) {
            setTimeLeft((m * 60) + s);
        }
        setIsEditingTime(false);
    };

    // --- UNIVERSAL SCORING & WARNING ENGINE (Fixed Race Conditions) ---
    const handleScoreUpdate = async (
        teamId: string, 
        teamName: string, 
        eventType: string, 
        deltas: { score?: number, secondary?: number, tertiary?: number, warnings?: number }
    ) => {
        if (!isOrganizer) return;

        setIsUpdating(true);

        // Always calculate off the ref to prevent rapid-tap overwrites
        const latestData = scoreDataRef.current;
        const currentTeamData = latestData[teamId] || { score: 0, secondary: 0, tertiary: 0, warnings: 0 };
        
        const newTeamData = {
            score: (currentTeamData.score || 0) + (deltas.score || 0),
            secondary: (currentTeamData.secondary || 0) + (deltas.secondary || 0),
            tertiary: (currentTeamData.tertiary || 0) + (deltas.tertiary || 0),
            warnings: (currentTeamData.warnings || 0) + (deltas.warnings || 0),
        };

        const updatedScoreData = { ...latestData, [teamId]: newTeamData };
        setScoreData(updatedScoreData);

        const newEvent = {
            id: Math.random().toString(),
            match_id: matchId,
            event_type: eventType,
            event_data: { team_id: teamId, team_name: teamName, deltas, match_time: timeLeft !== null ? formatTime(timeLeft) : null },
            created_at: new Date().toISOString()
        };

        // FIX: Added explicit (prev: any[]) typing
        setEvents((prev: any[]) => [newEvent, ...prev]);

        const [updateRes, insertRes] = await Promise.all([
            supabase.from('matches').update({ score_data: updatedScoreData }).eq('id', matchId),
            supabase.from('match_events').insert({
                match_id: matchId,
                event_type: eventType,
                event_data: { team_id: teamId, team_name: teamName, deltas, match_time: timeLeft !== null ? formatTime(timeLeft) : null }
            })
        ]);

        if (updateRes.error) {
            console.error("FAILED TO SAVE SCORE:", updateRes.error);
            alert("Network Error: Failed to save score. Please check your connection.");
        }

        setIsUpdating(false);

        // DISQUALIFICATION ENGINE (5 Warnings)
        if (newTeamData.warnings >= 5 && match.status !== 'completed') {
            setTimeout(() => {
                alert(`🚨 DISQUALIFICATION: ${teamName} has received 5 warnings! Please finalize the match.`);
                setIsTimerRunning(false);
            }, 500);
        }
    };

    const handleCompleteMatch = async (autoFinalize = false) => {
        if (!isOrganizer) return;

        if (!autoFinalize) {
            const confirmEnd = window.confirm("Are you sure you want to finalize this match? This will lock the scores.");
            if (!confirmEnd) return;
        }

        setIsUpdating(true);
        const { error } = await supabase.from('matches').update({ status: 'completed' }).eq('id', matchId);
        setIsUpdating(false);

        if (!error) {
            // FIX: Added explicit (prev: any) typing
            setMatch((prev: any) => ({...prev, status: 'completed'}));
            alert("Match Finalized!");
            
            if (tournament?.id) {
                router.push(`/organizer/manage-tournament/${tournament.id}`);
            } else {
                router.push(`/dashboard/overview`);
            }
        } else {
            console.error("Failed to complete match:", error);
            alert("Error finalizing match.");
        }
    };

    // --- DYNAMIC SCOREBOARD FORMATTER ---
    const renderScoreDisplay = (teamId: string) => {
        const data = scoreData[teamId] || { score: 0, secondary: 0, warnings: 0 };
        const teamColorClass = teamId === match.team_a_id ? "text-red-500" : "text-blue-500";

        const baseScore = (() => {
            if (sport === 'cricket') {
                return (
                    <div className="flex flex-col items-center">
                        <span className={`text-6xl sm:text-8xl font-black font-mono tracking-tighter drop-shadow-[0_0_15px_currentColor] ${teamColorClass}`}>
                            {data.score}<span className="text-4xl text-muted-foreground opacity-50">/{data.secondary}</span>
                        </span>
                        <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2 font-bold">Runs / Wickets</span>
                    </div>
                );
            }
            if (sport === 'tennis' || sport === 'volleyball' || sport === 'badminton') {
                return (
                    <div className="flex flex-col items-center">
                        <div className="flex gap-4 items-baseline">
                            <div className="text-center"><span className="text-3xl text-primary font-bold">{data.secondary}</span><p className="text-[10px] uppercase">Sets</p></div>
                            <span className={`text-6xl sm:text-8xl font-black font-mono tracking-tighter drop-shadow-[0_0_15px_currentColor] ${teamColorClass}`}>{data.score}</span>
                        </div>
                    </div>
                );
            }
            return <span className={`text-6xl sm:text-8xl font-black font-mono tracking-tighter drop-shadow-[0_0_15px_currentColor] ${teamColorClass}`}>{data.score}</span>;
        })();

        return (
            <div className="flex flex-col items-center">
                {baseScore}
                {/* Yellow Warning Indicator */}
                <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${data.warnings > 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-white/5 text-muted-foreground opacity-30'}`}>
                    <AlertTriangle className="w-3 h-3" />
                    Warnings: {data.warnings} / 5
                </div>
            </div>
        );
    };

    // --- DYNAMIC CONTROL PANELS WITH UNIVERSAL WARNING ---
    const renderScoringControls = (teamId: string, teamName: string) => {
        const sportSpecificControls = (() => {
            switch (sport) {
                case 'cricket': return (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button variant="outline" className="h-12 bg-white/5 hover:bg-primary/20" onClick={() => handleScoreUpdate(teamId, teamName, 'Single', {score: 1})}>+1 Run</Button>
                        <Button variant="outline" className="h-12 bg-white/5 hover:bg-primary/20" onClick={() => handleScoreUpdate(teamId, teamName, 'Boundary (4)', {score: 4})}>+4 Runs</Button>
                        <Button variant="outline" className="h-12 bg-white/5 hover:bg-primary/20" onClick={() => handleScoreUpdate(teamId, teamName, 'Six (6)', {score: 6})}>+6 Runs</Button>
                        <Button variant="destructive" className="h-12 bg-red-500/10 text-red-500 hover:bg-red-500/20" onClick={() => handleScoreUpdate(teamId, teamName, 'Wicket', {secondary: 1})}>Wicket</Button>
                        <Button variant="ghost" className="col-span-2 text-xs text-muted-foreground border border-white/10" onClick={() => handleScoreUpdate(teamId, teamName, 'Extra (Wide/NB)', {score: 1})}>+1 Extra</Button>
                    </div>
                );
                case 'basketball': return (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button variant="outline" className="col-span-2 h-12 bg-white/5 hover:bg-primary/20" onClick={() => handleScoreUpdate(teamId, teamName, 'Free Throw', {score: 1})}>+1 Free Throw</Button>
                        <Button variant="outline" className="h-14 bg-white/5 hover:bg-primary/20" onClick={() => handleScoreUpdate(teamId, teamName, '2-Pointer', {score: 2})}>+2 PTS</Button>
                        <Button variant="outline" className="h-14 bg-white/5 hover:bg-primary/20" onClick={() => handleScoreUpdate(teamId, teamName, '3-Pointer', {score: 3})}>+3 PTS</Button>
                    </div>
                );
                case 'football': return (
                    <div className="grid grid-cols-1 gap-2 mt-4">
                        <Button className="h-16 text-lg font-bold shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" onClick={() => handleScoreUpdate(teamId, teamName, 'Goal', {score: 1})}><Zap className="w-5 h-5 mr-2" /> GOAL</Button>
                        <Button variant="outline" className="text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => handleScoreUpdate(teamId, teamName, 'Red Card', {})}>Red Card</Button>
                    </div>
                );
                case 'badminton':
                case 'volleyball': return (
                    <div className="grid grid-cols-1 gap-3 mt-4">
                        <Button className="h-16 text-lg font-bold" onClick={() => handleScoreUpdate(teamId, teamName, 'Point Won', {score: 1})}><Zap className="w-5 h-5 mr-2" /> +1 Point</Button>
                        <Button variant="secondary" className="h-12 border border-white/10" onClick={() => handleScoreUpdate(teamId, teamName, 'Set Won', {secondary: 1, score: -(scoreData[teamId]?.score || 0)})}>End Set (Winner)</Button>
                    </div>
                );
                case 'tennis': return (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button variant="outline" className="h-12 bg-white/5" onClick={() => handleScoreUpdate(teamId, teamName, 'Point (15)', {score: 15})}>+15 Pts</Button>
                        <Button variant="outline" className="h-12 bg-white/5" onClick={() => handleScoreUpdate(teamId, teamName, 'Point (10)', {score: 10})}>+10 Pts</Button>
                        <Button variant="secondary" className="col-span-2 h-12" onClick={() => handleScoreUpdate(teamId, teamName, 'Game Won', {tertiary: 1, score: -(scoreData[teamId]?.score || 0)})}>Game Won</Button>
                        <Button className="col-span-2 h-12" onClick={() => handleScoreUpdate(teamId, teamName, 'Set Won', {secondary: 1, tertiary: -(scoreData[teamId]?.tertiary || 0)})}>Set Won</Button>
                    </div>
                );
                case 'wrestling': return (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button variant="outline" className="h-12 bg-white/5" onClick={() => handleScoreUpdate(teamId, teamName, 'Takedown/Exposure', {score: 2})}>+2 PTS</Button>
                        <Button variant="outline" className="h-12 bg-white/5" onClick={() => handleScoreUpdate(teamId, teamName, 'Reversal/Throw', {score: 4})}>+4 PTS</Button>
                        <Button variant="outline" className="col-span-2 h-10 bg-white/5" onClick={() => handleScoreUpdate(teamId, teamName, 'Grand Amplitude', {score: 5})}>+5 PTS</Button>
                        <Button className="col-span-2 h-14 bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)] mt-2" onClick={() => handleScoreUpdate(teamId, teamName, 'Fall (Pin)', {score: 100})}>FALL / PIN (WIN)</Button>
                    </div>
                );
                case 'kabaddi': return (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button variant="outline" className="h-12 bg-white/5" onClick={() => handleScoreUpdate(teamId, teamName, 'Touch Point', {score: 1})}>Touch (+1)</Button>
                        <Button variant="outline" className="h-12 bg-white/5" onClick={() => handleScoreUpdate(teamId, teamName, 'Bonus Point', {score: 1})}>Bonus (+1)</Button>
                        <Button variant="outline" className="h-12 bg-white/5" onClick={() => handleScoreUpdate(teamId, teamName, 'Tackle', {score: 1})}>Tackle (+1)</Button>
                        <Button className="h-12 bg-primary/80" onClick={() => handleScoreUpdate(teamId, teamName, 'All Out', {score: 2})}>All Out (+2)</Button>
                    </div>
                );
                case 'karate': return (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <Button variant="outline" className="h-12 bg-white/5 text-xs" onClick={() => handleScoreUpdate(teamId, teamName, 'Yuko', {score: 1})}>Yuko (1)</Button>
                        <Button variant="outline" className="h-12 bg-white/5 text-xs" onClick={() => handleScoreUpdate(teamId, teamName, 'Waza-ari', {score: 2})}>Waza-ari (2)</Button>
                        <Button className="h-12 text-xs font-bold" onClick={() => handleScoreUpdate(teamId, teamName, 'Ippon', {score: 3})}>Ippon (3)</Button>
                    </div>
                );
                case 'judo': return (
                    <div className="grid grid-cols-1 gap-2 mt-4">
                        <Button variant="outline" className="h-14 bg-white/5" onClick={() => handleScoreUpdate(teamId, teamName, 'Waza-ari', {score: 1})}>Waza-ari (1)</Button>
                        <Button className="h-14 bg-green-600 hover:bg-green-700" onClick={() => handleScoreUpdate(teamId, teamName, 'Ippon (Win)', {score: 100})}>IPPON (WIN)</Button>
                    </div>
                );
                default: return (
                    <div className="mt-4">
                        <Button className="w-full h-16 text-lg font-bold shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)] transition-all" onClick={() => handleScoreUpdate(teamId, teamName, 'Point Scored', {score: 1})}>
                            <Zap className="w-5 h-5 mr-2" /> Add 1 Point
                        </Button>
                    </div>
                );
            }
        })();

        return (
            <div>
                {sportSpecificControls}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <Button 
                        variant="outline" 
                        className="w-full h-12 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-colors" 
                        onClick={() => handleScoreUpdate(teamId, teamName, 'Official Warning', {warnings: 1})}
                    >
                        <AlertTriangle className="w-4 h-4 mr-2" /> Issue Warning
                    </Button>
                </div>
            </div>
        );
    };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div></DashboardLayout>;
    if (!match) return <DashboardLayout><div className="flex justify-center items-center h-screen font-bold">Match not found.</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <Button variant="ghost" onClick={() => {
                            if (tournament?.id) {
                                router.push(`/organizer/manage-tournament/${tournament.id}`);
                            } else {
                                router.push('/dashboard/overview');
                            }
                        }} className="mb-2 -ml-4 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </Button>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 bg-white/10 rounded-md text-xs font-bold uppercase tracking-widest">{tournament?.name}</span>
                            <span className="px-3 py-1 bg-primary/20 text-primary rounded-md text-xs font-bold uppercase tracking-widest">{match?.round_name}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold font-headline tracking-tight flex items-center gap-2">
                            Match Center 
                            {!isOrganizer && <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded text-sm font-bold flex items-center ml-2"><Lock className="w-4 h-4 mr-2"/> Read-Only Mode</span>}
                        </h1>
                    </div>
                    
                    {isOrganizer && (
                        <Button 
                            size="lg" 
                            variant={match.status === 'completed' ? 'secondary' : 'default'}
                            onClick={() => handleCompleteMatch(false)} 
                            disabled={isUpdating || match.status === 'completed'}
                            className={match.status === 'completed' ? '' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}
                        >
                            {isUpdating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : match.status === 'completed' ? <Flag className="w-5 h-5 mr-2" /> : <Trophy className="w-5 h-5 mr-2" />}
                            {match.status === 'completed' ? 'Match Finalized' : 'Finalize Match'}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    
                    {/* LEFT COL: Live Scoreboard & Controls */}
                    <div className="xl:col-span-2 space-y-8">
                        
                        {/* The Cinematic Scoreboard */}
                        <GlassCard className="p-8 sm:p-12 border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.05)] relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-[80px] pointer-events-none" />
                            
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm">
                                    <Activity className="w-4 h-4 animate-pulse" /> Live Score <span className="text-muted-foreground ml-2">({tournament?.sport})</span>
                                </div>
                                <div className="px-3 py-1 bg-black/40 border border-white/10 rounded-full text-xs font-mono text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> MATCH ID: {match.id.split('-')[0]}
                                </div>
                            </div>

                            {/* Cinematic Editable Timer Engine */}
                            {needsTimer && timeLeft !== null && (
                                <div className="flex flex-col items-center justify-center mb-10 relative z-10">
                                    {isEditingTime ? (
                                        <div className="flex items-center gap-2 mb-2 bg-black/40 p-4 rounded-xl border border-white/10">
                                            <Input 
                                                type="number" 
                                                value={editMins} 
                                                onChange={(e) => setEditMins(e.target.value)} 
                                                className="w-20 text-center text-2xl font-bold bg-white/5 border-white/20"
                                                placeholder="MM"
                                            />
                                            <span className="text-2xl font-bold text-muted-foreground">:</span>
                                            <Input 
                                                type="number" 
                                                value={editSecs} 
                                                onChange={(e) => setEditSecs(e.target.value)} 
                                                className="w-20 text-center text-2xl font-bold bg-white/5 border-white/20"
                                                placeholder="SS"
                                            />
                                            <Button onClick={handleSaveTime} className="ml-4 bg-primary text-white"><Save className="w-4 h-4 mr-2"/> Save</Button>
                                        </div>
                                    ) : (
                                        <div className={`text-6xl sm:text-8xl font-mono font-black tracking-widest drop-shadow-[0_0_20px_rgba(var(--primary-rgb),0.6)] ${timeLeft <= 60 && isTimerRunning ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                                            {formatTime(timeLeft)}
                                        </div>
                                    )}

                                    {!isEditingTime && isOrganizer && match.status !== 'completed' && (
                                        <div className="flex gap-2 mt-4 flex-wrap justify-center">
                                            <Button 
                                                size="sm" 
                                                variant={isTimerRunning ? "destructive" : "default"} 
                                                onClick={toggleTimer}
                                                className="font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                                            >
                                                {isTimerRunning ? <Pause className="w-4 h-4 mr-2"/> : <Play className="w-4 h-4 mr-2"/>}
                                                {isTimerRunning ? 'Pause Match' : 'Start Match'}
                                            </Button>
                                            
                                            <Button size="sm" variant="outline" onClick={handleEditTimeClick} className="bg-white/5 border-white/10 hover:bg-white/10">
                                                <Pencil className="w-4 h-4 mr-2" /> Edit Time
                                            </Button>

                                            <Button size="sm" variant="outline" onClick={resetTimer} className="bg-white/5 border-white/10 hover:bg-white/10">
                                                <RotateCcw className="w-4 h-4 mr-2" /> Reset
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between relative z-10">
                                {/* Team A (Red Styling) */}
                                <div className="flex flex-col items-center flex-1">
                                    <Avatar className="w-20 h-20 sm:w-28 sm:h-28 border-4 border-red-500 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.3)] bg-black/50">
                                        <AvatarImage src={match.team_a_logo} />
                                        <AvatarFallback className="text-2xl text-red-500 font-bold bg-transparent">{match.team_a_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 line-clamp-1 text-red-100">{match.team_a_name}</h2>
                                    {renderScoreDisplay(match.team_a_id)}
                                </div>

                                <div className="px-4 sm:px-8 text-2xl sm:text-4xl font-black text-white/20 italic">VS</div>

                                {/* Team B (Blue Styling) */}
                                <div className="flex flex-col items-center flex-1">
                                    <Avatar className="w-20 h-20 sm:w-28 sm:h-28 border-4 border-blue-500 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-black/50">
                                        <AvatarImage src={match.team_b_logo} />
                                        <AvatarFallback className="text-2xl text-blue-500 font-bold bg-transparent">{match.team_b_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 line-clamp-1 text-blue-100">{match.team_b_name}</h2>
                                    {renderScoreDisplay(match.team_b_id)}
                                </div>
                            </div>
                        </GlassCard>

                        {/* Scoring Action Panels */}
                        {match.status !== 'completed' && isOrganizer && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Team A Scoring Panel */}
                                <GlassCard className="p-6 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                                    <h3 className="font-bold text-lg text-red-400 uppercase tracking-widest text-center mb-2">Score for {match.team_a_name}</h3>
                                    {renderScoringControls(match.team_a_id, match.team_a_name)}
                                </GlassCard>

                                {/* Team B Scoring Panel */}
                                <GlassCard className="p-6 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                                    <h3 className="font-bold text-lg text-blue-400 uppercase tracking-widest text-center mb-2">Score for {match.team_b_name}</h3>
                                    {renderScoringControls(match.team_b_id, match.team_b_name)}
                                </GlassCard>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COL: Live Ticker */}
                    <GlassCard className="p-6 flex flex-col h-[600px] xl:h-auto border-white/10">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2"><History className="w-5 h-5 text-primary"/> Match Feed</h3>
                            <span className="text-xs bg-white/5 px-2 py-1 rounded text-muted-foreground">{events.length} Events</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            <AnimatePresence>
                                {events.length === 0 ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                        <AlertCircle className="w-10 h-10 mb-2" />
                                        <p className="text-sm">No events logged yet.</p>
                                    </motion.div>
                                ) : (
                                    events.map((ev, i) => (
                                        <motion.div 
                                            key={ev.id}
                                            layout
                                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3"
                                        >
                                            {/* Color-coded Timeline Dots */}
                                            <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                                                ev.event_data?.team_id === match.team_a_id 
                                                    ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' 
                                                    : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]'
                                            }`} />
                                            
                                            <div>
                                                <p className="text-sm font-bold text-white">{ev.event_data?.team_name}</p>
                                                <p className="text-xs text-muted-foreground">Action: <span className="text-white font-bold">{ev.event_type}</span></p>
                                                {ev.event_data?.match_time && (
                                                    <p className="text-[10px] text-primary font-mono mt-0.5">⏱ {ev.event_data.match_time}</p>
                                                )}
                                            </div>
                                            <div className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap bg-black/40 px-2 py-1 rounded">
                                                {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MatchScoringPage;