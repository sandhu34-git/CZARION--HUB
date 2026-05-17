import { Layout } from "@/components/layout";
import { useCreateTournament } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@clerk/react";
import { ShieldAlert, Crosshair, Calendar, Trophy } from "lucide-react";

const createSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100),
  game: z.string().min(1, "Select a game"),
  status: z.string().min(1, "Select status"),
  prizePool: z.string().min(1, "Prize pool required (e.g. ₹5000)"),
  entryFee: z.string().min(1, "Entry fee required (Use 'Free' or amount)"),
  totalSlots: z.coerce.number().min(2).max(1000),
  matchDate: z.string().min(1, "Date required"),
  description: z.string().optional(),
  rules: z.string().optional(),
  bannerUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  organiserYoutubeUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  organiserDiscordUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function OrganiserCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userId } = useAuth();
  const createTournament = useCreateTournament();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      game: "",
      status: "upcoming",
      prizePool: "₹0",
      entryFee: "Free",
      totalSlots: 100,
      matchDate: new Date().toISOString().slice(0, 16),
      description: "",
      rules: "",
      bannerUrl: "",
      organiserYoutubeUrl: "",
      organiserDiscordUrl: "",
    },
  });

  const onSubmit = (data: CreateFormValues) => {
    if (!userId) return;

    createTournament.mutate({
      data: {
        ...data,
        organiserId: userId,
        matchDate: new Date(data.matchDate).toISOString(), // Ensure ISO string
      }
    }, {
      onSuccess: (res) => {
        toast({
          title: "Tournament Launched",
          description: "Your event is now live on the platform.",
        });
        setLocation(`/organiser/tournament/${res.id}`);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Launch Failed",
          description: "Could not create tournament. Please try again.",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="bg-secondary/30 py-12 border-b border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            <h1 className="font-display font-black text-3xl md:text-5xl uppercase tracking-widest glow-text-red">Launch Event</h1>
          </div>
          <p className="text-muted-foreground font-mono">Deploy a new battle arena to the grid.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-card border border-border p-6 md:p-8 neon-border relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 relative z-10">
              
              <div className="space-y-6">
                <h3 className="font-display font-bold text-xl uppercase tracking-widest border-b border-border/50 pb-2 text-primary flex items-center gap-2">
                  <Crosshair className="w-5 h-5" /> Basic Intel
                </h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-display uppercase tracking-wider">Operation Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CZARION Pro League Season 1" className="bg-background rounded-none border-border" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="game"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider">Target Title *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background rounded-none border-border font-display uppercase tracking-wider">
                              <SelectValue placeholder="Select Game" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Free Fire">Free Fire</SelectItem>
                            <SelectItem value="BGMI">BGMI</SelectItem>
                            <SelectItem value="Valorant">Valorant</SelectItem>
                            <SelectItem value="COD Mobile">COD Mobile</SelectItem>
                            <SelectItem value="Clash Squad">Clash Squad</SelectItem>
                            <SelectItem value="Custom Scrims">Custom Scrims</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider">Initial Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background rounded-none border-border font-display uppercase tracking-wider">
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="upcoming">Upcoming (Registrations Open)</SelectItem>
                            <SelectItem value="live">Live Now</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-display font-bold text-xl uppercase tracking-widest border-b border-border/50 pb-2 text-primary flex items-center gap-2">
                  <Trophy className="w-5 h-5" /> Stakes & Logistics
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="prizePool"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider">Prize Pool *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ₹5000" className="bg-background rounded-none border-border font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider">Entry Fee *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Free or ₹100" className="bg-background rounded-none border-border font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="totalSlots"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider">Total Slots *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" className="bg-background rounded-none border-border font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="matchDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider">Match Date & Time *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" className="bg-background rounded-none border-border font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bannerUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider">Banner Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." className="bg-background rounded-none border-border font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-display font-bold text-xl uppercase tracking-widest border-b border-border/50 pb-2 text-primary flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Details & Comms
                </h3>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-display uppercase tracking-wider">Description / Schedule</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tournament format, schedule, etc..." className="bg-background rounded-none border-border min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-display uppercase tracking-wider">Rules of Engagement</FormLabel>
                      <FormControl>
                        <Textarea placeholder="1. No hacking..." className="bg-background rounded-none border-border min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="organiserYoutubeUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider">Stream URL (YouTube)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://youtube.com/..." className="bg-background rounded-none border-border font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="organiserDiscordUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-display uppercase tracking-wider">Discord Invite URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://discord.gg/..." className="bg-background rounded-none border-border font-mono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="pt-8 flex justify-end gap-4 border-t border-border/50">
                <Button variant="ghost" type="button" onClick={() => setLocation("/organiser")} className="font-display uppercase tracking-wider">Abort</Button>
                <Button 
                  type="submit" 
                  className="h-12 px-8 font-display text-lg uppercase tracking-widest font-bold rounded-none animate-pulse-neon"
                  disabled={createTournament.isPending}
                >
                  {createTournament.isPending ? "Deploying..." : "Initialize Event"}
                </Button>
              </div>

            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
