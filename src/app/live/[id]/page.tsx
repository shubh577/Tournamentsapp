'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ChevronLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicLiveMatch() {
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;

    // Structural states (Fetched once)
    const [metaData, setMetaData] = useState<{
        a_name: string;
        b_name: string;
        player_a_id?: string;
        player_b_id?: string;
        shadow_player_a_id?: string;
        shadow_player_b_id?: string;
        team_a_id?: string;
        team_b_id?: string;
        isInd: boolean;
    } | null>(null);

    // Dynamic states 
    const [scoreData, setScoreData] = useState<Record<string, any>>({});
    const [timerValue, setTimerValue] = useState<number>(0);
    const [roundName, setRoundName] = useState<string>('Match');
    const [matchStatus, setMatchStatus] = useState<string>('scheduled');
    const [showOverlay, setShowOverlay] = useState(true);
    
    // Senshu tracking state
    const [senshuOwnerId, setSenshuOwnerId] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!matchId) return;

        let channel: any;

        const startPollingEngine = async () => {
            setLoading(true);
            
            // Step 1: Fetch the core structure & names exactly once
            const { data: mData } = await supabase.from('matches').select('*').eq('id', matchId).single();
            
            if (mData) {
                const isInd = !!(mData.player_a_id || mData.shadow_player_a_id);
                let a_name = 'TBA', b_name = 'TBA';
                
                const targetAId = isInd ? (mData.player_a_id || mData.shadow_player_a_id) : mData.team_a_id;
                const targetBId = isInd ? (mData.player_b_id || mData.shadow_player_b_id) : mData.team_b_id;
                
                if (isInd) {
                    // Try to fetch standard authenticated profiles
                    const profileIds = [mData.player_a_id, mData.player_b_id].filter(Boolean);
                    let standardProfiles: any[] = [];
                    if (profileIds.length > 0) {
                        const { data: p } = await supabase.from('profiles').select('id, name').in('id', profileIds);
                        standardProfiles = p || [];
                    }

                    // Try to fetch custom shadow proxy profiles
                    const shadowIds = [mData.shadow_player_a_id, mData.shadow_player_b_id].filter(Boolean);
                    let shadowProfiles: any[] = [];
                    if (shadowIds.length > 0) {
                        const { data: s } = await supabase.from('shadow_profiles').select('id, name').in('id', shadowIds);
                        shadowProfiles = s || [];
                    }

                    a_name = mData.player_a_id 
                        ? (standardProfiles.find(x => x.id === mData.player_a_id)?.name || 'TBA')
                        : (shadowProfiles.find(x => x.id === mData.shadow_player_a_id)?.name || 'TBA');

                    b_name = mData.player_b_id 
                        ? (standardProfiles.find(x => x.id === mData.player_b_id)?.name || 'TBA')
                        : (shadowProfiles.find(x => x.id === mData.shadow_player_b_id)?.name || 'TBA');
                } else {
                    const { data: t } = await supabase.from('teams').select('id, name').in('id', [mData.team_a_id, mData.team_b_id].filter(Boolean));
                    a_name = t?.find(x => x.id === mData.team_a_id)?.name || 'TBA';
                    b_name = t?.find(x => x.id === mData.team_b_id)?.name || 'TBA';
                }
                
                setMetaData({
                    a_name,
                    b_name,
                    player_a_id: mData.player_a_id,
                    player_b_id: mData.player_b_id,
                    shadow_player_a_id: mData.shadow_player_a_id,
                    shadow_player_b_id: mData.shadow_player_b_id,
                    team_a_id: mData.team_a_id,
                    team_b_id: mData.team_b_id,
                    isInd
                });

                // Set initial dynamic states immediately
                setScoreData(mData.score_data || {});
                setTimerValue(mData.timer_value || 0);
                setRoundName(mData.round_name || 'Match');
                setMatchStatus(mData.status || 'scheduled');

                // Look up historical events once to establish Senshu owner if page loaded mid-match
                const { data: historicalEvents } = await supabase
                    .from('match_events')
                    .select('event_data')
                    .eq('match_id', matchId)
                    .order('created_at', { ascending: true });

                if (historicalEvents) {
                    for (const e of historicalEvents) {
                        let evData = e.event_data;
                        if (typeof evData === 'string') {
                            try { evData = JSON.parse(evData); } catch (err) {}
                        }
                        if (evData?.deltas?.score > 0 && evData?.team_id) {
                            setSenshuOwnerId(evData.team_id);
                            break; 
                        }
                    }
                }

                // Step 2: The Realtime WebSocket Listener (Scores & Timer Broadcasts)
                channel = supabase.channel(`match-control-${matchId}`)
                    .on('postgres_changes', { 
                        event: 'UPDATE', 
                        schema: 'public', 
                        table: 'matches', 
                        filter: `id=eq.${matchId}` 
                    }, (payload) => {
                        // DB updates for Score, Status, and Warnings
                        if (payload.new.score_data) {
                            const newScores = payload.new.score_data;
                            setScoreData(newScores);

                            // Dynamically evaluate Senshu on the fresh payload
                            setSenshuOwnerId((currentOwner) => {
                                if (currentOwner) return currentOwner; 

                                const scoreA = newScores[targetAId]?.score || 0;
                                const scoreB = newScores[targetBId]?.score || 0;

                                if (scoreA > 0 && scoreB === 0) return targetAId;
                                if (scoreB > 0 && scoreA === 0) return targetBId;
                                return null;
                            });
                        }
                        
                        if (payload.new.round_name) setRoundName(payload.new.round_name);
                    })
                    // NEW: Listen for the high-frequency in-memory timer broadcasts
                    .on('broadcast', { event: 'timer_sync' }, (payload) => {
                        setTimerValue(payload.payload.timeLeft);
                    })
                    .subscribe();
            }
            setLoading(false);
        };

        startPollingEngine();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [matchId]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin w-10 h-10" /></div>;
    if (!metaData) return <div className="h-screen flex items-center justify-center bg-black text-white">Match structure not found.</div>;

    // IDs based on mapping (supporting standard and proxy fields safely)
    const a_id = metaData.isInd ? (metaData.player_a_id || metaData.shadow_player_a_id) : metaData.team_a_id;
    const b_id = metaData.isInd ? (metaData.player_b_id || metaData.shadow_player_b_id) : metaData.team_b_id;

    // Derived Dynamic values from the polling loop
    const a_score = a_id ? (scoreData[a_id]?.score || 0) : 0;
    const b_score = b_id ? (scoreData[b_id]?.score || 0) : 0;
    const a_warn = a_id ? (scoreData[a_id]?.warnings || 0) : 0;
    const b_warn = b_id ? (scoreData[b_id]?.warnings || 0) : 0;

    // Corrected Karate Senshu WKF rules condition (revoked only if player hits 4 warnings)
    const hasSenshuA = a_id && senshuOwnerId === a_id && a_warn < 4;
    const hasSenshuB = b_id && senshuOwnerId === b_id && b_warn < 4;

    // Disqualification Rules Condition (5 Warnings triggers automatic DQ)
    const isDisqualifiedA = a_warn >= 5;
    const isDisqualifiedB = b_warn >= 5;
    // Winner Calculation Engine
    const isCompleted = matchStatus === 'completed';
    let winnerName = null;
    if (isCompleted) {
        // Evaluate Disqualifications first
        if (isDisqualifiedA && !isDisqualifiedB) winnerName = metaData.b_name;
        else if (isDisqualifiedB && !isDisqualifiedA) winnerName = metaData.a_name;
        // Evaluate points
        else if (a_score > b_score) winnerName = metaData.a_name;
        else if (b_score > a_score) winnerName = metaData.b_name;
        // Senshu tie-breaker (for Karate)
        else if (hasSenshuA) winnerName = metaData.a_name;
        else if (hasSenshuB) winnerName = metaData.b_name;
        else winnerName = 'Draw'; // Fallback
    }

    return (
        <div className="h-screen w-screen flex flex-col text-white font-sans overflow-hidden bg-black">
            {/* TOP BAR */}
            <div className="bg-black text-center py-3 text-lg font-bold tracking-widest uppercase flex items-center justify-between px-4 border-b border-white/5">
                <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => router.back()}>
                    <ChevronLeft className="w-5 h-5 mr-1" /> Back
                </Button>
                <span>{roundName} | Martial Grid</span>
                <div className="w-16"></div>
            </div>

            {/* SPLIT SCREEN SCOREBOARD */}
            <div className="flex flex-1 relative">
                
                {/* --- NEW: CINEMATIC WINNER OVERLAY --- */}
                {isCompleted && showOverlay && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-500">
                        <div className="bg-black/90 border border-primary/30 p-10 rounded-2xl shadow-[0_0_80px_rgba(var(--primary-rgb),0.3)] text-center flex flex-col items-center max-w-2xl w-full mx-4 transform scale-100 animate-in zoom-in-95 duration-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                            <h2 className="text-2xl text-muted-foreground font-bold uppercase tracking-widest mb-2">Match Finalized</h2>
                            
                            {winnerName === 'Draw' ? (
                                <div className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tight mt-4">It's a Draw</div>
                            ) : (
                                <>
                                    <div className="text-xl text-primary font-bold tracking-widest uppercase mt-2 mb-2">Official Winner</div>
                                    <div className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tight leading-tight">{winnerName}</div>
                                </>
                            )}
                            
                            <div className="flex gap-4 w-full mt-12">
                                <Button className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 h-14 text-lg font-bold" onClick={() => setShowOverlay(false)}>
                                    Exit
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* RED SIDE (AKA) */}
                <div className="flex-1 bg-red-700 flex flex-col items-center justify-center relative">
                    {/* Disqualified Visual Overlay layer */}
                    {isDisqualifiedA && (
                        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-30 p-6 animate-in fade-in duration-300">
                            <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                            <div className="text-red-500 font-black text-4xl sm:text-5xl tracking-widest uppercase bg-black border-4 border-red-500 px-6 py-3 rounded-md shadow-[0_0_40px_rgba(239,68,68,0.7)] rotate-[-8deg] text-center">
                                DISQUALIFIED
                            </div>
                        </div>
                    )}

                    <div className="text-4xl font-bold mb-4 tracking-widest opacity-80">Player 1</div>
                    <div className="text-[120px] font-black leading-none flex items-center gap-4">
                        {a_score}
                        {hasSenshuA && <span className="w-16 h-16 rounded-full bg-yellow-400 text-black flex items-center justify-center text-4xl font-black shadow-lg animate-in zoom-in duration-200">S</span>}
                    </div>
                    
                    {/* Warning Indicator Dots */}
                    <div className="flex gap-4 mt-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full transition-colors duration-200 ${i < a_warn ? 'bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'bg-black/30 border border-white/10'}`} />
                        ))}
                    </div>
                    
                    <div className="text-4xl font-bold mt-12 text-center px-4 truncate max-w-full">{metaData.a_name}</div>
                </div>

                {/* TIMER OVERLAY (CENTER) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black px-8 py-4 text-6xl font-black shadow-2xl z-20 rounded-md tracking-wider">
                    {`${Math.floor(timerValue / 60).toString().padStart(2, '0')}:${(timerValue % 60).toString().padStart(2, '0')}`}
                </div>

                {/* BLUE SIDE (AO) */}
                <div className="flex-1 bg-blue-700 flex flex-col items-center justify-center relative">
                    {/* Disqualified Visual Overlay layer */}
                    {isDisqualifiedB && (
                        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-30 p-6 animate-in fade-in duration-300">
                            <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                            <div className="text-red-500 font-black text-4xl sm:text-5xl tracking-widest uppercase bg-black border-4 border-red-500 px-6 py-3 rounded-md shadow-[0_0_40px_rgba(239,68,68,0.7)] rotate-[8deg] text-center">
                                DISQUALIFIED
                            </div>
                        </div>
                    )}

                    <div className="text-4xl font-bold mb-4 tracking-widest opacity-80">Player 2</div>
                    <div className="text-[120px] font-black leading-none flex items-center gap-4">
                        {b_score}
                        {hasSenshuB && <span className="w-16 h-16 rounded-full bg-yellow-400 text-black flex items-center justify-center text-4xl font-black shadow-lg animate-in zoom-in duration-200">S</span>}
                    </div>
                    
                    {/* Warning Indicator Dots */}
                    <div className="flex gap-4 mt-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full transition-colors duration-200 ${i < b_warn ? 'bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.6)]' : 'bg-black/30 border border-white/10'}`} />
                        ))}
                    </div>
                    
                    <div className="text-4xl font-bold mt-12 text-center px-4 truncate max-w-full">{metaData.b_name}</div>
                </div>

            </div>
        </div>
    );
}