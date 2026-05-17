import { Layout } from "@/components/layout";
import { useGetTournament, useCreateRegistration, useEnsurePlayer, useListRegistrations, getListRegistrationsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth } from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2, ChevronLeft, Users, Trophy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const registerSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters").max(50),
  leaderName: z.string().min(2, "Your real name is required"),
  leaderUid: z.string().min(5, "Valid Game UID is required (min 5 digits)"),
  leaderPlayerName: z.string().min(2, "In-game name is required"),
  player1Name: z.string().optional(),
  player1Uid: z.string().optional(),
  player2Name: z.string().optional(),
  player2Uid: z.string().optional(),
  player3Name: z.string().optional(),
  player3Uid: z.string().optional(),
  player4Name: z.string().optional(),
  player4Uid: z.string().optional(),
  subPlayerName: z.string().optional(),
  subPlayerUid: z.string().optional(),
  whatsappNumber: z.string().min(10, "Enter a valid WhatsApp number (min 10 digits)"),
  discordUsername: z.string().min(2, "Discord username is required"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function TournamentRegister() {
  const { id } = useParams<{ id: string }>();
  const tournamentId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { user } = useUser();
  const { userId } = useAuth();
  const ensuredRef = useRef(false);

  const { data: tournament, isLoading: loadingTournament } = useGetTournament(tournamentId);
  const createRegistration = useCreateRegistration();
  const ensurePlayer = useEnsurePlayer();

  const { data: existingRegs } = useListRegistrations(
    { tournamentId, userId: userId || "" },
    { query: { enabled: !!userId && !!tournamentId, queryKey: getListRegistrationsQueryKey({ tournamentId, userId: userId || "" }) } }
  );

  const [isSuccess, setIsSuccess] = useState(false);

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

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      teamName: "", leaderName: "", leaderUid: "", leaderPlayerName: "",
      player1Name: "", player1Uid: "", player2Name: "", player2Uid: "",
      player3Name: "", player3Uid: "", player4Name: "", player4Uid: "",
      subPlayerName: "", subPlayerUid: "", whatsappNumber: "", discordUsername: "",
    },
  });

  const alreadyRegistered = existingRegs && existingRegs.length > 0;

  const onSubmit = (data: RegisterFormValues) => {
    if (!userId) return;
    if (alreadyRegistered) {
      toast({ variant: "destructive", title: "Already Registered", description: "Your squad is already in this tournament." });
      return;
    }

    createRegistration.mutate({
      data: { tournamentId, userId, ...data }
    }, {
      onSuccess: () => {
        setIsSuccess(true);
        toast({ title: "✓ Squad Deployed!", description: "Registration submitted. Await organiser approval." });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || "Could not submit registration. Please try again.";
        toast({ variant: "destructive", title: "Registration Failed", description: msg });
      }
    });
  };

  if (loadingTournament) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <Skeleton className="h-20 w-full mb-8 rounded-none" />
          <Skeleton className="h-96 w-full rounded-none" />
        </div>
      </Layout>
    );
  }

  if (isSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 max-w-lg text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-primary/50 p-10 flex flex-col items-center shadow-[0_0_30px_rgba(255,0,60,0.1)]"
          >
            <CheckCircle2 className="w-16 h-16 text-primary mb-5 drop-shadow-[0_0_10px_rgba(255,0,60,0.5)]" />
            <h1 className="font-display font-black text-3xl uppercase tracking-widest mb-3 glow-text-red">Squad Locked In</h1>
            <p className="text-muted-foreground text-sm mb-2">
              Your registration for <strong className="text-foreground">{tournament?.name}</strong> has been submitted.
            </p>
            <p className="text-muted-foreground text-xs mb-8">The organiser will review your application. Check your dashboard for status updates.</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button onClick={() => setLocation("/dashboard")} className="font-display uppercase tracking-wider rounded-none animate-pulse-neon flex-1">
                Go to Dashboard
              </Button>
              <Button onClick={() => setLocation("/tournaments")} variant="outline" className="font-display uppercase tracking-wider rounded-none flex-1">
                Browse More
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  const isFull = tournament && tournament.filledSlots >= tournament.totalSlots;

  return (
    <Layout>
      {/* Header */}
      <div className="bg-secondary/30 border-b border-border py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground text-xs font-display uppercase tracking-widest">
            <Link href={`/tournaments/${tournamentId}`} className="hover:text-primary flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Back to Tournament
            </Link>
          </div>
          <h1 className="font-display font-black text-2xl md:text-4xl uppercase tracking-widest mb-2">Register Squad</h1>
          {tournament && (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-primary font-display tracking-wider font-bold">{tournament.name}</p>
              <Badge variant="outline" className="bg-secondary border-border uppercase font-display tracking-widest rounded-none text-xs">{tournament.game}</Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                <Users className="w-3 h-3" /> {tournament.filledSlots}/{tournament.totalSlots} slots filled
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Already Registered Warning */}
        {alreadyRegistered && (
          <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="font-display uppercase tracking-wider font-bold text-yellow-500">Already Registered</AlertTitle>
            <AlertDescription className="text-yellow-400/80">
              Your squad is already registered for this tournament. Check your{" "}
              <Link href="/dashboard" className="underline hover:text-yellow-300">dashboard</Link> for status.
            </AlertDescription>
          </Alert>
        )}

        {/* Full Warning */}
        {isFull && !alreadyRegistered && (
          <Alert className="mb-6 bg-destructive/10 border-destructive/50">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertTitle className="font-display uppercase tracking-wider font-bold text-destructive">Tournament Full</AlertTitle>
            <AlertDescription>All slots are filled. You can no longer register for this tournament.</AlertDescription>
          </Alert>
        )}

        {/* Paid tournament warning */}
        {tournament?.entryFee && tournament.entryFee !== "0" && tournament.entryFee.toLowerCase() !== "free" && (
          <Alert className="mb-6 bg-yellow-500/8 border-yellow-500/40">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle className="font-display uppercase tracking-wider font-bold text-yellow-500">Paid Tournament — Entry: {tournament.entryFee}</AlertTitle>
            <AlertDescription className="text-yellow-400/80">
              After registration approval, the organiser will contact you via WhatsApp/Discord for payment.
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-card border border-border relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-red-400 to-transparent" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">

              {/* Squad Details */}
              <Section title="Squad Intel" icon={<Trophy className="w-4 h-4" />}>
                <FormField control={form.control} name="teamName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-display uppercase tracking-wider text-xs">Team Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. CZARION SQUAD" className="bg-background rounded-none border-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </Section>

              {/* Leader Details */}
              <Section title="Squad Leader" icon={<ShieldAlert className="w-4 h-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="leaderName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-display uppercase tracking-wider text-xs">Real Name *</FormLabel>
                      <FormControl><Input placeholder="Full name" className="bg-background rounded-none border-border" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="leaderUid" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-display uppercase tracking-wider text-xs">Game UID *</FormLabel>
                      <FormControl><Input placeholder="1234567890" className="bg-background rounded-none border-border font-mono" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="leaderPlayerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-display uppercase tracking-wider text-xs">In-Game Name *</FormLabel>
                      <FormControl><Input placeholder="Player_Name" className="bg-background rounded-none border-border" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </Section>

              {/* Contact */}
              <Section title="Contact Info" icon={<Users className="w-4 h-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="whatsappNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-display uppercase tracking-wider text-xs">WhatsApp Number *</FormLabel>
                      <FormControl><Input placeholder="+91 9876543210" className="bg-background rounded-none border-border" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="discordUsername" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-display uppercase tracking-wider text-xs">Discord Username *</FormLabel>
                      <FormControl><Input placeholder="username#0000" className="bg-background rounded-none border-border" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </Section>

              {/* Roster */}
              <Section title="Roster (Optional)" icon={<Users className="w-4 h-4" />}>
                <p className="text-xs text-muted-foreground mb-4">Add your remaining team members. Leave blank if not applicable.</p>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="p-3 bg-background border border-border/40">
                      <p className="font-display uppercase tracking-widest text-muted-foreground text-[10px] mb-3 font-bold">Player {num}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name={`player${num}Name` as any} render={({ field }) => (
                          <FormItem>
                            <FormControl><Input placeholder="In-game name" className="bg-card rounded-none border-border/50 h-9 text-sm" {...field} /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`player${num}Uid` as any} render={({ field }) => (
                          <FormItem>
                            <FormControl><Input placeholder="Game UID" className="bg-card rounded-none border-border/50 h-9 font-mono text-sm" {...field} /></FormControl>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-background border border-primary/20">
                    <p className="font-display uppercase tracking-widest text-primary text-[10px] mb-3 font-bold">Substitute</p>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="subPlayerName" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Sub in-game name" className="bg-card rounded-none border-border/50 h-9 text-sm" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name="subPlayerUid" render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Sub game UID" className="bg-card rounded-none border-border/50 h-9 font-mono text-sm" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              </Section>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-14 font-display text-base uppercase tracking-widest font-bold rounded-none animate-pulse-neon"
                  disabled={createRegistration.isPending || !!alreadyRegistered || !!isFull}
                >
                  {createRegistration.isPending ? "Deploying Squad..." : alreadyRegistered ? "Already Registered" : isFull ? "Tournament Full" : "Deploy Squad →"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display font-bold text-base uppercase tracking-widest border-b border-border/50 pb-2 text-primary flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}
