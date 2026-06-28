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
        team_a_id?: string;
        team_b_id?: string;
        isInd: boolean;
    } | null>(null);

    // Dynamic states (Polled every 1 second)
    const [scoreData, setScoreData] = useState<Record<string, any>>({});
    const [timerValue, setTimerValue] = useState<number>(0);
    const [roundName, setRoundName] = useState<string>('Match');
    
    // Senshu tracking state
    const [senshuOwnerId, setSenshuOwnerId] = useState<string | null>(null);
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!matchId) return;

        let intervalId: NodeJS.Timeout;

        const startPollingEngine = async () => {
            setLoading(true);
            
            // Step 1: Fetch the core structure & names exactly once
            const { data: mData } = await supabase.from('matches').select('*').eq('id', matchId).single();
            
            if (mData) {
                const isInd = !!mData.player_a_id;
                let a_name = 'TBA', b_name = 'TBA';
                
                const targetAId = isInd ? mData.player_a_id : mData.team_a_id;
                const targetBId = isInd ? mData.player_b_id : mData.team_b_id;
                
                if (isInd) {
                    const { data: p } = await supabase.from('profiles').select('id, name').in('id', [mData.player_a_id, mData.player_b_id].filter(Boolean));
                    a_name = p?.find(x => x.id === mData.player_a_id)?.name || 'TBA';
                    b_name = p?.find(x => x.id === mData.player_b_id)?.name || 'TBA';
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
                    team_a_id: mData.team_a_id,
                    team_b_id: mData.team_b_id,
                    isInd
                });

                // Set initial dynamic states immediately
                setScoreData(mData.score_data || {});
                setTimerValue(mData.timer_value || 0);
                setRoundName(mData.round_name || 'Match');

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

                // Step 2: The Independent 1-Second Loop
                intervalId = setInterval(async () => {
                    const { data: update, error } = await supabase
                        .from('matches')
                        .select('score_data')
                        .eq('id', matchId)
                        .single();

                    if (!error && update) {
                        const newScores = update.score_data || {};
                        setScoreData(newScores);

                        // If Senshu isn't claimed yet, analyze the live score state to award it natively
                        setSenshuOwnerId((currentOwner) => {
                            if (currentOwner) return currentOwner; 

                            const scoreA = newScores[targetAId]?.score || 0;
                            const scoreB = newScores[targetBId]?.score || 0;

                            if (scoreA > 0 && scoreB === 0) return targetAId;
                            if (scoreB > 0 && scoreA === 0) return targetBId;
                            return null;
                        });
                    }
                }, 1000);
            }
            setLoading(false);
        };

        startPollingEngine();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [matchId]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin w-10 h-10" /></div>;
    if (!metaData) return <div className="h-screen flex items-center justify-center bg-black text-white">Match structure not found.</div>;

    // IDs based on mapping
    const a_id = metaData.isInd ? metaData.player_a_id : metaData.team_a_id;
    const b_id = metaData.isInd ? metaData.player_b_id : metaData.team_b_id;

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