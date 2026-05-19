
export const MOCK_TOURNAMENTS = [
  {
    id: 't1',
    name: 'Cyber Strike Masters',
    slug: 'cyber-strike-masters',
    sport: 'Basketball',
    status: 'Live',
    participants: 16,
    date: 'Oct 15 - Oct 20',
    image: 'https://picsum.photos/seed/t1/800/400'
  },
  {
    id: 't2',
    name: 'Neon Velocity Invitational',
    slug: 'neon-velocity',
    sport: 'Soccer',
    status: 'Upcoming',
    participants: 32,
    date: 'Nov 2 - Nov 10',
    image: 'https://picsum.photos/seed/t2/800/400'
  },
  {
    id: 't3',
    name: 'Deep Abyss Cup',
    slug: 'deep-abyss-cup',
    sport: 'Volleyball',
    status: 'Upcoming',
    participants: 8,
    date: 'Dec 5 - Dec 6',
    image: 'https://picsum.photos/seed/t3/800/400'
  }
];

export const MOCK_MATCHES = [
  {
    id: 'm1',
    tournament: 'Cyber Strike Masters',
    teamA: 'Nebula Knights',
    teamB: 'Solar Flares',
    scoreA: 88,
    scoreB: 84,
    status: 'Live',
    time: 'Q4 - 02:15'
  },
  {
    id: 'm2',
    tournament: 'Cyber Strike Masters',
    teamA: 'Void Runners',
    teamB: 'Glitch Squad',
    scoreA: 72,
    scoreB: 91,
    status: 'Finished',
    time: 'Final'
  },
  {
    id: 'm3',
    tournament: 'Cyber Strike Masters',
    teamA: 'Titan Pulse',
    teamB: 'Quantum Force',
    scoreA: 0,
    scoreB: 0,
    status: 'Upcoming',
    time: 'Today 18:00'
  }
];

export const MOCK_TEAMS = [
  {
    id: 'team1',
    name: 'Nebula Knights',
    players: 12,
    wins: 15,
    losses: 3,
    logo: 'https://picsum.photos/seed/team1/100/100'
  },
  {
    id: 'team2',
    name: 'Solar Flares',
    players: 10,
    wins: 11,
    losses: 7,
    logo: 'https://picsum.photos/seed/team2/100/100'
  }
];

export const MOCK_PARTICIPANTS_FOR_SEEDING = [
  { name: 'Aegis Vanguard', type: 'team' as const, historicalPerformance: 'Won last 3 regional tournaments, average win margin 15 points.' },
  { name: 'Shadow Strikers', type: 'team' as const, historicalPerformance: 'Consistent top 4 finisher, high defensive rating, 70% win rate.' },
  { name: 'Prism Rebels', type: 'team' as const, historicalPerformance: 'New team, dominant in amateur leagues, aggressive offense.' },
  { name: 'Iron Pulse', type: 'team' as const, historicalPerformance: 'Veteran squad, declining speed but high tactical precision, 55% win rate.' },
  { name: 'Velocity X', type: 'team' as const, historicalPerformance: 'Wildcard entry, variable performance, high ceiling.' },
  { name: 'Cyber Hawks', type: 'team' as const, historicalPerformance: 'Strong individual stats, poor team cohesion historically.' },
  { name: 'Ghost Unit', type: 'team' as const, historicalPerformance: 'Defending champions of the 2023 Abyss Cup.' },
  { name: 'Neon Legion', type: 'team' as const, historicalPerformance: 'Solid mid-tier team, 50% win rate against top seeds.' }
];
