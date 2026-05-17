import { Layout } from "@/components/layout";
import {
  useGetTournament, useUpdateTournamentRoom, useListRegistrations,
  useUpdateRegistrationStatus, useUpdateTournament, useCreateResult,
  useListReports, useUpdateReport, useDeleteReport,
  getListRegistrationsQueryKey, getGetTournamentQueryKey,
  getGetOrganiserQueryKey, getListReportsQueryKey,
} from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, KeySquare, Check, X, ShieldAlert, Trophy, AlertTriangle, ChevronLeft, Flag, ShieldX, AlertOctagon, Ban, CheckCircle2, Trash2, ExternalLink, Eye } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { CategoryBadge } from "@/components/report-modal";
import { format, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const roomSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
  roomPassword: z.string().min(1, "Password is required"),
});

const resultsSchema = z.object({
  winnerTeamName: z.string().min(1, "Winner team name is required"),
  secondTeamName: z.string().optional(),
  thirdTeamName: z.string().optional(),
  mvpPlayerName: z.string().optional(),
  mvpKills: z.coerce.number().optional(),
  highlightNote: z.string().optional(),
});

type RoomFormValues = z.infer<typeof roomSchema>;
type ResultsFormValues = z.infer<typeof resultsSchema>;

export default function OrganiserTournament() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: tournament, isLoading: tourLoading } = useGetTournament(tournamentId, {
    query: { enabled: !!tournamentId, queryKey: getGetTournamentQueryKey(tournamentId) }
  });
  const { data: registrations, isLoading: regLoading } = useListRegistrations(
    { tournamentId },
    { query: { enabled: !!tournamentId, queryKey: getListRegistrationsQueryKey({ tournamentId }) } }
  );
  const { data: reports, isLoading: reportsLoading } = useListReports(
    { tournamentId, organiserId: tournament?.organiserId },
    { query: { enabled: !!tournamentId && !!tournament?.organiserId, queryKey: getListReportsQueryKey({ tournamentId, organiserId: tournament?.organiserId }) } }
  );

  const updateRoom = useUpdateTournamentRoom();
  const updateStatus = useUpdateRegistrationStatus();
  const updateTournament = useUpdateTournament();
  const createResult = useCreateResult();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();

  const roomForm = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    values: { roomId: tournament?.roomId || "", roomPassword: tournament?.roomPassword || "" },
  });

  const resultsForm = useForm<ResultsFormValues>({
    resolver: zodResolver(resultsSchema),
    defaultValues: { winnerTeamName: "", secondTeamName: "", thirdTeamName: "", mvpPlayerName: "", highlightNote: "" },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListRegistrationsQueryKey({ tournamentId }) });
    queryClient.invalidateQueries({ queryKey: getGetTournamentQueryKey(tournamentId) });
  };

  const invalidateReports = () => {
    if (tournament?.organiserId) {
      queryClient.invalidateQueries({ queryKey: getListReportsQueryKey({ tournamentId, organiserId: tournament.organiserId }) });
    }
  };

  const handleReportAction = (reportId: number, action: "warned" | "disqualified" | "banned" | "dismissed") => {
    updateReport.mutate({ id: reportId, data: { status: "resolved", action } }, {
      onSuccess: () => {
        toast({ title: `✓ Action Applied`, description: `Player has been ${action}.` });
        invalidateReports();
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Could not apply action." }),
    });
  };

  const handleReportStatus = (reportId: number, status: "pending" | "reviewed" | "resolved") => {
    updateReport.mutate({ id: reportId, data: { status } }, {
      onSuccess: () => {
        toast({ title: "✓ Status Updated" });
        invalidateReports();
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Could not update status." }),
    });
  };

  const handleDeleteReport = (reportId: number) => {
    deleteReport.mutate({ id: reportId }, {
      onSuccess: () => {
        toast({ title: "✓ Report Deleted", description: "Spam report has been removed." });
        invalidateReports();
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Could not delete report." }),
    });
  };

  const onRoomSubmit = (data: RoomFormValues) => {
    updateRoom.mutate({ id: tournamentId, data }, {
      onSuccess: () => {
        toast({ title: "✓ Room Details Updated", description: "Approved squads can now see the room credentials." });
        invalidate();
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Failed to update room details." }),
    });
  };

  const handleStatusUpdate = (regId: number, status: "approved" | "rejected") => {
    updateStatus.mutate({ id: regId, data: { status } }, {
      onSuccess: () => {
        invalidate();
        toast({ title: `Squad ${status === "approved" ? "Approved" : "Rejected"}`, description: `Registration status updated.` });
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Could not update registration." }),
    });
  };

  const handleMarkCompleted = () => {
    updateTournament.mutate({ id: tournamentId, data: { status: "completed" } }, {
      onSuccess: () => {
        toast({ title: "✓ Tournament Completed", description: "You can now post the official results." });
        invalidate();
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Could not mark tournament as completed." }),
    });
  };

  const onResultsSubmit = (data: ResultsFormValues) => {
    createResult.mutate({
      data: {
        tournamentId,
        winnerTeamName: data.winnerTeamName,
        secondTeamName: data.secondTeamName || undefined,
        thirdTeamName: data.thirdTeamName || undefined,
        mvpPlayerName: data.mvpPlayerName || undefined,
        mvpKills: data.mvpKills || undefined,
        highlightNote: data.highlightNote || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "✓ Results Posted", description: "Official results are now live on the platform." });
        resultsForm.reset();
        setLocation("/results");
      },
      onError: () => toast({ variant: "destructive", title: "Error", description: "Could not post results." }),
    });
  };

  if (tourLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <Skeleton className="h-24 w-full mb-6 rounded-none" />
          <Skeleton className="h-96 w-full rounded-none" />
        </div>
      </Layout>
    );
  }

  if (!tournament) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display font-bold text-3xl uppercase tracking-widest text-destructive mb-4">Tournament Not Found</h1>
          <Link href="/organiser">
            <Button variant="outline" className="font-display uppercase tracking-wider rounded-none">Back to Command Center</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const pendingRegs = registrations?.filter(r => r.status === "pending") || [];
  const approvedRegs = registrations?.filter(r => r.status === "approved") || [];
  const isCompleted = tournament.status === "completed";

  return (
    <Layout>
      <div className="bg-secondary/20 border-b border-border">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground text-xs font-display uppercase tracking-widest">
            <Link href="/organiser" className="hover:text-primary flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Command Center
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{tournament.name}</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display font-black text-2xl md:text-3xl uppercase tracking-widest line-clamp-1">{tournament.name}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-background border-border uppercase font-display tracking-widest rounded-none text-xs">{tournament.game}</Badge>
                <Badge variant="outline" className={`uppercase font-display tracking-widest rounded-none text-xs ${isCompleted ? 'bg-muted text-muted-foreground border-border' : tournament.status === 'live' ? 'bg-primary/20 text-primary border-primary/50 animate-pulse' : 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50'}`}>
                  {tournament.status}
                </Badge>
                <Badge variant="outline" className="bg-background border-border uppercase font-display tracking-widest rounded-none text-xs">
                  {tournament.filledSlots}/{tournament.totalSlots} Slots
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {!isCompleted && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="font-display uppercase tracking-wider rounded-none border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                      <Flag className="w-4 h-4 mr-2" /> Mark Complete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border rounded-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display uppercase tracking-widest">Mark as Completed?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will close registrations and allow you to post official results. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-display uppercase tracking-wider rounded-none">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleMarkCompleted} className="font-display uppercase tracking-wider rounded-none bg-primary hover:bg-primary/90">
                        {updateTournament.isPending ? "Processing..." : "Confirm"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="registrations" className="w-full">
          <TabsList className="bg-card border border-border rounded-none mb-8 w-full sm:w-auto flex-wrap h-auto">
            <TabsTrigger value="registrations" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
              <Users className="w-3 h-3 mr-1" /> Squads ({registrations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="room" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
              <KeySquare className="w-3 h-3 mr-1" /> Room Details
            </TabsTrigger>
            <TabsTrigger value="results" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm">
              <Trophy className="w-3 h-3 mr-1" /> Post Results
            </TabsTrigger>
            <TabsTrigger value="reports" className="font-display uppercase tracking-widest rounded-none data-[state=active]:bg-primary data-[state=active]:text-white text-xs sm:text-sm relative">
              <ShieldAlert className="w-3 h-3 mr-1" /> Reports
              {(reports?.length ?? 0) > 0 && (
                <span className="ml-1.5 bg-primary text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none data-[state=active]:bg-white data-[state=active]:text-primary">
                  {reports?.filter(r => r.status === 'pending').length || 0}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* REGISTRATIONS TAB */}
          <TabsContent value="registrations">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Pending */}
                <div>
                  <h3 className="font-display font-bold text-lg uppercase tracking-widest flex items-center gap-2 border-b border-border pb-3 mb-4">
                    <ShieldAlert className="w-4 h-4 text-yellow-500" />
                    <span>Pending Approvals</span>
                    <span className="text-yellow-500 ml-auto">({pendingRegs.length})</span>
                  </h3>
                  {regLoading ? <Skeleton className="h-28 w-full rounded-none" /> :
                    pendingRegs.length > 0 ? (
                      <div className="space-y-3">
                        {pendingRegs.map((reg, idx) => (
                          <motion.div
                            key={reg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-card border border-yellow-500/20 p-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-display font-bold text-base uppercase tracking-wider">{reg.teamName}</h4>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                  Leader: {reg.leaderPlayerName} • UID: {reg.leaderUid}
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button size="sm" variant="outline" className="border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white rounded-none h-8 w-8 p-0" onClick={() => handleStatusUpdate(reg.id, "approved")} title="Approve">
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-white rounded-none h-8 w-8 p-0" onClick={() => handleStatusUpdate(reg.id, "rejected")} title="Reject">
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-muted-foreground bg-background border border-border/30 p-2">
                              <div>WhatsApp: <span className="text-foreground">{reg.whatsappNumber}</span></div>
                              <div>Discord: <span className="text-foreground">{reg.discordUsername}</span></div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic bg-card/50 p-5 border border-dashed border-border text-center">No pending registrations.</p>
                    )}
                </div>

                {/* Approved */}
                <div>
                  <h3 className="font-display font-bold text-lg uppercase tracking-widest flex items-center gap-2 border-b border-border pb-3 mb-4">
                    <Users className="w-4 h-4 text-green-500" />
                    <span>Approved Squads</span>
                    <span className="text-green-500 ml-auto">({approvedRegs.length}/{tournament.totalSlots})</span>
                  </h3>
                  {regLoading ? <Skeleton className="h-20 w-full rounded-none" /> :
                    approvedRegs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {approvedRegs.map(reg => (
                          <div key={reg.id} className="bg-card border border-border p-3 flex justify-between items-center hover:border-green-500/30 transition-colors">
                            <div>
                              <p className="font-display font-bold uppercase tracking-wider text-sm">{reg.teamName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{reg.leaderPlayerName}</p>
                            </div>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30 rounded-none uppercase text-[10px] shrink-0">Active</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic bg-card/50 p-5 border border-dashed border-border text-center">No approved squads yet.</p>
                    )}
                </div>
              </div>

              {/* Sidebar */}
              <div>
                <div className="bg-card border border-border p-5 sticky top-20">
                  <h3 className="font-display font-bold text-base uppercase tracking-widest mb-4 border-b border-border pb-3">Capacity Status</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Total Slots", value: tournament.totalSlots, color: "text-foreground" },
                      { label: "Approved", value: tournament.filledSlots, color: "text-green-500" },
                      { label: "Pending", value: pendingRegs.length, color: "text-yellow-500" },
                      { label: "Available", value: tournament.totalSlots - tournament.filledSlots, color: "text-primary font-bold" },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between text-sm font-mono border-b border-border/30 pb-2">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className={row.color}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-red-600 transition-all"
                        style={{ width: `${Math.min((tournament.filledSlots / tournament.totalSlots) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right font-mono">
                      {Math.round((tournament.filledSlots / tournament.totalSlots) * 100)}% filled
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ROOM TAB */}
          <TabsContent value="room">
            <div className="max-w-xl bg-card border border-border p-7">
              <div className="flex items-center gap-3 mb-6">
                <KeySquare className="w-7 h-7 text-primary" />
                <div>
                  <h2 className="font-display font-bold text-xl uppercase tracking-widest">Room Credentials</h2>
                  <p className="text-muted-foreground text-xs font-mono">Only approved squads can view these</p>
                </div>
              </div>

              {tournament.roomId && (
                <div className="mb-6 p-3 bg-primary/5 border border-primary/20 text-xs font-mono text-primary">
                  ✓ Room details are currently set and visible to approved players.
                </div>
              )}

              <Form {...roomForm}>
                <form onSubmit={roomForm.handleSubmit(onRoomSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField control={roomForm.control} name="roomId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider text-xs">Room ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 7891234" className="bg-background rounded-none border-border font-mono text-lg tracking-widest" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={roomForm.control} name="roomPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider text-xs">Password</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. czarion123" className="bg-background rounded-none border-border font-mono text-lg tracking-widest" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="submit" disabled={updateRoom.isPending} className="w-full h-11 font-display uppercase tracking-widest font-bold rounded-none animate-pulse-neon">
                    {updateRoom.isPending ? "Transmitting..." : "Update & Broadcast"}
                  </Button>
                </form>
              </Form>
            </div>
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results">
            {!isCompleted ? (
              <div className="py-16 text-center border border-dashed border-border bg-card/30 max-w-lg">
                <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-4 opacity-70" />
                <h3 className="font-display text-lg font-bold uppercase tracking-wider mb-2">Tournament Still Active</h3>
                <p className="text-muted-foreground text-sm mb-6">Mark the tournament as Completed first to unlock the results interface.</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="font-display uppercase tracking-wider rounded-none animate-pulse-neon">
                      <Flag className="w-4 h-4 mr-2" /> Mark as Completed
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border rounded-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display uppercase tracking-widest">Mark as Completed?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will close registrations and unlock the results posting interface.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-none font-display uppercase tracking-wider">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleMarkCompleted} className="rounded-none font-display uppercase tracking-wider bg-primary hover:bg-primary/90">
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="max-w-2xl bg-card border border-border p-7">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="w-7 h-7 text-yellow-400" />
                  <div>
                    <h2 className="font-display font-bold text-xl uppercase tracking-widest">Post Official Results</h2>
                    <p className="text-muted-foreground text-xs font-mono">Results will appear publicly on the Combat Reports page</p>
                  </div>
                </div>

                <Form {...resultsForm}>
                  <form onSubmit={resultsForm.handleSubmit(onResultsSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-display uppercase tracking-widest text-sm text-primary border-b border-border pb-2">Placement Results</h4>
                      <FormField control={resultsForm.control} name="winnerTeamName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-display uppercase tracking-wider text-xs">🥇 Champion Team *</FormLabel>
                          <FormControl>
                            <Input placeholder="Winning team name" className="bg-background rounded-none border-border" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={resultsForm.control} name="secondTeamName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-display uppercase tracking-wider text-xs">🥈 Runner Up</FormLabel>
                            <FormControl>
                              <Input placeholder="2nd place team" className="bg-background rounded-none border-border" {...field} />
                            </FormControl>
                          </FormItem>
                        )} />
                        <FormField control={resultsForm.control} name="thirdTeamName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-display uppercase tracking-wider text-xs">🥉 Third Place</FormLabel>
                            <FormControl>
                              <Input placeholder="3rd place team" className="bg-background rounded-none border-border" {...field} />
                            </FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-display uppercase tracking-widest text-sm text-primary border-b border-border pb-2">MVP Award</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={resultsForm.control} name="mvpPlayerName" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-display uppercase tracking-wider text-xs">MVP Player Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Player's in-game name" className="bg-background rounded-none border-border" {...field} />
                            </FormControl>
                          </FormItem>
                        )} />
                        <FormField control={resultsForm.control} name="mvpKills" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-display uppercase tracking-wider text-xs">MVP Kill Count</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g. 14" className="bg-background rounded-none border-border font-mono" {...field} />
                            </FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </div>

                    <FormField control={resultsForm.control} name="highlightNote" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider text-xs">Highlight Note (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any notable moments or highlights from the tournament..." className="bg-background rounded-none border-border min-h-[80px]" {...field} />
                        </FormControl>
                      </FormItem>
                    )} />

                    <Button type="submit" disabled={createResult.isPending} className="w-full h-12 font-display uppercase tracking-widest font-bold rounded-none animate-pulse-neon">
                      {createResult.isPending ? "Publishing..." : "Publish Official Results"}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </TabsContent>

          {/* REPORTS TAB */}
          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-5">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-primary" />
                  <div>
                    <h2 className="font-display font-bold text-lg uppercase tracking-widest">Anti-Cheat Reports</h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Only you (the organiser) can see these reports</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: "Pending", count: reports?.filter(r => r.status === 'pending').length ?? 0, color: "text-yellow-500" },
                    { label: "Reviewed", count: reports?.filter(r => r.status === 'reviewed').length ?? 0, color: "text-blue-400" },
                    { label: "Resolved", count: reports?.filter(r => r.status === 'resolved').length ?? 0, color: "text-green-500" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-background border border-border px-3 py-1.5 text-center min-w-[70px]">
                      <p className={`font-display font-black text-lg ${stat.color}`}>{stat.count}</p>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report Cards */}
              {reportsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-none" />)}
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report, idx) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className={`bg-card border overflow-hidden ${
                        report.status === 'pending' ? 'border-yellow-500/30' :
                        report.status === 'reviewed' ? 'border-blue-500/30' :
                        'border-border'
                      }`}
                    >
                      {/* Report Header */}
                      <div className="p-4 border-b border-border/50 bg-secondary/10 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
                        <div className="flex flex-wrap items-center gap-2">
                          <CategoryBadge category={report.category} />
                          <Badge variant="outline" className={`rounded-none uppercase font-display tracking-widest text-[10px] ${
                            report.status === 'pending' ? 'text-yellow-500 border-yellow-500/40 bg-yellow-500/10' :
                            report.status === 'reviewed' ? 'text-blue-400 border-blue-400/40 bg-blue-400/10' :
                            'text-green-500 border-green-500/40 bg-green-500/10'
                          }`}>
                            {report.status}
                          </Badge>
                          {report.action && (
                            <Badge variant="outline" className={`rounded-none uppercase font-display tracking-widest text-[10px] ${
                              report.action === 'banned' ? 'text-destructive border-destructive/40 bg-destructive/10' :
                              report.action === 'warned' ? 'text-orange-400 border-orange-400/40 bg-orange-400/10' :
                              report.action === 'disqualified' ? 'text-red-400 border-red-400/40 bg-red-400/10' :
                              'text-muted-foreground border-border bg-secondary'
                            }`}>
                              ⚡ {report.action}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {format(parseISO(report.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>

                      {/* Report Body */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 text-sm font-mono">
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[110px]">Reporter:</span>
                            <span className="text-foreground font-bold">{report.reporterPlayerName}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-muted-foreground min-w-[110px]">Reported:</span>
                            <span className="text-primary font-bold">{report.reportedName}</span>
                          </div>
                          {report.note && (
                            <div className="mt-2 p-2 bg-background border border-border/30 text-xs text-muted-foreground italic">
                              "{report.note}"
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {report.proofUrl && (
                            <a
                              href={report.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-primary hover:underline font-mono p-2 bg-primary/5 border border-primary/20 truncate"
                            >
                              <Eye className="w-3 h-3 shrink-0" />
                              <span className="truncate">View Evidence</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}

                          {/* Status Update */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-display">Status:</span>
                            <Select
                              value={report.status}
                              onValueChange={(val) => handleReportStatus(report.id, val as "pending" | "reviewed" | "resolved")}
                            >
                              <SelectTrigger className="h-7 text-xs bg-background border-border rounded-none flex-1 font-display uppercase tracking-wider">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border rounded-none">
                                <SelectItem value="pending" className="font-display uppercase text-xs tracking-wider text-yellow-500">Pending</SelectItem>
                                <SelectItem value="reviewed" className="font-display uppercase text-xs tracking-wider text-blue-400">Reviewed</SelectItem>
                                <SelectItem value="resolved" className="font-display uppercase text-xs tracking-wider text-green-500">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-border/30 pt-3">
                        <p className="w-full text-[10px] text-muted-foreground uppercase tracking-widest font-display mb-1">Moderation Actions:</p>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={report.action === 'warned' || updateReport.isPending}
                          onClick={() => handleReportAction(report.id, 'warned')}
                          className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10 rounded-none text-xs font-display uppercase tracking-wider h-8"
                        >
                          <AlertOctagon className="w-3 h-3 mr-1.5" /> Warn
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={report.action === 'disqualified' || updateReport.isPending}
                          onClick={() => handleReportAction(report.id, 'disqualified')}
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-none text-xs font-display uppercase tracking-wider h-8"
                        >
                          <ShieldX className="w-3 h-3 mr-1.5" /> Disqualify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={report.action === 'banned' || updateReport.isPending}
                          onClick={() => handleReportAction(report.id, 'banned')}
                          className="border-destructive/50 text-destructive hover:bg-destructive/10 rounded-none text-xs font-display uppercase tracking-wider h-8"
                        >
                          <Ban className="w-3 h-3 mr-1.5" /> Ban
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={report.action === 'dismissed' || updateReport.isPending}
                          onClick={() => handleReportAction(report.id, 'dismissed')}
                          className="border-border text-muted-foreground hover:bg-secondary rounded-none text-xs font-display uppercase tracking-wider h-8"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1.5" /> Dismiss
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive rounded-none text-xs font-display uppercase tracking-wider h-8 ml-auto"
                            >
                              <Trash2 className="w-3 h-3 mr-1.5" /> Delete Spam
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border rounded-none">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-display uppercase tracking-widest">Delete Report?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this report. Only delete if it is spam or invalid. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-none font-display uppercase tracking-wider">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteReport(report.id)} className="rounded-none font-display uppercase tracking-wider bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 border border-dashed border-border/50 bg-card/20">
                  <ShieldAlert className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
                  <h3 className="font-display text-xl font-bold uppercase tracking-wider mb-2">No Reports Filed</h3>
                  <p className="text-muted-foreground text-sm">Players from this tournament haven't submitted any violation reports yet.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
