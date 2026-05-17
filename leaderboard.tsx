import { Layout } from "@/components/layout";
import { useGetPlayerLeaderboard } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal, Target, Crosshair, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: players, isLoading } = useGetPlayerLeaderboard();

  const top3 = players?.slice(0, 3) ?? [];
  const rest = players?.slice(3) ?? [];

  return (
    <Layout>
      {/* Header */}
      <div className="bg-card border-b border-border py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,60,0.1),transparent_60%)] pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <p className="text-primary font-display uppercase tracking-widest text-sm mb-2">Global Rankings</p>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-widest mb-3 glow-text-red">
            Hall of <span className="text-primary">Fame</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            The deadliest operatives across the CZARION HUB network. Ranked by total confirmed kills.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">

        {/* Top 3 Podium */}
        {(isLoading || top3.length >= 3) && (
          <div className="mb-16">
            <div className="flex flex-col md:flex-row items-end justify-center gap-3 md:gap-6 pt-8">

              {/* Podium slots: order is 2nd, 1st, 3rd */}
              {isLoading ? (
                [1, 2, 3].map(i => <Skeleton key={i} className="h-56 w-full md:w-1/3 rounded-none" />)
              ) : top3.length >= 3 ? (
                <>
                  {/* 2nd Place */}
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="w-full md:w-[30%] flex flex-col items-center order-2 md:order-1">
                    <div className="relative mb-3">
                      <div className="w-20 h-20 bg-secondary border-4 border-slate-400 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(148,163,184,0.3)]">
                        {top3[1].avatarUrl
                          ? <img src={top3[1].avatarUrl} alt="" className="w-full h-full object-cover" />
                          : <Target className="w-8 h-8 text-slate-400" />}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-slate-400 text-slate-900 font-black font-display w-7 h-7 flex items-center justify-center text-sm border-2 border-background">2</div>
                    </div>
                    <div className="w-full bg-card border-t-4 border-slate-400 p-4 text-center" style={{ height: "120px" }}>
                      <p className="font-display font-bold uppercase tracking-wider text-sm truncate px-1">{top3[1].displayName || top3[1].username}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Kills</p>
                      <p className="font-display font-black text-2xl text-slate-400 mt-1">{top3[1].totalKills}</p>
                    </div>
                  </motion.div>

                  {/* 1st Place */}
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="w-full md:w-[36%] flex flex-col items-center order-1 md:order-2 z-10 md:-translate-y-4">
                    <Crown className="text-yellow-400 w-10 h-10 mb-3 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                    <div className="relative mb-3">
                      <div className="w-28 h-28 bg-secondary border-4 border-yellow-400 overflow-hidden flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                        {top3[0].avatarUrl
                          ? <img src={top3[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                          : <Crown className="w-12 h-12 text-yellow-400" />}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 font-black font-display w-9 h-9 flex items-center justify-center text-base border-2 border-background">1</div>
                    </div>
                    <div className="w-full bg-card border-t-4 border-yellow-400 p-4 text-center shadow-[0_0_20px_rgba(250,204,21,0.1)]" style={{ height: "140px" }}>
                      <p className="font-display font-bold uppercase tracking-wider text-yellow-400 truncate px-1">{top3[0].displayName || top3[0].username}</p>
                      {top3[0].isMvp && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[9px] uppercase px-1 py-0 h-4 mt-1">MVP</Badge>}
                      <p className="text-[10px] text-yellow-400/60 uppercase tracking-widest mt-2">Total Kills</p>
                      <p className="font-display font-black text-4xl text-yellow-400 glow-text-red">{top3[0].totalKills}</p>
                    </div>
                  </motion.div>

                  {/* 3rd Place */}
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="w-full md:w-[30%] flex flex-col items-center order-3">
                    <div className="relative mb-3">
                      <div className="w-20 h-20 bg-secondary border-4 border-amber-700 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(180,83,9,0.3)]">
                        {top3[2].avatarUrl
                          ? <img src={top3[2].avatarUrl} alt="" className="w-full h-full object-cover" />
                          : <Crosshair className="w-8 h-8 text-amber-700" />}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white font-black font-display w-7 h-7 flex items-center justify-center text-sm border-2 border-background">3</div>
                    </div>
                    <div className="w-full bg-card border-t-4 border-amber-700 p-4 text-center" style={{ height: "108px" }}>
                      <p className="font-display font-bold uppercase tracking-wider text-sm truncate px-1">{top3[2].displayName || top3[2].username}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Kills</p>
                      <p className="font-display font-black text-xl text-amber-600 mt-1">{top3[2].totalKills}</p>
                    </div>
                  </motion.div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Rankings Table */}
        <div className="bg-card border border-border overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50 bg-secondary/40">
            <div className="col-span-1 text-center font-display uppercase tracking-widest text-[10px] text-muted-foreground font-bold">#</div>
            <div className="col-span-6 md:col-span-5 font-display uppercase tracking-widest text-[10px] text-muted-foreground font-bold">Player</div>
            <div className="hidden md:block col-span-2 text-center font-display uppercase tracking-widest text-[10px] text-muted-foreground font-bold">Matches</div>
            <div className="hidden md:block col-span-2 text-center font-display uppercase tracking-widest text-[10px] text-muted-foreground font-bold">Wins</div>
            <div className="col-span-5 md:col-span-2 text-right pr-3 font-display uppercase tracking-widest text-[10px] text-muted-foreground font-bold">Kills</div>
          </div>

          <div className="divide-y divide-border/20">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                  <Skeleton className="col-span-1 h-5 w-5 mx-auto rounded-none" />
                  <div className="col-span-6 flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-none" />
                    <Skeleton className="h-4 w-24 rounded-none" />
                  </div>
                  <Skeleton className="hidden md:block col-span-2 h-4 w-8 mx-auto rounded-none" />
                  <Skeleton className="hidden md:block col-span-2 h-4 w-8 mx-auto rounded-none" />
                  <Skeleton className="col-span-3 md:col-span-2 h-4 w-10 ml-auto rounded-none" />
                </div>
              ))
            ) : rest.length > 0 ? (
              rest.map((player, idx) => {
                const rank = (top3.length >= 3 ? 3 : top3.length) + idx + 1;
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.03 }}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-secondary/20 transition-colors group"
                  >
                    <div className="col-span-1 text-center font-display font-bold text-sm text-muted-foreground group-hover:text-primary transition-colors">
                      {rank}
                    </div>
                    <div className="col-span-6 md:col-span-5 flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 bg-background border border-border/50 hidden sm:flex items-center justify-center shrink-0">
                        {player.avatarUrl
                          ? <img src={player.avatarUrl} alt="" className="w-full h-full object-cover" />
                          : <Target className="w-4 h-4 text-muted-foreground/50" />}
                      </div>
                      <div className="truncate">
                        <p className="font-display font-bold uppercase tracking-wider text-xs truncate">{player.displayName || player.username}</p>
                        {player.isMvp && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[8px] uppercase px-1 py-0 h-3.5 mt-0.5">MVP</Badge>}
                      </div>
                    </div>
                    <div className="hidden md:flex col-span-2 justify-center font-mono text-sm text-muted-foreground">{player.totalMatches ?? 0}</div>
                    <div className="hidden md:flex col-span-2 justify-center font-mono text-sm text-muted-foreground">{player.totalWins ?? 0}</div>
                    <div className="col-span-5 md:col-span-2 text-right pr-3 font-display font-black text-lg text-primary">
                      {player.totalKills ?? 0}
                    </div>
                  </motion.div>
                );
              })
            ) : !isLoading && players && players.length === 0 ? (
              <div className="py-16 text-center">
                <Medal className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-display uppercase tracking-widest text-muted-foreground">No players ranked yet</p>
                <p className="text-muted-foreground text-xs mt-1">Complete tournaments to earn your rank.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
