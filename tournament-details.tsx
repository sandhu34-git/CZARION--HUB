import { Layout } from "@/components/layout";
import {
  useGetTournament, useGetBracket, useListCheckins, useCreateCheckin,
  useListRatings, useCreateRating, useListRegistrations
} from "@workspace/api-client-react";
import {
  getGetBracketQueryKey, getListCheckinsQueryKey, getListRatingsQueryKey, getListRegistrationsQueryKey
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useAuth, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Calendar, Users, Coins, Ticket, FileText, Youtube, MessageSquare,
  Copy, CheckCircle2, Star, CheckCheck, Swords, BarChart3, AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { format, parseISO, isPast, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

type BracketMatch = { id: string; team1: string | null; team2: string | null; winner: string | null; slot: number };
type BracketRound = { round: number; name: string; matches: BracketMatch[] };
type BracketData = { rounds: BracketRound[]; format: string };

function BracketView({ data }: { data: BracketData }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {data.rounds.map((round) => (
          <div key={round.round} className="flex flex-col gap-3" style={{ minWidth: "160px" }}>
            <div className="text-[10px] font-display uppercase tracking-widest text-primary text-center pb-2 border-b border-primary/20">
              {round.name}
            </div>
            <div className="flex flex-col justify-around gap-4 flex-1">
              {round.matches.map((match) => (
                <div key={match.id} className="bg-card border border-border overflow-hidden">
                  {/* Team 1 */}
                  <div className={`px-3 py-2 border-b border-border/30 flex items-center justify-between gap-2 ${match.winner === match.team1 ? 'bg-primary/10' : ''}`}>
                    <span className={`font-display text-xs font-semibold truncate flex-1 ${match.winner === match.team1 ? 'text-primary' : match.team1 ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                      {match.team1 || "TBD"}
                    </span>
                    {match.winner === match.team1 && <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />}
                  </div>
                  {/* Team 2 */}
                  <div className={`px-3 py-2 flex items-center justify-between gap-2 ${match.winner === match.team2 ? 'bg-primary/10' : ''}`}>
                    <span className={`font-display text-xs font-semibold truncate flex-1 ${match.winner === match.team2 ? 'text-primary' : match.team2 ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                      {match.team2 || "TBD"}
                    </span>
                    {match.winner === match.team2 && <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-colors"
        >
          <Star className={`w-6 h-6 ${(hovered || value) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  );
}

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = parseInt(id || "0", 10);
  const { userId } = useAuth();
  const { user } = useUser();
  const { data: tournament, isLoading } = useGetTournament(tournamentId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  // Bracket
  const { data: bracket } = useGetBracket(tournamentId, {
    query: { enabled: !isLoading, queryKey: getGetBracketQueryKey(tournamentId) }
  });

  // Checkins
  const { data: checkins, isLoading: checkinsLoading } = useListCheckins(
    { tournamentId },
    { query: { enabled: !isLoading, queryKey: getListCheckinsQueryKey({ tournamentId }) } }
  );

  // Ratings
  const { data: ratings } = useListRatings(
    { organiserId: tournament?.organiserId, tournamentId },
    { query: { enabled: !!tournament, queryKey: getListRatingsQueryKey({ organiserId: tournament?.organiserId, tournamentId }) } }
  );

  // User's registration
  const { data: myRegistrations } = useListRegistrations(
    { tournamentId, userId: userId || "" },
    { query: { enabled: !!userId, queryKey: getListRegistrationsQueryKey({ tournamentId, userId: userId || "" }) } }
  );

  const createCheckin = useCreateCheckin();
  const createRating = useCreateRating();

  const myReg = myRegistrations?.find(r => r.status === "approved");
  const alreadyCheckedIn = checkins?.some(c => c.userId === userId);
  const alreadyRated = ratings?.some(r => r.raterUserId === userId);
  const avgRating = ratings && ratings.length > 0 ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : null;

  useEffect(() => {
    if (!tournament?.matchDate || tournament.status === "completed") return;
    const interval = setInterval(() => {
      const date = parseISO(tournament.matchDate);
      setTimeLeft(isPast(date) ? "Started" : formatDistanceToNow(date, { addSuffix: true }));
    }, 1000);
    const date = parseISO(tournament.matchDate);
    setTimeLeft(isPast(date) ? "Started" : formatDistanceToNow(date, { addSuffix: true }));
    return () => clearInterval(interval);
  }, [tournament]);

  const copyToClipboard = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }
    else { setCopiedPass(true); setTimeout(() => setCopiedPass(false), 2000); }
    toast({ title: "Copied!", description: `${type === 'id' ? 'Room ID' : 'Password'} copied.` });
  };

  const handleCheckin = async () => {
    if (!userId || !myReg) return;
    try {
      await createCheckin.mutateAsync({
        data: { tournamentId, userId, teamName: myReg.teamName, registrationId: myReg.id }
      });
      await queryClient.invalidateQueries({ queryKey: getListCheckinsQueryKey({ tournamentId }) });
      toast({ title: "Checked In!", description: `${myReg.teamName} is confirmed for the match!` });
    } catch {
      toast({ title: "Already Checked In", description: "Your team is already checked in.", variant: "destructive" });
    }
  };

  const handleRating = async () => {
    if (!userId || !user || !tournament) return;
    setSubmittingRating(true);
    try {
      await createRating.mutateAsync({
        data: {
          organiserId: tournament.organiserId,
          raterUserId: userId,
          raterName: user.username || userId,
          tournamentId,
          rating: ratingValue,
          comment: ratingComment || undefined,
        }
      });
      await queryClient.invalidateQueries({ queryKey: getListRatingsQueryKey({ organiserId: tournament.organiserId, tournamentId }) });
      toast({ title: "Rating Submitted!", description: "Thank you for your feedback." });
    } catch {
      toast({ title: "Already Rated", description: "You have already rated this organiser for this tournament.", variant: "destructive" });
    } finally {
      setSubmittingRating(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display font-bold text-4xl uppercase tracking-widest text-destructive mb-4">Tournament Not Found</h1>
          <Link href="/tournaments"><Button variant="outline" className="font-display uppercase tracking-wider">Return to Arena</Button></Link>
        </div>
      </Layout>
    );
  }

  const bracketData: BracketData | null = bracket ? JSON.parse(bracket.matchData) : null;

  return (
    <Layout>
      {/* Sponsor Banner */}
      {tournament.bannerUrl && (
        <div className="border-b border-border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 py-2">
          <div className="container mx-auto px-4 flex items-center justify-center gap-3">
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-display">Sponsored</span>
            <img src={tournament.bannerUrl} alt="Sponsor" className="h-6 object-contain opacity-70" />
          </div>
        </div>
      )}

      {/* Banner */}
      <div className="relative h-64 md:h-96 w-full bg-secondary overflow-hidden border-b border-border">
        {tournament.bannerUrl ? (
          <img src={tournament.bannerUrl} alt={tournament.name} className="w-full h-full object-cover opacity-50" />
        ) : (
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto">
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/50 uppercase tracking-wider font-display">{tournament.game}</Badge>
              <Badge variant="outline" className="bg-background border-border uppercase tracking-wider font-display">{tournament.status}</Badge>
              {tournament.isVerifiedOrganiser && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50 uppercase tracking-wider font-display">Verified Host</Badge>
              )}
              {avgRating && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 uppercase tracking-wider font-display">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400" /> {avgRating} ({ratings?.length})
                </Badge>
              )}
            </div>
            <h1 className="font-display font-black text-4xl md:text-6xl uppercase tracking-widest mb-2 text-white glow-text-red">{tournament.name}</h1>
            <p className="text-xl text-muted-foreground font-display uppercase tracking-wider">
              Hosted by <span className="text-primary font-bold">{tournament.organiserId}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-card border border-border p-4 flex flex-col gap-2">
                <Coins className="w-6 h-6 text-primary" />
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Prize Pool</span>
                <span className="font-display font-bold text-xl">{tournament.prizePool}</span>
              </div>
              <div className="bg-card border border-border p-4 flex flex-col gap-2">
                <Ticket className="w-6 h-6 text-primary" />
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Entry Fee</span>
                <span className="font-display font-bold text-xl">{tournament.entryFee === "0" || tournament.entryFee.toLowerCase() === "free" ? "Free" : tournament.entryFee}</span>
              </div>
              <div className="bg-card border border-border p-4 flex flex-col gap-2">
                <Users className="w-6 h-6 text-primary" />
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Slots</span>
                <span className="font-display font-bold text-xl">{tournament.filledSlots} / {tournament.totalSlots}</span>
              </div>
              <div className="bg-card border border-border p-4 flex flex-col gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Match Date</span>
                <span className="font-display font-bold text-lg">{format(parseISO(tournament.matchDate), 'MMM d, p')}</span>
              </div>
            </div>

            {/* Tabs: Info, Bracket, Standings, Checkins */}
            <Tabs defaultValue="info">
              <TabsList className="bg-card border border-border rounded-none w-full flex-wrap h-auto mb-6">
                <TabsTrigger value="info" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Intel
                </TabsTrigger>
                <TabsTrigger value="bracket" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs flex items-center gap-1">
                  <Swords className="w-3 h-3" /> Bracket
                </TabsTrigger>
                <TabsTrigger value="checkins" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Check-in {checkins && checkins.length > 0 && `(${checkins.length})`}
                </TabsTrigger>
                <TabsTrigger value="ratings" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Ratings {avgRating && `(${avgRating}★)`}
                </TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-6">
                {tournament.description && (
                  <div className="bg-card border border-border p-6">
                    <h3 className="font-display font-bold text-xl uppercase tracking-widest flex items-center gap-3 mb-4">
                      <FileText className="text-primary w-5 h-5" /> Intel
                    </h3>
                    <div className="prose prose-invert max-w-none text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: tournament.description.replace(/\n/g, '<br/>') }} />
                  </div>
                )}
                {tournament.rules && (
                  <div className="bg-card border border-border p-6">
                    <h3 className="font-display font-bold text-xl uppercase tracking-widest flex items-center gap-3 mb-4">
                      <Trophy className="text-primary w-5 h-5" /> Rules
                    </h3>
                    <div className="prose prose-invert max-w-none text-muted-foreground text-sm" dangerouslySetInnerHTML={{ __html: tournament.rules.replace(/\n/g, '<br/>') }} />
                  </div>
                )}
                {!tournament.description && !tournament.rules && (
                  <div className="text-center py-12 border border-dashed border-border/40 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="font-display uppercase tracking-wider text-sm">No details provided yet.</p>
                  </div>
                )}
              </TabsContent>

              {/* Bracket Tab */}
              <TabsContent value="bracket">
                {bracketData ? (
                  <div className="bg-card border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display font-bold text-xl uppercase tracking-widest flex items-center gap-3">
                        <Swords className="text-primary w-5 h-5" /> {bracketData.format === "single-elimination" ? "Single Elimination" : bracketData.format}
                      </h3>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-display uppercase text-xs rounded-none">
                        {bracket?.status}
                      </Badge>
                    </div>
                    <BracketView data={bracketData} />
                  </div>
                ) : (
                  <div className="text-center py-16 border border-dashed border-border/40 bg-card/30">
                    <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <h3 className="font-display text-lg uppercase tracking-wider text-muted-foreground mb-1">Bracket Not Yet Generated</h3>
                    <p className="text-sm text-muted-foreground/60">The organiser will generate the bracket before the match starts.</p>
                  </div>
                )}
              </TabsContent>

              {/* Checkins Tab */}
              <TabsContent value="checkins">
                <div className="space-y-4">
                  {/* Check-in action */}
                  {userId && myReg && tournament.status !== "completed" && (
                    <div className={`border p-4 flex items-center justify-between gap-4 ${alreadyCheckedIn ? 'bg-green-500/5 border-green-500/30' : 'bg-yellow-500/5 border-yellow-500/30'}`}>
                      <div>
                        <p className="font-display font-bold uppercase tracking-wider text-sm">{alreadyCheckedIn ? "✅ Team Checked In" : "⏳ Check-in Required"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alreadyCheckedIn ? `${myReg.teamName} is confirmed for this match.` : "Confirm your squad's participation before match start."}</p>
                      </div>
                      {!alreadyCheckedIn && (
                        <Button className="font-display uppercase tracking-wider rounded-none shrink-0 animate-pulse-neon" onClick={handleCheckin} disabled={createCheckin.isPending}>
                          <CheckCheck className="w-4 h-4 mr-2" /> Check In
                        </Button>
                      )}
                    </div>
                  )}

                  {checkinsLoading ? (
                    <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-none" />)}</div>
                  ) : checkins && checkins.length > 0 ? (
                    <div className="bg-card border border-border overflow-hidden">
                      <div className="px-5 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
                        <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Checked In Teams</span>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs font-display uppercase rounded-none">{checkins.length} Teams</Badge>
                      </div>
                      {checkins.map((checkin, idx) => (
                        <motion.div
                          key={checkin.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="flex items-center gap-4 px-5 py-3 border-b border-border/20"
                        >
                          <CheckCheck className="w-4 h-4 text-green-400 shrink-0" />
                          <div className="flex-1">
                            <p className="font-display font-bold text-sm uppercase tracking-wider">{checkin.teamName}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">{format(parseISO(checkin.createdAt), 'h:mm a')}</span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed border-border/40 text-muted-foreground">
                      <CheckCheck className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="font-display uppercase tracking-wider text-sm">No teams checked in yet.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Ratings Tab */}
              <TabsContent value="ratings">
                <div className="space-y-4">
                  {/* Average Rating Display */}
                  {avgRating && (
                    <div className="bg-card border border-border p-6 flex items-center gap-6">
                      <div className="text-center">
                        <p className="font-display font-black text-5xl text-yellow-400">{avgRating}</p>
                        <div className="flex gap-0.5 justify-center mt-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-4 h-4 ${parseFloat(avgRating) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{ratings?.length} rating{(ratings?.length ?? 0) > 1 ? "s" : ""}</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = ratings?.filter(r => r.rating === star).length ?? 0;
                          const pct = ratings && ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground w-3">{star}</span>
                              <div className="flex-1 bg-secondary h-2">
                                <div className="bg-yellow-400 h-2 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground w-4">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rate organiser */}
                  {userId && tournament.status === "completed" && !alreadyRated && (
                    <div className="bg-card border border-border p-5">
                      <p className="font-display font-bold uppercase tracking-wider text-sm mb-3">Rate this Tournament's Organiser</p>
                      <StarRating value={ratingValue} onChange={setRatingValue} />
                      <input
                        type="text"
                        placeholder="Optional comment..."
                        value={ratingComment}
                        onChange={e => setRatingComment(e.target.value)}
                        className="mt-3 w-full bg-background border border-border px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary transition-colors"
                      />
                      <Button
                        className="mt-3 font-display uppercase tracking-wider rounded-none"
                        size="sm"
                        onClick={handleRating}
                        disabled={submittingRating}
                      >
                        {submittingRating ? "Submitting..." : "Submit Rating"}
                      </Button>
                    </div>
                  )}

                  {alreadyRated && (
                    <div className="bg-green-500/5 border border-green-500/30 p-4 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <p className="font-display text-sm text-green-400 uppercase tracking-wider">You've already rated this organiser.</p>
                    </div>
                  )}

                  {/* Reviews list */}
                  {ratings && ratings.length > 0 && (
                    <div className="bg-card border border-border divide-y divide-border/30">
                      {ratings.map(r => (
                        <div key={r.id} className="px-5 py-4">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-display font-bold text-sm uppercase">{r.raterName}</p>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${r.rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
                              ))}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono ml-auto">{format(parseISO(r.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                          {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border p-6 neon-border relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              <div className="relative z-10">
                <h3 className="font-display font-bold text-2xl uppercase tracking-widest mb-6 text-center">Status</h3>
                <div className="text-center mb-8">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Match Starts In</p>
                  <p className="font-display font-black text-4xl text-primary">{timeLeft || "..."}</p>
                </div>
                {tournament.status !== 'completed' && (
                  <Link href={`/tournaments/${tournament.id}/register`}>
                    <Button className="w-full h-14 font-display uppercase tracking-widest font-bold text-lg animate-pulse-neon rounded-none mb-4" disabled={tournament.filledSlots >= tournament.totalSlots}>
                      {tournament.filledSlots >= tournament.totalSlots ? 'Squad Full' : 'Register Squad'}
                    </Button>
                  </Link>
                )}
                {tournament.roomId && tournament.roomPassword && (
                  <div className="mt-8 pt-6 border-t border-border space-y-4">
                    <p className="text-center text-sm font-bold uppercase tracking-wider text-green-500 mb-2">Room Details Revealed</p>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Room ID</p>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-background border border-border p-3 rounded-none font-mono text-center text-lg">{tournament.roomId}</code>
                        <Button variant="outline" size="icon" className="h-auto w-12 rounded-none" onClick={() => copyToClipboard(tournament.roomId!, 'id')}>
                          {copiedId ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Password</p>
                      <div className="flex gap-2">
                        <code className="flex-1 bg-background border border-border p-3 rounded-none font-mono text-center text-lg">{tournament.roomPassword}</code>
                        <Button variant="outline" size="icon" className="h-auto w-12 rounded-none" onClick={() => copyToClipboard(tournament.roomPassword!, 'pass')}>
                          {copiedPass ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Host Links */}
            <div className="bg-card border border-border p-6">
              <h3 className="font-display font-bold text-xl uppercase tracking-widest mb-6">Host Links</h3>
              <div className="space-y-4">
                {tournament.organiserYoutubeUrl && (
                  <a href={tournament.organiserYoutubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-background border border-border hover:border-red-500 transition-colors group">
                    <Youtube className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                    <span className="font-display uppercase tracking-wider text-sm font-semibold group-hover:text-white">Watch Stream</span>
                  </a>
                )}
                {tournament.organiserDiscordUrl && (
                  <a href={tournament.organiserDiscordUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-background border border-border hover:border-[#5865F2] transition-colors group">
                    <MessageSquare className="w-5 h-5 text-muted-foreground group-hover:text-[#5865F2] transition-colors" />
                    <span className="font-display uppercase tracking-wider text-sm font-semibold group-hover:text-white">Join Discord</span>
                  </a>
                )}
                {!tournament.organiserYoutubeUrl && !tournament.organiserDiscordUrl && (
                  <p className="text-sm text-muted-foreground text-center italic">No host links provided</p>
                )}
              </div>
            </div>

            {/* Sponsor Slot */}
            <div className="bg-card border border-border/40 p-4 text-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-display mb-2">Sponsor Slot</p>
              <div className="h-12 bg-secondary/30 border border-dashed border-border/40 flex items-center justify-center">
                <span className="text-xs text-muted-foreground/40 font-display uppercase tracking-widest">Your Brand Here</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
