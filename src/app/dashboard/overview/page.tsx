'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import GlassCard from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, BarChart2, Shield, Settings, Users, ArrowRight, Trophy, Search } from 'lucide-react';
import Link from 'next/link';

// Common Components
const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <GlassCard className="p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-muted-foreground">{title}</h3>
            {icon}
        </div>
        <p className="text-4xl font-bold mt-2">{value}</p>
    </GlassCard>
);

const TournamentCard = ({ tournament, teamCount, userRole }: { tournament: any, teamCount: number, userRole: string }) => {
    const getStatus = () => {
        const now = new Date();
        const start = new Date(tournament.start_date);
        const end = new Date(tournament.end_date);
        if (now > end) return { text: 'Completed', color: 'text-gray-400' };
        if (now >= start && now <= end) return { text: 'Live', color: 'text-green-400 animate-pulse' };
        return { text: 'Upcoming', color: 'text-yellow-400' };
    };

    const status = getStatus();
    const manageLink = userRole === 'organizer' ? `/organizer/manage-tournament/${tournament.id}` : `/tournament/${tournament.id}`;

    return (
        <GlassCard className="p-5 flex flex-col justify-between hover:border-primary/50 transition-all duration-300">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-xl mb-1">{tournament.name}</h4>
                    <span className={`font-bold text-sm ${status.color}`}>{status.text}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    <p>{tournament.sport} | {tournament.level}</p>
                    <p>{new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}</p>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-muted-foreground">Registrations</span>
                    <span>{teamCount} / {tournament.max_teams}</span>
                </div>
                <Progress value={(teamCount / tournament.max_teams) * 100} />
                <div className="mt-4 flex gap-2">
                    <Link href={manageLink} className="shrink-0">
        <Button size="icon" className="w-10 h-10">
            <Settings className="w-5 h-5" />
        </Button>
                    </Link>
                    <Link href={`/tournament/${tournament.id}/brackets`} className="flex-1">
                        <Button variant="outline" className="w-full">
                            View Brackets
                        </Button>
                    </Link>
                </div>
            </div>
        </GlassCard>
    );
};


const OverviewPage = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [relatedData, setRelatedData] = useState<any>({}); // For coach/player specific data
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Upcoming');
    const router = useRouter();

    const fetchOrganizerData = useCallback(async (userId: string) => {
        const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('organizer_id', userId);
        setTournaments(tournamentData || []);
        if (tournamentData && tournamentData.length > 0) {
            const tournamentIds = tournamentData.map(t => t.id);
            const { data: teamData } = await supabase.from('teams').select('id, tournament_id').in('tournament_id', tournamentIds);
            setTeams(teamData || []);
        }
    }, []);

    const fetchCoachData = useCallback(async (userId: string) => {
        const { data: coachTeams } = await supabase.from('teams').select('id, name, tournament_id').eq('coach_id', userId);
        setRelatedData({ myTeams: coachTeams || [] });

        if (coachTeams && coachTeams.length > 0) {
            const tournamentIds = [...new Set(coachTeams.map(t => t.tournament_id))];
            const { data: tournamentData } = await supabase.from('tournaments').select('*').in('id', tournamentIds);
            setTournaments(tournamentData || []);
        }
    }, []);

    const fetchPlayerData = useCallback(async (userId: string) => {
        const { data: teamRosters } = await supabase.from('team_rosters').select('team_id').eq('player_id', userId);
        if (!teamRosters) { setTournaments([]); return; }

        const teamIds = teamRosters.map(tr => tr.team_id);
        const { data: playerTeams } = await supabase.from('teams').select('id, name, tournament_id').in('id', teamIds);
        setRelatedData({ teamsJoined: playerTeams || [] });

        if (playerTeams && playerTeams.length > 0) {
            const tournamentIds = [...new Set(playerTeams.map(t => t.tournament_id))];
            const { data: tournamentData } = await supabase.from('tournaments').select('*').in('id', tournamentIds);
            setTournaments(tournamentData || []);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); router.push('/login'); return; }

            const { data: profileData } = await supabase.from('profiles').select('name, role').eq('id', user.id).single();
            
            setUser(user);
            setProfile(profileData);

            if (profileData?.role === 'organizer') {
                await fetchOrganizerData(user.id);
            } else if (profileData?.role === 'coach') {
                await fetchCoachData(user.id);
            } else if (profileData?.role === 'player') {
                await fetchPlayerData(user.id);
            }
            setLoading(false);
        };
        fetchData();
    }, [router, fetchOrganizerData, fetchCoachData, fetchPlayerData]);

    const filteredTournaments = tournaments.filter(t => {
        const now = new Date();
        const start = new Date(t.start_date);
        const end = new Date(t.end_date);
        if (activeTab === 'Live') return now >= start && now <= end;
        if (activeTab === 'Completed') return now > end;
        if (activeTab === 'Upcoming') return now < start;
        return true;
    });

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    const renderLoadingState = () => (
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <GlassCard key={i} className="h-32 animate-pulse"></GlassCard>)}
            </div>
            <div className="mt-8">
                <GlassCard className="h-96 animate-pulse"></GlassCard>
            </div>
        </div>
    );

    const renderEmptyState = () => (
        <div className="text-center p-20">
            <h3 className="text-2xl font-bold">No Tournaments Found</h3>
            <p className="text-muted-foreground mb-6">It looks like you're not involved in any tournaments yet.</p>
            {profile.role === 'organizer' && <Link href="/organizer/create-tournament"><Button>Create First Tournament <ArrowRight className="ml-2" /></Button></Link>}
             {profile.role === 'coach' && <Link href="/dashboard/teams/create"><Button>Register a New Team <ArrowRight className="ml-2" /></Button></Link>}
            {profile.role === 'player' && <Link href="/dashboard/tournaments"><Button>Find a Tournament <Search className="ml-2" /></Button></Link>}
        </div>
    );

    const renderOrganizerDashboard = () => (
        <>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">Welcome back, {profile?.name || 'Organizer'}!</h1>
                <Link href="/organizer/create-tournament">
                    <Button size="lg" className="mt-4 sm:mt-0 neon-glow-primary"><Plus className="mr-2" /> Create New Tournament</Button>
                </Link>
            </motion.div>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Tournaments" value={tournaments.length} icon={<BarChart2 className="text-primary" />} />
                <StatCard title="Active Events" value={tournaments.filter(t => new Date(t.end_date) >= new Date()).length} icon={<Shield className="text-green-400" />} />
                <StatCard title="Total Teams Registered" value={teams.length} icon={<Users className="text-yellow-400" />} />
            </motion.div>
        </>
    );

    const renderCoachDashboard = () => (
        <>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">Welcome back, Coach {profile?.name || ''}!</h1>
                <Link href="/dashboard/teams/create">
                     <Button size="lg" className="mt-4 sm:mt-0 neon-glow-primary"><Plus className="mr-2" /> Register New Team</Button>
                </Link>
            </motion.div>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="My Teams" value={relatedData.myTeams?.length || 0} icon={<Users className="text-primary" />} />
                <StatCard title="Tournaments Entered" value={tournaments.length} icon={<Trophy className="text-yellow-400" />} />
                {/* Placeholder for Upcoming Matches */}
                <StatCard title="Upcoming Matches" value="0" icon={<Shield className="text-green-400" />} />
            </motion.div>
        </>
    );

    const renderPlayerDashboard = () => (
        <>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">Welcome back, {profile?.name || 'Player'}!</h1>
                 <Link href="/dashboard/tournaments">
                    <Button size="lg" className="mt-4 sm:mt-0"><Search className="mr-2" /> Find Tournaments</Button>
                </Link>
            </motion.div>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Teams Joined" value={relatedData.teamsJoined?.length || 0} icon={<Users className="text-primary" />} />
                <StatCard title="Active Tournaments" value={tournaments.filter(t => new Date(t.end_date) >= new Date()).length} icon={<Trophy className="text-yellow-400" />} />
                {/* Placeholder for Upcoming Matches */}
                <StatCard title="Upcoming Matches" value="0" icon={<Shield className="text-green-400" />} />
            </motion.div>
        </>
    );
    
    const renderDashboardHeader = () => {
      switch (profile?.role) {
        case 'organizer': return renderOrganizerDashboard();
        case 'coach': return renderCoachDashboard();
        case 'player': return renderPlayerDashboard();
        default: return null;
      }
    }

    if (loading || !profile) {
        return renderLoadingState();
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 sm:p-8">
            {renderDashboardHeader()}
            <motion.div variants={itemVariants}>
                <GlassCard>
                    <div className="p-4 border-b border-white/10 flex gap-2">
                        {['Upcoming', 'Live', 'Completed'].map(tab => (
                            <Button key={tab} variant={activeTab === tab ? 'default' : 'ghost'} onClick={() => setActiveTab(tab)}>{tab}</Button>
                        ))}
                    </div>
                    {tournaments.length === 0 ? renderEmptyState() : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {filteredTournaments.map(t => (
                                <TournamentCard key={t.id} tournament={t} teamCount={teams.filter(team => team.tournament_id === t.id).length} userRole={profile.role} />
                            ))}
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};

export default OverviewPage;
