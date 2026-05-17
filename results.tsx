import { Layout } from "@/components/layout";
import { useListResults, useGetTournament, getListResultsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Star, ShieldAlert, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useState } from "react";
import { ReportModal } from "@/components/report-modal";
import { Show } from "@clerk/react";
import { Link } from "wouter";

function ReportButton({ result }: { result: { id: number; tournamentId: number; winnerTeamName: string } }) {
  const [open, setOpen] = useState(false);
  const { data: tournament } = useGetTournament(result.tournamentId);

  return (
    <>
      <Show when="signed-in">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="font-display uppercase tracking-wider text-xs border-primary/20 text-primary hover:bg-primary/10 rounded-none gap-1.5"
        >
          <Flag className="w-3 h-3" /> Report Player
        </Button>
      </Show>
      {tournament && (
        <ReportModal
          open={open}
          onOpenChange={setOpen}
          tournamentId={result.tournamentId}
          tournamentName={tournament.name}
          organiserId={tournament.organiserId}
        />
      )}
    </>
  );
}

export default function Results() {
  const { data: results, isLoading } = useListResults({}, { query: { queryKey: getListResultsQueryKey() } });

  return (
    <Layout>
      <div className="bg-secondary/30 py-12 border-b border-border relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <p className="text-primary font-display uppercase tracking-widest text-sm mb-2">Post-Match Intel</p>
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-widest mb-4">
            Combat <span className="text-primary">Reports</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Official post-match records, winning squads, and MVP commendations. Signed-in players can flag violations.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-none" />)}
          </div>
        ) : results && results.length > 0 ? (
          <div className="space-y-8">
            {results.map((result, idx) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="bg-card border border-border overflow-hidden hover:border-primary/30 transition-colors group"
              >
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-border/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary/20">
                  <div>
                    <h3 className="font-display font-bold text-xl md:text-2xl uppercase tracking-widest text-primary mb-1">
                      Tournament #{result.tournamentId}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      Concluded: {format(parseISO(result.createdAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-background border-border uppercase font-display tracking-widest rounded-none text-xs">
                      Official Record
                    </Badge>
                    <ReportButton result={result} />
                  </div>
                </div>

                {/* Podium Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">
                  <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center relative bg-primary/5">
                    <Trophy className="w-12 h-12 text-yellow-400 mb-4 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                    <p className="text-xs text-yellow-400/70 font-display uppercase tracking-widest mb-1 font-bold">Champions</p>
                    <h4 className="font-display font-black text-2xl uppercase tracking-wider text-yellow-400 break-words w-full">
                      {result.winnerTeamName}
                    </h4>
                  </div>

                  <div className="p-6 flex flex-col justify-center gap-5">
                    {result.secondTeamName && (
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-slate-400/20 border border-slate-400/50 flex items-center justify-center shrink-0">
                          <span className="font-display font-bold text-slate-400 text-sm">2</span>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-muted-foreground uppercase font-display tracking-widest">Runner Up</p>
                          <p className="font-display font-bold uppercase tracking-wider truncate">{result.secondTeamName}</p>
                        </div>
                      </div>
                    )}
                    {result.thirdTeamName && (
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-amber-700/20 border border-amber-700/50 flex items-center justify-center shrink-0">
                          <span className="font-display font-bold text-amber-700 text-sm">3</span>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-muted-foreground uppercase font-display tracking-widest">3rd Place</p>
                          <p className="font-display font-bold uppercase tracking-wider truncate">{result.thirdTeamName}</p>
                        </div>
                      </div>
                    )}
                    {!result.secondTeamName && !result.thirdTeamName && (
                      <div className="text-center text-muted-foreground text-sm italic py-4">No runners up recorded</div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col justify-center relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 pointer-events-none" style={{ clipPath: "polygon(100% 0, 100% 100%, 0 0)" }} />
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-primary" />
                      <h4 className="font-display font-bold uppercase tracking-widest text-primary">MVP Award</h4>
                    </div>
                    {result.mvpPlayerName ? (
                      <div>
                        <p className="font-display font-black text-xl uppercase tracking-wider mb-2">{result.mvpPlayerName}</p>
                        {result.mvpKills && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/50 font-mono rounded-none">
                            {result.mvpKills} Kills
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No MVP awarded</p>
                    )}
                  </div>
                </div>

                {result.highlightNote && (
                  <div className="p-4 md:px-8 border-t border-border/50 bg-background text-sm text-muted-foreground italic border-l-4 border-l-primary/50">
                    "{result.highlightNote}"
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-card border border-dashed border-border/50">
            <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-display text-2xl font-bold uppercase tracking-wider mb-2">No Reports Available</h3>
            <p className="text-muted-foreground mb-6 text-sm">Match results will appear here once tournaments conclude.</p>
            <Link href="/tournaments">
              <Button variant="outline" className="font-display uppercase tracking-wider rounded-none">
                Browse Tournaments
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
