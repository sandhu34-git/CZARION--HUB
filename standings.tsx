import { Layout } from "@/components/layout";
import { useGetStandings, useListTournaments } from "@workspace/api-client-react";
import { getGetStandingsQueryKey, getListTournamentsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Crosshair, Crown, Medal, Target, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-display font-black text-lg">🥇</span>;
  if (rank === 2) return <span className="text-slate-300 font-display font-black text-lg">🥈</span>;
  if (rank === 3) return <span className="text-orange-400 font-display font-black text-lg">🥉</span>;
  return <span className="font-display font-bold text-muted-foreground text-sm w-6 text-center">#{rank}</span>;
}

export default function Standings() {
  const [tournamentId, setTournamentId] = useState<string>("global");

  const { data: tournaments } = useListTournaments({}, {
    query: { queryKey: getListTournamentsQueryKey({}) }
  });

  const queryParams = tournamentId !== "global" ? { tournamentId: parseInt(tournamentId) } : { global: true };
  const { data: standings, isLoading } = useGetStandings(queryParams, {
    query: {
      queryKey: getGetStandingsQueryKey(queryParams),
      refetchInterval: 30_000,
    }
  });

  const completedTournaments = tournaments?.filter(t => t.status !== "upcoming") ?? [];

  return (
    <Layout>
      {/* Hero */}
      <div className="relative border-b border-border bg-card overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,60,0.08),transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 py-16 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-2 mb-6">
            <TrendingUp className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-primary font-display uppercase tracking-widest text-xs font-bold">Live Standings</span>
          </div>
          <h1 className="font-display font-black text-5xl md:text-7xl uppercase tracking-widest mb-4 glow-text-red">
            BATTLE<span className="text-primary"> STANDINGS</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-display uppercase tracking-wider">
            Real-time tournament rankings. Updated live after every result.
          </p>
        </div>
      </div>

      {/* Sponsor Banner */}
      <div className="border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 py-3 overflow-hidden">
        <div className="container mx-auto px-4 flex items-center justify-center gap-6">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-display shrink-0">Sponsored By</span>
          <div className="flex items-center gap-6">
            <div className="bg-card border border-border/50 px-4 py-1.5 flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded-sm" />
              <span className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">CZARION PLAYZ</span>
            </div>
            <div className="bg-card border border-border/50 px-4 py-1.5 flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-sm" />
              <span className="font-display font-bold uppercase tracking-wider text-xs text-muted-foreground">YOUR BRAND HERE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        {/* Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl uppercase tracking-widest">
              {tournamentId === "global" ? "Global Standings" : "Tournament Standings"}
            </h2>
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider mt-1">
              {tournamentId === "global" ? "All-time points across all tournaments" : "Points within selected tournament"}
            </p>
          </div>
          <Select value={tournamentId} onValueChange={setTournamentId}>
            <SelectTrigger className="w-56 rounded-none bg-card border-border font-display uppercase tracking-wider text-xs">
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border rounded-none">
              <SelectItem value="global" className="font-display uppercase tracking-wider text-xs">Global (All Time)</SelectItem>
              {completedTournaments.map(t => (
                <SelectItem key={t.id} value={String(t.id)} className="font-display uppercase tracking-wider text-xs">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Top 3 Podium */}
        {!isLoading && standings && standings.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 mb-8">
            {/* 2nd */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center pt-6"
            >
              <div className="w-16 h-16 bg-slate-500/20 border-2 border-slate-500/40 flex items-center justify-center mb-2">
                <Medal className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-display font-bold text-sm uppercase tracking-wider text-center text-slate-300 truncate max-w-full px-1">{standings[1]?.teamName}</p>
              <p className="font-display font-black text-2xl text-slate-300">{standings[1]?.points}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">pts</p>
              <div className="w-full mt-3 bg-slate-500/20 h-16 flex items-center justify-center">
                <span className="font-display font-black text-slate-400 text-2xl">2</span>
              </div>
            </motion.div>

            {/* 1st */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <Crown className="w-6 h-6 text-yellow-400 mb-2 animate-pulse" />
              <div className="w-20 h-20 bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center mb-2">
                <Trophy className="w-9 h-9 text-yellow-400" />
              </div>
              <p className="font-display font-bold text-base uppercase tracking-wider text-center text-yellow-400 truncate max-w-full px-1">{standings[0]?.teamName}</p>
              <p className="font-display font-black text-3xl text-yellow-400">{standings[0]?.points}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">pts</p>
              <div className="w-full mt-3 bg-yellow-500/20 h-24 flex items-center justify-center">
                <span className="font-display font-black text-yellow-400 text-3xl">1</span>
              </div>
            </motion.div>

            {/* 3rd */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center pt-10"
            >
              <div className="w-14 h-14 bg-orange-500/20 border-2 border-orange-500/40 flex items-center justify-center mb-2">
                <Medal className="w-6 h-6 text-orange-400" />
              </div>
              <p className="font-display font-bold text-xs uppercase tracking-wider text-center text-orange-400 truncate max-w-full px-1">{standings[2]?.teamName}</p>
              <p className="font-display font-black text-xl text-orange-400">{standings[2]?.points}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">pts</p>
              <div className="w-full mt-3 bg-orange-500/20 h-10 flex items-center justify-center">
                <span className="font-display font-black text-orange-400 text-xl">3</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Full Table */}
        <div className="bg-card border border-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-border bg-secondary/30">
            <div className="col-span-1 text-[10px] text-muted-foreground font-display uppercase tracking-widest">#</div>
            <div className="col-span-5 text-[10px] text-muted-foreground font-display uppercase tracking-widest">Team</div>
            <div className="col-span-2 text-[10px] text-muted-foreground font-display uppercase tracking-widest text-center flex items-center justify-center gap-1"><Trophy className="w-3 h-3" /> Wins</div>
            <div className="col-span-2 text-[10px] text-muted-foreground font-display uppercase tracking-widest text-center flex items-center justify-center gap-1"><Crosshair className="w-3 h-3" /> Kills</div>
            <div className="col-span-2 text-[10px] text-muted-foreground font-display uppercase tracking-widest text-right flex items-center justify-end gap-1"><Target className="w-3 h-3" /> Points</div>
          </div>

          {isLoading ? (
            <div className="space-y-px">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="px-5 py-4 border-b border-border/30">
                  <Skeleton className="h-6 w-full rounded-none" />
                </div>
              ))}
            </div>
          ) : standings && standings.length > 0 ? (
            <div>
              {standings.map((entry, idx) => (
                <motion.div
                  key={entry.teamName}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`grid grid-cols-12 gap-2 px-5 py-4 border-b border-border/20 items-center hover:bg-secondary/20 transition-colors ${idx < 3 ? 'bg-secondary/10' : ''}`}
                >
                  <div className="col-span-1 flex items-center">
                    <RankBadge rank={entry.rank} />
                  </div>
                  <div className="col-span-5">
                    <p className={`font-display font-bold uppercase tracking-wider text-sm truncate ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-orange-400' : 'text-foreground'}`}>
                      {entry.teamName}
                    </p>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="font-mono text-sm text-foreground">{entry.wins}</span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="font-mono text-sm text-foreground">{entry.kills}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <Badge variant="outline" className={`font-display font-bold rounded-none text-xs ${idx === 0 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40' : idx === 1 ? 'bg-slate-500/10 text-slate-300 border-slate-500/40' : idx === 2 ? 'bg-orange-500/10 text-orange-400 border-orange-500/40' : 'bg-primary/10 text-primary border-primary/30'}`}>
                      {entry.points} pts
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="font-display text-lg uppercase tracking-wider text-muted-foreground">No standings yet</p>
              <p className="text-sm text-muted-foreground/60 mt-2">Standings will appear once tournament results are posted.</p>
            </div>
          )}
        </div>

        {/* Points Legend */}
        <div className="mt-6 bg-card border border-border p-4">
          <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest mb-3">Points System</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "1st Place", pts: "12 pts", color: "text-yellow-400" },
              { label: "2nd Place", pts: "7 pts", color: "text-slate-300" },
              { label: "3rd Place", pts: "4 pts", color: "text-orange-400" },
              { label: "Participation", pts: "2 pts", color: "text-muted-foreground" },
            ].map(({ label, pts, color }) => (
              <div key={label} className="text-center">
                <p className={`font-display font-black text-lg ${color}`}>{pts}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
