import { Layout } from "@/components/layout";
import { useAuth, useUser } from "@clerk/react";
import { useGetOrganiser, useEnsureOrganiser, useListTournaments, getGetOrganiserQueryKey, getListTournamentsQueryKey } from "@workspace/api-client-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Trophy, ChevronRight, Crown, BarChart3, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { MembershipModal } from "@/components/membership-modal";
import { motion } from "framer-motion";

export default function OrganiserDashboard() {
  const { userId } = useAuth();
  const { user } = useUser();
  const ensureOrganiser = useEnsureOrganiser();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const ensuredRef = useRef(false);

  const { data: organiser, isLoading: orgLoading } = useGetOrganiser(userId || "", {
    query: { enabled: !!userId, queryKey: getGetOrganiserQueryKey(userId || "") }
  });

  const { data: tournaments, isLoading: toursLoading } = useListTournaments(
    { organiserId: userId || "" },
    { query: { enabled: !!userId, queryKey: getListTournamentsQueryKey({ organiserId: userId || "" }) } }
  );

  useEffect(() => {
    if (user && userId && !ensuredRef.current && !orgLoading) {
      ensuredRef.current = true;
      ensureOrganiser.mutate({
        clerkId: userId,
        data: { displayName: user.username || `Host_${userId.substring(0, 6)}` }
      });
    }
  }, [user, userId, orgLoading]);

  const liveCount = tournaments?.filter(t => t.status === "live").length ?? 0;
  const completedCount = tournaments?.filter(t => t.status === "completed").length ?? 0;

  return (
    <Layout>
      {/* Header */}
      <div className="bg-secondary/20 border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(255,0,60,0.06),transparent_60%)] pointer-events-none" />
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest mb-1">
                Host: <span className="text-foreground">{orgLoading ? "..." : (organiser?.displayName || user?.username)}</span>
                {organiser?.isVerified && (
                  <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-400 border-blue-500/30 text-[9px] rounded-none uppercase tracking-wider">Verified</Badge>
                )}
              </p>
              <h1 className="font-display font-black text-2xl md:text-3xl uppercase tracking-widest glow-text-red">Command Center</h1>
            </div>
            <Link href="/organiser/create">
              <Button className="font-display uppercase tracking-wider font-bold animate-pulse-neon rounded-none">
                <Plus className="w-4 h-4 mr-2" /> Launch Tournament
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {!toursLoading && tournaments && (
        <div className="border-b border-border bg-card/40">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 divide-x divide-border/50">
              <div className="p-5 text-center">
                <p className="font-display font-black text-2xl text-foreground">{tournaments.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Total Events</p>
              </div>
              <div className="p-5 text-center">
                <p className="font-display font-black text-2xl text-primary">{liveCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Live Now</p>
              </div>
              <div className="p-5 text-center">
                <p className="font-display font-black text-2xl text-foreground">{completedCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="font-display font-bold text-xl uppercase tracking-widest flex items-center gap-2">
                <Trophy className="text-primary w-5 h-5" /> Hosted Events
              </h2>
              <Link href="/organiser/create">
                <Button variant="ghost" size="sm" className="font-display uppercase tracking-wider text-xs text-muted-foreground hover:text-primary">
                  <Plus className="w-3 h-3 mr-1" /> New
                </Button>
              </Link>
            </div>

            {toursLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-none" />)}
              </div>
            ) : tournaments && tournaments.length > 0 ? (
              <div className="space-y-3">
                {tournaments.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-card border border-border flex flex-col sm:flex-row hover:border-primary/40 transition-colors group"
                  >
                    <div className="p-5 flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className="bg-secondary text-muted-foreground border-border uppercase font-display tracking-widest rounded-none text-[9px] shrink-0">
                              {t.game}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`uppercase font-display tracking-widest rounded-none text-[9px] shrink-0 ${t.status === "live" ? "bg-primary/20 text-primary border-primary animate-pulse" : t.status === "completed" ? "bg-muted text-muted-foreground border-border" : "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"}`}
                            >
                              {t.status}
                            </Badge>
                          </div>
                          <h3 className="font-display font-bold text-base uppercase tracking-wider line-clamp-1 group-hover:text-primary transition-colors">{t.name}</h3>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(parseISO(t.matchDate), "MMM d, p")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {t.filledSlots}/{t.totalSlots} slots
                        </div>
                      </div>
                    </div>
                    <div className="bg-secondary/30 sm:border-l border-t sm:border-t-0 border-border px-5 py-4 flex items-center justify-center sm:w-36">
                      <Link href={`/organiser/tournament/${t.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full font-display uppercase tracking-wider border-primary/30 hover:bg-primary hover:text-white rounded-none text-xs">
                          Manage <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-border bg-card/30">
                <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-2">No Hosted Events</h3>
                <p className="text-muted-foreground text-sm mb-6">Create your first tournament to build your community.</p>
                <Link href="/organiser/create">
                  <Button className="font-display uppercase tracking-wider rounded-none animate-pulse-neon">
                    <Plus className="w-4 h-4 mr-2" /> Launch Your First Event
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Membership Card */}
            <div className="bg-card border border-border p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.07]">
                <Crown className="w-20 h-20 text-primary" />
              </div>
              <div className="relative z-10">
                <h3 className="font-display font-bold text-base uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Crown className="text-primary w-4 h-4" /> Host Status
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Plan</p>
                    <span className="font-display font-bold text-2xl text-primary uppercase">
                      {orgLoading ? "..." : (organiser?.membershipPlan || "Free Tier")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">Tournaments Remaining</span>
                      <span className="text-foreground font-bold">{orgLoading ? "..." : (organiser?.freeTournamentsLimit ?? 2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono border-b border-border/40 pb-2">
                      <span className="text-muted-foreground">Scrims Remaining</span>
                      <span className="text-foreground font-bold">{orgLoading ? "..." : (organiser?.freeScrimsLimit ?? 3)}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full font-display uppercase tracking-wider border-primary/40 text-primary hover:bg-primary hover:text-white rounded-none"
                    onClick={() => setUpgradeModalOpen(true)}
                  >
                    <Crown className="w-4 h-4 mr-2" /> Upgrade Access
                  </Button>
                </div>
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-card border border-border p-5">
              <h3 className="font-display font-bold text-base uppercase tracking-widest mb-5 flex items-center gap-2">
                <BarChart3 className="text-primary w-4 h-4" /> Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-4 bg-background border border-border/40">
                  <p className="font-display font-black text-2xl mb-1">{orgLoading ? "..." : (organiser?.tournamentsHosted ?? 0)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Tournaments</p>
                </div>
                <div className="text-center p-4 bg-background border border-border/40">
                  <p className="font-display font-black text-2xl mb-1">{orgLoading ? "..." : (organiser?.scrimsHosted ?? 0)}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Scrims</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {userId && (
        <MembershipModal open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen} organiserId={userId} />
      )}
    </Layout>
  );
}
