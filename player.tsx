import { Layout } from "@/components/layout";
import { useGetPlayer, useGetCoinBalance, useListRatings } from "@workspace/api-client-react";
import { getGetPlayerQueryKey, getGetCoinBalanceQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Trophy, Crosshair, Target, Medal, ShieldCheck, AlertTriangle, Ban,
  Star, Coins, Swords, Crown, Flame, Zap, ChevronLeft
} from "lucide-react";

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
  { key: "achievementMvpKing", label: "MVP King", icon: Crown, desc: "Awarded MVP in a tournament", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  { key: "achievementTopFragger", label: "Top Fragger", icon: Crosshair, desc: "Highest kills in a tournament", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  { key: "achievementChampion", label: "Champion", icon: Trophy, desc: "Won a tournament", color: "text-primary", bg: "bg-primary/10 border-primary/30" },
  { key: "achievement100Wins", label: "100 Wins", icon: Flame, desc: "Achieved 100 tournament wins", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  { key: "fairPlayBadge", label: "Fair Play", icon: ShieldCheck, desc: "Zero violations or warnings", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
] as const;

export default function PlayerPortfolio() {
  const { clerkId } = useParams<{ clerkId: string }>();

  const { data: player, isLoading } = useGetPlayer(clerkId || "", {
    query: { enabled: !!clerkId, queryKey: getGetPlayerQueryKey(clerkId || "") }
  });
  const { data: coinData } = useGetCoinBalance(clerkId || "", {
    query: { enabled: !!clerkId, queryKey: getGetCoinBalanceQueryKey(clerkId || "") }
  });

  const rank = getScrimRank(player?.scrimPoints ?? 0);
  const repTier = getReputationTier(player?.reputationScore ?? 70);
  const repScore = player?.reputationScore ?? 70;

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
          <Skeleton className="h-48 w-full rounded-none" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-none" />)}
          </div>
          <Skeleton className="h-48 w-full rounded-none" />
        </div>
      </Layout>
    );
  }

  if (!player) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display font-bold text-4xl uppercase tracking-widest text-destructive mb-4">Player Not Found</h1>
          <Link href="/leaderboard"><Button variant="outline" className="font-display uppercase tracking-wider">Back to Leaderboard</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-4xl">

        {/* Back */}
        <Link href="/leaderboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 font-display uppercase tracking-wider text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to Leaderboard
        </Link>

        {/* Profile Header */}
        <div className="relative bg-card border border-border overflow-hidden mb-6">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left_top,rgba(255,0,60,0.08),transparent_60%)] pointer-events-none" />
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 md:p-8 relative z-10">
            <div className="relative shrink-0">
              <div className={`w-24 h-24 bg-secondary border-2 overflow-hidden flex items-center justify-center ${player.isBanned ? 'border-destructive/60' : player.fairPlayBadge ? 'border-green-500/60' : 'border-primary/60'}`}>
                {player.avatarUrl ? (
                  <img src={player.avatarUrl} alt={player.username} className={`w-full h-full object-cover ${player.isBanned ? 'grayscale' : ''}`} />
                ) : (
                  <span className="font-display font-black text-3xl text-primary">{player.username.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display font-black text-3xl uppercase tracking-widest">
                  {player.displayName || player.username}
                </h1>
                {player.isMvp && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/50 font-display uppercase tracking-wider rounded-none">
                    <Medal className="w-3 h-3 mr-1" /> MVP
                  </Badge>
                )}
                {player.isBanned && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/50 font-display uppercase tracking-wider rounded-none">
                    <Ban className="w-3 h-3 mr-1" /> Banned
                  </Badge>
                )}
                {!player.isBanned && player.fairPlayBadge && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/50 font-display uppercase tracking-wider rounded-none">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Fair Play
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`${rank.bg} ${rank.color} font-display uppercase tracking-wider rounded-none`}>
                  {rank.icon} {rank.label}
                </Badge>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-mono tracking-widest rounded-none text-xs">
                  UID: {player.gameUid || "N/A"}
                </Badge>
                <Badge variant="outline" className="bg-secondary text-muted-foreground border-border uppercase font-display tracking-widest rounded-none text-xs">
                  Level {player.level}
                </Badge>
                {player.warningCount > 0 && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/40 font-display uppercase tracking-wider rounded-none">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {player.warningCount} Warnings
                  </Badge>
                )}
              </div>
              {player.bio && <p className="mt-3 text-sm text-muted-foreground">{player.bio}</p>}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { title: "Total Kills", value: player.totalKills, icon: Crosshair, accent: true },
            { title: "Tournament Wins", value: player.totalWins, icon: Trophy },
            { title: "Matches Played", value: player.totalMatches, icon: Target },
            { title: "CZ Coins", value: coinData?.balance ?? player.czCoins, icon: Coins },
          ].map(({ title, value, icon: Icon, accent }) => (
            <div key={title} className={`border border-border p-5 flex flex-col items-center text-center ${accent ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
              <Icon className={`w-5 h-5 mb-3 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className={`font-display font-black text-2xl mb-1 ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
              <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest">{title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Reputation Score */}
          <div className="bg-card border border-border p-6">
            <h3 className="font-display font-bold text-lg uppercase tracking-widest mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" /> Reputation Score
            </h3>
            <div className="flex items-end justify-between mb-3">
              <span className={`font-display font-black text-4xl ${repTier.color}`}>{repScore}</span>
              <span className={`font-display font-bold text-sm uppercase tracking-wider ${repTier.color}`}>{repTier.label}</span>
            </div>
            <Progress value={repScore} className="h-3 rounded-none mb-2" />
            <p className="text-xs text-muted-foreground mt-2">Score based on fair play & community reports</p>
          </div>

          {/* Scrim Rank */}
          <div className="bg-card border border-border p-6">
            <h3 className="font-display font-bold text-lg uppercase tracking-widest mb-4 flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" /> Scrim Rank
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-5xl">{rank.icon}</span>
              <div>
                <p className={`font-display font-black text-3xl ${rank.color}`}>{rank.label}</p>
                <p className="text-xs text-muted-foreground">{player.scrimPoints} / {rank.label === "Predator" ? "∞" : rank.label === "Elite" ? "10000" : rank.label === "Gold" ? "6000" : rank.label === "Silver" ? "3000" : "1000"} SP</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-1 mt-3">
              {["Bronze", "Silver", "Gold", "Elite", "Predator"].map((r, i) => (
                <div key={r} className={`h-1.5 rounded-full ${["Bronze", "Silver", "Gold", "Elite", "Predator"].indexOf(rank.label) >= i ? repTier.barColor : 'bg-secondary'}`} />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              {["🥉", "🥈", "🥇", "💎", "☠️"].map((e, i) => (
                <span key={i} className="text-xs text-center">{e}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-card border border-border p-6 mb-6">
          <h3 className="font-display font-bold text-lg uppercase tracking-widest mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Achievement Badges
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {ACHIEVEMENTS.map(({ key, label, icon: Icon, desc, color, bg }) => {
              const unlocked = player[key as keyof typeof player] as boolean;
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center text-center p-4 border transition-all ${unlocked ? bg : 'bg-secondary/20 border-border/30 opacity-40 grayscale'}`}
                  title={desc}
                >
                  <div className={`w-12 h-12 flex items-center justify-center mb-2 rounded-full ${unlocked ? 'bg-current/10' : 'bg-secondary'}`}>
                    <Icon className={`w-6 h-6 ${unlocked ? color : 'text-muted-foreground'}`} />
                  </div>
                  <p className={`font-display font-bold text-xs uppercase tracking-wider ${unlocked ? color : 'text-muted-foreground'}`}>{label}</p>
                  {unlocked && <p className="text-[9px] text-muted-foreground mt-1">UNLOCKED</p>}
                  {!unlocked && <p className="text-[9px] text-muted-foreground/50 mt-1">LOCKED</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* XP Progress */}
        <div className="bg-card border border-border p-6">
          <h3 className="font-display font-bold text-lg uppercase tracking-widest mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" /> XP & Level
          </h3>
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 border-2 border-primary/40 flex items-center justify-center shrink-0">
              <span className="font-display font-black text-2xl text-primary">{player.level}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">Level {player.level}</span>
                <span className="text-sm text-primary font-bold">{player.xp} XP</span>
              </div>
              <Progress value={Math.min((player.xp % 1000) / 10, 100)} className="h-2 rounded-none" />
              <p className="text-xs text-muted-foreground mt-1">{1000 - (player.xp % 1000)} XP to next level</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
