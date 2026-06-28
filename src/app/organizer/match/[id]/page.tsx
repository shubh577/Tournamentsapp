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

const INDIVIDUAL_SPORTS = ['tennis', 'badminton', 'karate', 'judo', 'wrestling'];

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

        // REALTIME SYNC
        const channel = supabase.channel(`match-control-${matchId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'matches', 
                filter: `id=eq.${matchId}` 
            }, (payload) => {
                if (payload.new.score_data) {
                   setScoreData(payload.new.score_data);
                }
                if (payload.new.status) {
                    setMatch((prev: any) => ({...prev, status: payload.new.status}));
                }
            })
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'match_events', 
                filter: `match_id=eq.${matchId}` 
            }, (payload) => {
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

        // Fetch raw match directly from table
        const { data: rawMatch, error: rawError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();
            
        if (rawError) console.error("Database connection issue for scores:", rawError);
            
        if (rawMatch) {
            const { data: tourneyData } = await supabase
                .from('tournaments')
                .select('id, sport, name, rules, organizer_id')
                .eq('id', rawMatch.tournament_id)
                .single();
                
            if (tourneyData) setTournament(tourneyData);

            const isIndSport = INDIVIDUAL_SPORTS.includes(tourneyData?.sport?.toLowerCase() || '');
            let a_name = 'TBA', a_logo = '', b_name = 'TBA', b_logo = '';
            
            // Map the correct ID based on the sport type
            const a_id = isIndSport ? rawMatch.player_a_id : rawMatch.team_a_id;
            const b_id = isIndSport ? rawMatch.player_b_id : rawMatch.team_b_id;

            // Fetch actual names and avatars based on the ID mapping
            if (isIndSport) {
                const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', [a_id, b_id].filter(Boolean));
                const pA = profiles?.find(p => p.id === a_id);
                const pB = profiles?.find(p => p.id === b_id);
                if (pA) { a_name = pA.name; a_logo = pA.avatar_url; }
                if (pB) { b_name = pB.name; b_logo = pB.avatar_url; }
            } else {
                const { data: teams } = await supabase.from('teams').select('id, name, logo_url').in('id', [a_id, b_id].filter(Boolean));
                const tA = teams?.find(t => t.id === a_id);
                const tB = teams?.find(t => t.id === b_id);
                if (tA) { a_name = tA.name; a_logo = tA.logo_url; }
                if (tB) { b_name = tB.name; b_logo = tB.logo_url; }
            }

            const normalizedMatch = {
                ...rawMatch,
                a_id, a_name, a_logo,
                b_id, b_name, b_logo,
            };

            setMatch(normalizedMatch);
            
            const initialScores = rawMatch.score_data || {};
            if (a_id && !initialScores[a_id]) initialScores[a_id] = { score: 0, secondary: 0, tertiary: 0, warnings: 0 };
            if (b_id && !initialScores[b_id]) initialScores[b_id] = { score: 0, secondary: 0, tertiary: 0, warnings: 0 };
            setScoreData(initialScores);

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
        if (!isNaN(m) && !isNaN(s)) setTimeLeft((m * 60) + s);
        setIsEditingTime(false);
    };

    // --- UNIVERSAL SCORING & WARNING ENGINE ---
    const handleScoreUpdate = async (
        teamId: string, 
        teamName: string, 
        eventType: string, 
        deltas: { score?: number, secondary?: number, tertiary?: number, warnings?: number }
    ) => {
        if (!isOrganizer) return;
        setIsUpdating(true);

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

        setEvents((prev: any[]) => [newEvent, ...prev]);

        const [updateRes, insertRes] = await Promise.all([
            supabase.from('matches').update({ score_data: updatedScoreData }).eq('id', matchId),
            supabase.from('match_events').insert({
                match_id: matchId,
                event_type: eventType,
                event_data: { team_id: teamId, team_name: teamName, deltas, match_time: timeLeft !== null ? formatTime(timeLeft) : null }
            })
        ]);

        if (updateRes.error) alert("Network Error: Failed to save score.");
        setIsUpdating(false);

        // DISQUALIFICATION ENGINE (5 Warnings)
        if (newTeamData.warnings >= 5 && match.status !== 'completed') {
            setTimeout(() => alert(`🚨 DISQUALIFICATION: ${teamName} has received 5 warnings! Please finalize the match.`), 500);
            setIsTimerRunning(false);
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
            setMatch((prev: any) => ({...prev, status: 'completed'}));
            alert("Match Finalized!");
            if (tournament?.id) router.push(`/organizer/manage-tournament/${tournament.id}`);
            else router.push(`/dashboard/overview`);
        } else alert("Error finalizing match.");
    };

    // --- KARATE SENSHU LOGIC (Bulletproofed) ---
    const getSenshuTeamId = () => {
        const currentSport = tournament?.sport?.toLowerCase()?.trim() || '';
        if (currentSport !== 'karate') return null;
        
        // Reverse to scan from oldest event to newest
        const oldestFirstEvents = [...events].reverse();
        
        for (const e of oldestFirstEvents) {
            // Safely parse event_data in case the database returned a string
            let evData = e.event_data;
            if (typeof evData === 'string') {
                try { evData = JSON.parse(evData); } catch (err) {}
            }
            
            const scoreDelta = evData?.deltas?.score;
            
            // We are looking for the very first positive score event
            if (typeof scoreDelta === 'number' && scoreDelta > 0) {
                const tId = evData.team_id;
                if (!tId) continue;

                // WKF Rule: Senshu is revoked if the player accumulates 4 warnings
                if ((scoreData[tId]?.warnings || 0) >= 4) {
                    return null;
                }
                
                return tId;
            }
        }
        
        return null;
    };

    const senshuTeamId = getSenshuTeamId();

    // --- DYNAMIC SCOREBOARD FORMATTER ---
    const renderScoreDisplay = (teamId: string) => {
        const currentSport = tournament?.sport?.toLowerCase()?.trim() || '';
        const data = scoreData[teamId] || { score: 0, secondary: 0, warnings: 0 };
        const teamColorClass = teamId === match.a_id ? "text-red-500" : "text-blue-500";
        const hasSenshu = currentSport === 'karate' && senshuTeamId === teamId;

        const baseScore = (() => {
            if (currentSport === 'cricket') {
                return (
                    <div className="flex flex-col items-center">
                        <span className={`text-6xl sm:text-8xl font-black font-mono tracking-tighter drop-shadow-[0_0_15px_currentColor] ${teamColorClass}`}>
                            {data.score}<span className="text-4xl text-muted-foreground opacity-50">/{data.secondary}</span>
                        </span>
                        <span className="text-xs uppercase tracking-widest text-muted-foreground mt-2 font-bold">Runs / Wickets</span>
                    </div>
                );
            }
            if (currentSport === 'tennis' || currentSport === 'volleyball' || currentSport === 'badminton') {
                return (
                    <div className="flex flex-col items-center">
                        <div className="flex gap-4 items-baseline">
                            <div className="text-center"><span className="text-3xl text-primary font-bold">{data.secondary}</span><p className="text-[10px] uppercase">Sets</p></div>
                            <span className={`text-6xl sm:text-8xl font-black font-mono tracking-tighter drop-shadow-[0_0_15px_currentColor] ${teamColorClass}`}>{data.score}</span>
                        </div>
                    </div>
                );
            }
            
            // Karate & Default fallback
            return (
                <div className="relative flex justify-center items-center w-full">
                    <span className={`text-6xl sm:text-8xl font-black font-mono tracking-tighter drop-shadow-[0_0_15px_currentColor] ${teamColorClass}`}>
                        {data.score}
                    </span>
                    
                    {/* The Senshu "S" Badge - Refactored to pure HTML to prevent mounting glitches */}
                    {hasSenshu && (
                        <div 
                            className="absolute -top-4 -right-2 sm:-top-6 sm:-right-6 z-50 bg-yellow-500 text-black text-2xl sm:text-3xl font-black w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full shadow-[0_0_25px_rgba(234,179,8,1)] border-2 border-black animate-in zoom-in duration-300"
                            title="Senshu (First Point Advantage)"
                        >
                            S
                        </div>
                    )}
                </div>
            );
        })();

        return (
            <div className="flex flex-col items-center">
                {baseScore}
                
                {/* Warnings Indicator (Visual Dots for Karate, Text for others) */}
                {currentSport === 'karate' ? (
                    <div className="mt-6 flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Warnings</span>
                        <div className="flex gap-2">
                            {[...Array(5)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border transition-all duration-300 ${
                                        i < data.warnings 
                                            ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]' 
                                            : 'bg-black/40 border-white/20'
                                    }`} 
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${data.warnings > 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-white/5 text-muted-foreground opacity-30'}`}>
                        <AlertTriangle className="w-3 h-3" />
                        Warnings: {data.warnings} / 5
                    </div>
                )}
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
                                        <AvatarImage src={match.a_logo} />
                                        <AvatarFallback className="text-2xl text-red-500 font-bold bg-transparent">{match.a_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 line-clamp-1 text-red-100">{match.a_name}</h2>
                                    {match.a_id && renderScoreDisplay(match.a_id)}
                                </div>

                                <div className="px-4 sm:px-8 text-2xl sm:text-4xl font-black text-white/20 italic">VS</div>

                                {/* Team B (Blue Styling) */}
                                <div className="flex flex-col items-center flex-1">
                                    <Avatar className="w-20 h-20 sm:w-28 sm:h-28 border-4 border-blue-500 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-black/50">
                                        <AvatarImage src={match.b_logo} />
                                        <AvatarFallback className="text-2xl text-blue-500 font-bold bg-transparent">{match.b_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <h2 className="text-xl sm:text-2xl font-bold text-center mb-2 line-clamp-1 text-blue-100">{match.b_name}</h2>
                                    {match.b_id && renderScoreDisplay(match.b_id)}
                                </div>
                            </div>
                        </GlassCard>

                        {/* Scoring Action Panels */}
                        {match.status !== 'completed' && isOrganizer && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Team A Scoring Panel */}
                                <GlassCard className="p-6 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                                    <h3 className="font-bold text-lg text-red-400 uppercase tracking-widest text-center mb-2">Score for {match.a_name}</h3>
                                    {match.a_id ? renderScoringControls(match.a_id, match.a_name) : <p className="text-center text-muted-foreground text-sm py-4">Participant TBA</p>}
                                </GlassCard>

                                {/* Team B Scoring Panel */}
                                <GlassCard className="p-6 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                                    <h3 className="font-bold text-lg text-blue-400 uppercase tracking-widest text-center mb-2">Score for {match.b_name}</h3>
                                    {match.b_id && !match.is_bye ? renderScoringControls(match.b_id, match.b_name) : <p className="text-center text-muted-foreground text-sm py-4">{match.is_bye ? "BYE" : "Participant TBA"}</p>}
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
                                                ev.event_data?.team_id === match.a_id 
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