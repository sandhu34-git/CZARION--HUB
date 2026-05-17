import { Layout } from "@/components/layout";
import { useAuth, useUser } from "@clerk/react";
import {
  useGetPlayer, useListRegistrations, useEnsurePlayer,
  useGetCoinBalance, useGetCoinHistory, useEarnCoins, useListAppeals, useCreateAppeal,
  getGetPlayerQueryKey, getListRegistrationsQueryKey, getGetCoinBalanceQueryKey, getGetCoinHistoryQueryKey, getListAppealsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Trophy, Crosshair, Medal, Target, ShieldAlert, User, ExternalLink, ShieldCheck,
  AlertTriangle, Ban, Coins, Zap, Crown, Flame, Star, Swords, Bell, Download, Gift
} from "lucide-react";
import { format, parseISO, isPast, formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function getScrimRank(points: number) {
  if (points >= 10000) return { label: "Predator", color: "text-red-400", bg: "bg-red-500/10 border-red-500/40", icon: "☠️" };
  if (points >= 6000) return { label: "Elite", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/40", icon: "💎" };
  if (points >= 3000) return { label: "Gold", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/40", icon: "🥇" };
  if (points >= 1000) return { label: "Silver", color: "text-slate-300", bg: "bg-slate-500/10 border-slate-500/40", icon: "🥈" };
  return { label: "Bronze", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/40", icon: "🥉" };
}

function getReputationTier(score: number) {
  if (score >= 90) return { label: "Legend", color: "text-green-400", barColor: "bg-green-500" };
  if (score >= 70) return { label: "Reliable", color: "text-blue-400", barColor: "bg-blue-500" };
  if (score >= 50) return { label: "Neutral", color: "text-yellow-400", barColor: "bg-yellow-500" };
  if (score >= 30) return { label: "Risky", color: "text-orange-400", barColor: "bg-orange-500" };
  return { label: "Toxic", color: "text-red-400", barColor: "bg-red-500" };
}

const ACHIEVEMENTS = [
  { key: "achievementMvpKing", label: "MVP King", icon: Crown, color: "text-yellow-400" },
  { key: "achievementTopFragger", label: "Top Fragger", icon: Crosshair, color: "text-red-400" },
  { key: "achievementChampion", label: "Champion", icon: Trophy, color: "text-primary" },
  { key: "achievement100Wins", label: "100 Wins", icon: Flame, color: "text-orange-400" },
  { key: "fairPlayBadge", label: "Fair Play", icon: ShieldCheck, color: "text-green-400" },
] as const;

export default function Dashboard() {
  const { userId } = useAuth();
  const { user } = useUser();
  const ensurePlayer = useEnsurePlayer();
  const ensuredRef = useRef(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [appealReason, setAppealReason] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const { data: player, isLoading: playerLoading } = useGetPlayer(userId || "", {
    query: { enabled: !!userId, queryKey: getGetPlayerQueryKey(userId || "") }
  });
  const { data: registrations, isLoading: regLoading } = useListRegistrations(
    { userId: userId || "" },
    { query: { enabled: !!userId, queryKey: getListRegistrationsQueryKey({ userId: userId || "" }) } }
  );
  const { data: coinData, isLoading: coinLoading } = useGetCoinBalance(userId || "", {
    query: { enabled: !!userId, queryKey: getGetCoinBalanceQueryKey(userId || "") }
  });
  const { data: coinHistory, isLoading: historyLoading } = useGetCoinHistory(userId || "", {
    query: { enabled: !!userId, queryKey: getGetCoinHistoryQueryKey(userId || "") }
  });
  const { data: appeals } = useListAppeals({ clerkId: userId || "" }, {
    query: { enabled: !!userId, queryKey: getListAppealsQueryKey({ clerkId: userId || "" }) }
  });

  const earnCoins = useEarnCoins();
  const createAppeal = useCreateAppeal();

  useEffect(() => {
    if (user && userId && !ensuredRef.current) {
      ensuredRef.current = true;
      ensurePlayer.mutate({
        clerkId: userId,
        data: {
          username: user.username || `user_${userId.substring(0, 6)}`,
          displayName: user.fullName || undefined,
          avatarUrl: user.imageUrl || undefined,
        }
      });
    }
  }, [user, userId]);

  const handleDailyBonus = async () => {
    if (!userId) return;
    try {
      await earnCoins.mutateAsync({
        data: { clerkId: userId, amount: 5, source: "daily_login", description: "Daily login bonus" }
      });
      await queryClient.invalidateQueries({ queryKey: getGetCoinBalanceQueryKey(userId) });
      await queryClient.invalidateQueries({ queryKey: getGetCoinHistoryQueryKey(userId) });
      toast({ title: "+5 CZ Coins!", description: "Daily login bonus claimed!" });
    } catch {
      toast({ title: "Already claimed", description: "Daily bonus already collected today.", variant: "destructive" });
    }
  };

  const handleAppealSubmit = async () => {
    if (!userId || !user || !appealReason.trim()) return;
    setSubmittingAppeal(true);
    try {
      await createAppeal.mutateAsync({
        data: { clerkId: userId, playerName: user.username || userId, reason: appealReason }
      });
      await queryClient.invalidateQueries({ queryKey: getListAppealsQueryKey({ clerkId: userId }) });
      setAppealReason("");
      toast({ title: "Appeal Submitted", description: "Your appeal is under review." });
    } catch {
      toast({ title: "Failed", description: "Could not submit appeal.", variant: "destructive" });
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const handleExportCSV = () => {
    if (!registrations) return;
    const headers = ["Tournament ID", "Team Name", "Status", "Registered At"];
    const rows = registrations.map(r => [r.tournamentId, r.teamName, r.status, r.createdAt]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "czarion-my-registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeRegs = registrations?.filter(r => r.status !== 'rejected') || [];
  const pendingRegs = registrations?.filter(r => r.status === 'pending') || [];
  const approvedRegs = registrations?.filter(r => r.status === 'approved') || [];

  const isBanned = player?.isBanned ?? false;
  const warningCount = player?.warningCount ?? 0;
  const hasFairPlay = !playerLoading && !isBanned && warningCount === 0;
  const repScore = player?.reputationScore ?? 70;
  const rank = getScrimRank(player?.scrimPoints ?? 0);
  const repTier = getReputationTier(repScore);

  // Match reminder: approved registrations for tournaments starting within 24h
  const upcomingReminders = approvedRegs.filter(r => {
    // We don't have matchDate on registration, but show count as reminder
    return r.status === "approved";
  });

  const unlockedAchievements = ACHIEVEMENTS.filter(a => player?.[a.key as keyof typeof player]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* Sponsor Banner */}
        <div className="mb-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 py-2 px-4 flex items-center justify-center gap-4 overflow-hidden">
          <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-display shrink-0">Powered By</span>
          <span className="font-display font-black text-primary uppercase tracking-widest text-sm">CZARION PLAYZ</span>
          <span className="text-muted-foreground">|</span>
          <a href="https://youtube.com/@czarion_playz" target="_blank" rel="noopener noreferrer" className="text-[10px] text-muted-foreground hover:text-primary uppercase tracking-widest font-display transition-colors">Subscribe on YouTube →</a>
        </div>

        {/* Match Reminder Banner */}
        {approvedRegs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-yellow-500/10 border border-yellow-500/30 px-5 py-3 flex items-center gap-3"
          >
            <Bell className="w-5 h-5 text-yellow-400 animate-pulse shrink-0" />
            <div className="flex-1">
              <p className="font-display font-bold text-yellow-400 uppercase tracking-wider text-sm">
                {approvedRegs.length} Active Tournament{approvedRegs.length > 1 ? "s" : ""} — Check your match schedule!
              </p>
              <p className="text-xs text-muted-foreground">You have approved registrations. Make sure you check in before match start.</p>
            </div>
            <Link href="/tournaments">
              <Button size="sm" variant="outline" className="font-display uppercase tracking-wider rounded-none text-xs border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10">
                View Matches
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-card border border-border overflow-hidden mb-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left_top,rgba(255,0,60,0.08),transparent_60%)] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 md:p-8 relative z-10">
            <div className="relative shrink-0">
              <div className={`w-20 h-20 bg-secondary border-2 overflow-hidden flex items-center justify-center ${isBanned ? 'border-destructive/60' : hasFairPlay ? 'border-green-500/60' : warningCount > 0 ? 'border-orange-500/60' : 'border-primary/60'}`}>
                {user?.imageUrl ? (
                  <img src={user.imageUrl} alt="Profile" className={`w-full h-full object-cover ${isBanned ? 'grayscale' : ''}`} />
                ) : (
                  <User className="w-10 h-10 text-primary/50" />
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${isBanned ? 'bg-destructive' : 'bg-green-500'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display font-black text-2xl md:text-3xl uppercase tracking-widest">
                  {playerLoading ? <Skeleton className="h-8 w-40 inline-block" /> : (player?.displayName || user?.username || "Unknown Player")}
                </h1>
                {player?.isMvp && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/50 font-display uppercase tracking-wider rounded-none">
                    <Medal className="w-3 h-3 mr-1" /> MVP
                  </Badge>
                )}
                {!playerLoading && (
                  <Badge variant="outline" className={`${rank.bg} ${rank.color} font-display uppercase tracking-wider rounded-none text-xs`}>
                    {rank.icon} {rank.label}
                  </Badge>
                )}
                {!playerLoading && hasFairPlay && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/50 font-display uppercase tracking-wider rounded-none">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Fair Play
                  </Badge>
                )}
                {!playerLoading && isBanned && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/50 font-display uppercase tracking-wider rounded-none">
                    <Ban className="w-3 h-3 mr-1" /> Banned
                  </Badge>
                )}
                {!playerLoading && warningCount > 0 && !isBanned && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/40 font-display uppercase tracking-wider rounded-none">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {warningCount} Warning{warningCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono tracking-widest rounded-none text-xs">
                  UID: {playerLoading ? "..." : (player?.gameUid || "Not Set")}
                </Badge>
                <Badge variant="outline" className="bg-secondary text-muted-foreground border-border uppercase font-display tracking-widest rounded-none text-xs">
                  Lvl {playerLoading ? "..." : (player?.level || 1)}
                </Badge>
                {!coinLoading && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 font-display uppercase tracking-widest rounded-none text-xs">
                    <Coins className="w-3 h-3 mr-1" /> {(coinData?.balance ?? player?.czCoins ?? 0).toLocaleString()} CZ
                  </Badge>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <Button onClick={handleDailyBonus} variant="outline" size="sm" className="font-display uppercase tracking-wider rounded-none border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 gap-1">
                <Coins className="w-3 h-3" /> Daily Bonus
              </Button>
              <Link href="/tournaments">
                <Button className="font-display uppercase tracking-wider rounded-none animate-pulse-neon w-full">
                  Find Match
                </Button>
              </Link>
            </div>
          </div>

          {/* Integrity Status Bar */}
          {!playerLoading && (
            <div className={`px-6 md:px-8 py-3 border-t border-border/30 flex items-center gap-3 text-xs font-mono ${isBanned ? 'bg-destructive/5' : hasFairPlay ? 'bg-green-500/5' : 'bg-orange-500/5'}`}>
              {isBanned ? (
                <>
                  <Ban className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-destructive font-bold uppercase tracking-wider font-display">Account Banned</span>
                  <span className="text-muted-foreground">— Contact support or submit an appeal below.</span>
                </>
              ) : hasFairPlay ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-green-500 font-bold uppercase tracking-wider font-display">Fair Play Certificate</span>
                  <span className="text-muted-foreground">— No violations or warnings. Keep it clean!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                  <span className="text-orange-400 font-bold uppercase tracking-wider font-display">{warningCount} Active Warning{warningCount > 1 ? "s" : ""}</span>
                  <span className="text-muted-foreground">— Further violations may result in a tournament ban.</span>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Total Kills" value={player?.totalKills ?? 0} icon={Crosshair} isLoading={playerLoading} accent />
          <StatCard title="Wins" value={player?.totalWins ?? 0} icon={Trophy} isLoading={playerLoading} />
          <StatCard title="Matches" value={player?.totalMatches ?? 0} icon={Target} isLoading={playerLoading} />
          <StatCard title="Scrim Points" value={player?.scrimPoints ?? 0} icon={Swords} isLoading={playerLoading} />
        </div>

        {/* Reputation + Rank row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold uppercase tracking-wider text-sm">Reputation Score</h3>
              <span className={`ml-auto font-display font-bold text-sm ${repTier.color}`}>{repTier.label}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`font-display font-black text-3xl ${repTier.color}`}>{repScore}</span>
              <span className="text-muted-foreground text-sm">/100</span>
            </div>
            <Progress value={repScore} className="h-2 rounded-none" />
          </div>
          <div className="bg-card border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold uppercase tracking-wider text-sm">Scrim Rank</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{rank.icon}</span>
              <div>
                <p className={`font-display font-black text-2xl ${rank.color}`}>{rank.label}</p>
                <p className="text-xs text-muted-foreground">{player?.scrimPoints ?? 0} SP</p>
              </div>
              <Link href="/shop" className="ml-auto">
                <Button size="sm" variant="outline" className="font-display uppercase tracking-wider rounded-none text-xs border-primary/30 text-primary hover:bg-primary/10">
                  <Gift className="w-3 h-3 mr-1" /> Shop
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        {!playerLoading && (
          <div className="bg-card border border-border p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold uppercase tracking-wider text-sm">Achievement Badges</h3>
              <Badge variant="outline" className="ml-auto bg-primary/10 text-primary border-primary/30 font-display uppercase text-xs rounded-none">
                {unlockedAchievements.length} / {ACHIEVEMENTS.length}
              </Badge>
            </div>
            <div className="flex gap-3 flex-wrap">
              {ACHIEVEMENTS.map(({ key, label, icon: Icon, color }) => {
                const unlocked = player?.[key as keyof typeof player] as boolean;
                return (
                  <div
                    key={key}
                    title={label}
                    className={`flex items-center gap-2 px-3 py-2 border text-xs font-display uppercase tracking-wider transition-all ${unlocked ? `${color} border-current/30 bg-current/5` : 'text-muted-foreground/40 border-border/30 bg-secondary/20 grayscale'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {unlocked && <span className="text-[9px] opacity-60">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Bars */}
        {!regLoading && registrations && registrations.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-card border border-border p-4 text-center">
              <p className="font-display font-black text-2xl text-yellow-500">{pendingRegs.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Pending</p>
            </div>
            <div className="bg-card border border-border p-4 text-center">
              <p className="font-display font-black text-2xl text-green-500">{approvedRegs.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Approved</p>
            </div>
            <div className="bg-card border border-border p-4 text-center">
              <p className="font-display font-black text-2xl text-foreground">{registrations.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Total</p>
            </div>
          </div>
        )}

        {/* Content Tabs */}
        <Tabs defaultValue="registrations" className="w-full">
          <TabsList className="bg-card border border-border rounded-none mb-6 w-full flex-wrap h-auto">
            <TabsTrigger value="registrations" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
              Deployments ({activeRegs.length})
            </TabsTrigger>
            <TabsTrigger value="coins" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
              <Coins className="w-3 h-3 mr-1 text-yellow-400" /> Coins
            </TabsTrigger>
            <TabsTrigger value="achievements" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
              Badges
            </TabsTrigger>
            {(isBanned || warningCount > 0) && (
              <TabsTrigger value="appeal" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
                Appeal
              </TabsTrigger>
            )}
          </TabsList>

          {/* Deployments Tab */}
          <TabsContent value="registrations">
            <div className="flex items-center justify-between mb-4">
              <div />
              {registrations && registrations.length > 0 && (
                <Button variant="outline" size="sm" className="font-display uppercase tracking-wider rounded-none text-xs gap-1" onClick={handleExportCSV}>
                  <Download className="w-3 h-3" /> Export CSV
                </Button>
              )}
            </div>
            {regLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-none" />)}
              </div>
            ) : activeRegs.length > 0 ? (
              <div className="space-y-3">
                {activeRegs.map((reg, idx) => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="bg-card border-border rounded-none overflow-hidden group hover:border-primary/40 transition-colors">
                      <div className={`flex flex-col sm:flex-row items-stretch border-l-4 ${reg.status === 'approved' ? 'border-l-green-500' : reg.status === 'rejected' ? 'border-l-destructive' : 'border-l-yellow-500'}`}>
                        <div className="p-5 flex-1">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground font-display uppercase tracking-widest mb-0.5">
                                Squad: <span className="text-foreground">{reg.teamName}</span>
                              </p>
                              <h3 className="font-display font-bold text-lg uppercase tracking-wider group-hover:text-primary transition-colors">
                                Tournament #{reg.tournamentId}
                              </h3>
                            </div>
                            <Badge
                              variant="outline"
                              className={`uppercase font-display tracking-widest rounded-none text-xs shrink-0 ${reg.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/50' : reg.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/50' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50'}`}
                            >
                              {reg.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            Registered: {format(parseISO(reg.createdAt), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <div className="sm:border-l border-t sm:border-t-0 border-border bg-secondary/30 px-5 py-4 flex items-center justify-center">
                          <Link href={`/tournaments/${reg.tournamentId}`}>
                            <Button variant="ghost" size="sm" className="font-display uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/10 rounded-none gap-1">
                              View <ExternalLink className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-border/50 bg-card/30">
                <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-2">No Active Deployments</h3>
                <p className="text-muted-foreground text-sm mb-6">Your squad hasn't registered for any battles yet.</p>
                <Link href="/tournaments">
                  <Button className="font-display uppercase tracking-wider rounded-none animate-pulse-neon">Find a Match</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Coins Tab */}
          <TabsContent value="coins">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-yellow-500/30 p-5 text-center col-span-1">
                <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="font-display font-black text-4xl text-yellow-400">{coinLoading ? "..." : (coinData?.balance ?? 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Current Balance</p>
              </div>
              <div className="bg-card border border-border p-5 text-center">
                <p className="font-display font-black text-2xl text-green-400">{coinLoading ? "..." : (coinData?.totalEarned ?? 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Total Earned</p>
              </div>
              <div className="bg-card border border-border p-5 text-center">
                <p className="font-display font-black text-2xl text-red-400">{coinLoading ? "..." : (coinData?.totalSpent ?? 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Total Spent</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold uppercase tracking-wider text-sm">Transaction History</h3>
              <Link href="/shop">
                <Button size="sm" className="font-display uppercase tracking-wider rounded-none text-xs animate-pulse-neon gap-1">
                  <Gift className="w-3 h-3" /> Visit Shop
                </Button>
              </Link>
            </div>

            {historyLoading ? (
              <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full rounded-none" />)}</div>
            ) : coinHistory && coinHistory.length > 0 ? (
              <div className="bg-card border border-border divide-y divide-border/30">
                {coinHistory.map(txn => (
                  <div key={txn.id} className="flex items-center gap-4 px-5 py-3">
                    <div className={`w-8 h-8 flex items-center justify-center shrink-0 ${txn.type === "earn" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      <Coins className={`w-4 h-4 ${txn.type === "earn" ? "text-green-400" : "text-red-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-sm truncate">{txn.description}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{format(parseISO(txn.createdAt), 'MMM d, yyyy • h:mm a')}</p>
                    </div>
                    <div className={`font-display font-black text-lg shrink-0 ${txn.type === "earn" ? "text-green-400" : "text-red-400"}`}>
                      {txn.type === "earn" ? "+" : "-"}{txn.amount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-border/50 bg-card/30">
                <Coins className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                <p className="font-display text-sm uppercase tracking-wider text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Earn coins by winning tournaments, claiming daily bonuses, and more.</p>
              </div>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ACHIEVEMENTS.map(({ key, label, icon: Icon, color }) => {
                const unlocked = player?.[key as keyof typeof player] as boolean;
                return (
                  <div
                    key={key}
                    className={`bg-card border p-6 flex items-center gap-4 transition-all ${unlocked ? `border-current/20 bg-gradient-to-r from-current/5` : 'border-border/30 opacity-50'}`}
                    style={unlocked ? { borderColor: undefined } : undefined}
                  >
                    <div className={`w-14 h-14 flex items-center justify-center shrink-0 ${unlocked ? 'bg-current/10 border border-current/20' : 'bg-secondary/20 border border-border/20'}`}>
                      <Icon className={`w-7 h-7 ${unlocked ? color : 'text-muted-foreground/40'}`} />
                    </div>
                    <div>
                      <p className={`font-display font-bold uppercase tracking-wider text-sm ${unlocked ? color : 'text-muted-foreground/50'}`}>{label}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{unlocked ? "UNLOCKED" : "LOCKED"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Appeal Tab */}
          {(isBanned || warningCount > 0) && (
            <TabsContent value="appeal">
              <div className="bg-card border border-border p-6 max-w-2xl">
                <h3 className="font-display font-bold uppercase tracking-widest text-xl mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Submit an Appeal
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  If you believe your warning or ban was issued unfairly, submit an appeal here. Our team will review it within 48 hours.
                </p>

                {/* Existing appeals */}
                {appeals && appeals.length > 0 && (
                  <div className="mb-6 space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Your Appeals</p>
                    {appeals.map(appeal => (
                      <div key={appeal.id} className="bg-secondary/20 border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className={`font-display uppercase tracking-wider rounded-none text-xs ${appeal.status === "approved" ? "text-green-400 border-green-500/40" : appeal.status === "rejected" ? "text-red-400 border-red-500/40" : "text-yellow-400 border-yellow-500/40"}`}>
                            {appeal.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{format(parseISO(appeal.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        <p className="text-sm text-foreground">{appeal.reason}</p>
                        {appeal.adminResponse && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="text-[10px] text-primary uppercase tracking-wider mb-1">Admin Response:</p>
                            <p className="text-sm text-muted-foreground">{appeal.adminResponse}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-widest font-display block mb-2">Your Appeal</label>
                    <Textarea
                      placeholder="Explain why you believe this action was unfair. Provide any relevant context or evidence..."
                      value={appealReason}
                      onChange={e => setAppealReason(e.target.value)}
                      className="bg-background border-border rounded-none min-h-[120px] font-mono text-sm"
                    />
                  </div>
                  <Button
                    className="font-display uppercase tracking-wider rounded-none animate-pulse-neon"
                    onClick={handleAppealSubmit}
                    disabled={submittingAppeal || !appealReason.trim()}
                  >
                    {submittingAppeal ? "Submitting..." : "Submit Appeal"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, isLoading, accent }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  isLoading: boolean;
  accent?: boolean;
}) {
  return (
    <Card className={`border-border rounded-none group hover:border-primary/50 transition-colors ${accent ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
      <CardContent className="p-5 flex flex-col items-center justify-center text-center">
        <Icon className={`w-5 h-5 mb-3 transition-colors ${accent ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
        {isLoading ? (
          <Skeleton className="h-8 w-14 mb-1" />
        ) : (
          <p className={`font-display font-black text-2xl md:text-3xl mb-1 ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
        )}
        <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">{title}</p>
      </CardContent>
    </Card>
  );
}

