'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Bell, Check, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NotificationItem = ({ notification, onUpdate, onClose }: { notification: any, onUpdate: () => void, onClose: () => void }) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // --- PLAYER ACCEPTING A TEAM INVITE ---
  const handleTeamAccept = async () => {
    setIsProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !notification.metadata?.team_invitation_id || !notification.metadata?.coach_id) {
        setIsProcessing(false);
        return;
    }

    await supabase.from('team_invitations').update({ status: 'accepted' }).eq('id', notification.metadata.team_invitation_id);
    await supabase.from('players').update({ coach_id: notification.metadata.coach_id }).eq('id', user.id);
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    
    setIsProcessing(false);
    onUpdate();
    onClose();

    // Redirect to tournament public page if the invite is tied to a specific tournament
    if (notification.metadata?.tournament_id) {
        router.push(`/tournament/${notification.metadata.tournament_id}`);
    } else {
        router.push('/dashboard/overview');
    }
  };

  const handleTeamDecline = async () => {
    setIsProcessing(true);
    await supabase.from('team_invitations').update({ status: 'rejected' }).eq('id', notification.metadata?.team_invitation_id);
    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    setIsProcessing(false);
    onUpdate();
  };

  // --- COACH ACCEPTING A TOURNAMENT INVITE ---
  const handleTournamentAccept = async () => {
    setIsProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !notification.metadata?.tournament_invite_id) {
        setIsProcessing(false);
        return;
    }

    // 1. Fetch coach's base team
    const { data: coachData } = await supabase.from('coaches').select('team_name, team_logo').eq('id', user.id).single();
    const { data: inviteData } = await supabase.from('tournament_invitations').select('tournament_id, organizer_id').eq('id', notification.metadata.tournament_invite_id).single();

    if (coachData && inviteData) {
        // 2. Create the team for the tournament
        await supabase.from('teams').insert({
            tournament_id: inviteData.tournament_id,
            coach_id: user.id,
            name: coachData.team_name || 'Unnamed Team',
            logo_url: coachData.team_logo,
            status: 'approved'
        });

        // 3. Update invite & Notify Organizer
        await supabase.from('tournament_invitations').update({ status: 'accepted' }).eq('id', notification.metadata.tournament_invite_id);
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
        
        await supabase.from('notifications').insert({
            user_id: inviteData.organizer_id,
            type: 'system',
            message: `${profile?.name} accepted your invite to ${notification.metadata.tournament_name || 'the tournament'}!`
        });
    }

    await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
    setIsProcessing(false);
    onUpdate();
    onClose();

    // Immediately route the coach to the tournament's public page to manage their roster
    if (inviteData?.tournament_id) {
        router.push(`/tournament/${inviteData.tournament_id}`);
    } else if (notification.metadata?.tournament_id) {
        router.push(`/tournament/${notification.metadata.tournament_id}`);
    }
  };

  const handleTournamentDecline = async () => {
     setIsProcessing(true);
     await supabase.from('tournament_invitations').update({ status: 'rejected' }).eq('id', notification.metadata?.tournament_invite_id);
     
     // Notify Organizer
     const { data: profile } = await supabase.from('profiles').select('name').eq('id', notification.user_id).single();
     await supabase.from('notifications').insert({
         user_id: notification.metadata.organizer_id,
         type: 'system',
         message: `${profile?.name} declined your invite to ${notification.metadata.tournament_name || 'the tournament'}.`
     });

     await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
     setIsProcessing(false);
     onUpdate();
  };

  return (
    <div className="p-4 border-b border-white/10 hover:bg-white/5 transition-colors">
      <p className="text-sm text-foreground mb-3">{notification.message}</p>
      
      {/* Player Team Invite Controls */}
      {notification.type === 'team_invite' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleTeamAccept} disabled={isProcessing} className="bg-primary text-primary-foreground">
            {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Check className="w-3 h-3 mr-1"/>} Accept
          </Button>
          <Button size="sm" variant="outline" onClick={handleTeamDecline} disabled={isProcessing} className="border-red-500/50 text-red-400 hover:bg-red-500/10">
            <X className="w-3 h-3 mr-1"/> Decline
          </Button>
        </div>
      )}

      {/* Coach Tournament Invite Controls */}
      {notification.type === 'tournament_invite' && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleTournamentAccept} disabled={isProcessing} className="bg-primary text-primary-foreground">
             {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1"/> : <Check className="w-3 h-3 mr-1"/>} Join Tournament
          </Button>
          <Button size="sm" variant="outline" onClick={handleTournamentDecline} disabled={isProcessing} className="border-red-500/50 text-red-400 hover:bg-red-500/10">
            <X className="w-3 h-3 mr-1"/> Decline
          </Button>
        </div>
      )}

      {/* Standard System Notification (Just dismissible) */}
      {notification.type === 'system' && (
          <Button size="sm" variant="ghost" onClick={() => {
              supabase.from('notifications').update({ is_read: true }).eq('id', notification.id).then(() => onUpdate());
          }}>Dismiss</Button>
      )}
    </div>
  )
}

export const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (!error) {
          setNotifications(data || []);
          setUnreadCount(count || 0);
      }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Create a uniquely named channel for this specific component mount cycle
    const channelName = `notifications-${Math.random().toString(36).substring(7)}`;

    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetchNotifications)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-full hover:bg-white/10 transition-colors">
        <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white shadow-lg">{unreadCount}</div>
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 z-50"
          >
            <div className="rounded-xl shadow-2xl border border-white/10 bg-background/95 backdrop-blur-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-white/5">
                    <h3 className="font-bold text-foreground">Notifications</h3>
                </div>
                {notifications.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.map(n => <NotificationItem key={n.id} notification={n} onUpdate={fetchNotifications} onClose={() => setIsOpen(false)} />)}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">You're all caught up.</p>
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}