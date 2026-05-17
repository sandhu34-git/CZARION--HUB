import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateReport } from "@workspace/api-client-react";
import { useAuth, useUser } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, AlertTriangle, CheckCircle2, Link2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const CATEGORIES = [
  { value: "hacking", label: "Hacking / Wall Hack / Aimbot", icon: "💻" },
  { value: "teaming", label: "Teaming / Collusion", icon: "🤝" },
  { value: "toxic-behaviour", label: "Toxic Behaviour / Abuse", icon: "🤬" },
  { value: "fake-uid", label: "Fake UID / Impersonation", icon: "🪪" },
  { value: "emulator-abuse", label: "Emulator Abuse (vs Mobile)", icon: "🖥️" },
  { value: "room-cheating", label: "Room Cheating / Exploiting", icon: "🏠" },
  { value: "other", label: "Other Violation", icon: "⚠️" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  "hacking": "text-red-400 bg-red-500/10 border-red-500/30",
  "teaming": "text-orange-400 bg-orange-500/10 border-orange-500/30",
  "toxic-behaviour": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  "fake-uid": "text-purple-400 bg-purple-500/10 border-purple-500/30",
  "emulator-abuse": "text-blue-400 bg-blue-500/10 border-blue-500/30",
  "room-cheating": "text-primary bg-primary/10 border-primary/30",
  "other": "text-muted-foreground bg-secondary border-border",
};

const reportSchema = z.object({
  reporterPlayerName: z.string().min(2, "Your in-game name is required"),
  reportedName: z.string().min(2, "Reported player/team name is required"),
  category: z.enum(["hacking", "teaming", "toxic-behaviour", "fake-uid", "emulator-abuse", "room-cheating", "other"]),
  proofUrl: z.string().url("Enter a valid URL (e.g. imgur link)").optional().or(z.literal("")),
  note: z.string().max(500, "Max 500 characters").optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: number;
  tournamentName: string;
  organiserId: string;
}

export function ReportModal({ open, onOpenChange, tournamentId, tournamentName, organiserId }: ReportModalProps) {
  const { userId } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const createReport = useCreateReport();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reporterPlayerName: user?.username || "",
      reportedName: "",
      category: "hacking",
      proofUrl: "",
      note: "",
    },
  });

  const selectedCategory = form.watch("category");

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setSubmitted(false);
      form.reset();
    }, 300);
  };

  const onSubmit = (data: ReportFormValues) => {
    createReport.mutate({
      data: {
        tournamentId,
        organiserId,
        tournamentName,
        reporterUserId: userId || undefined,
        reporterPlayerName: data.reporterPlayerName,
        reportedName: data.reportedName,
        category: data.category,
        proofUrl: data.proofUrl || undefined,
        note: data.note || undefined,
      }
    }, {
      onSuccess: () => {
        setSubmitted(true);
        toast({ title: "✓ Report Submitted", description: "The organiser will review your report." });
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || "Could not submit report. Please try again.";
        toast({ variant: "destructive", title: "Submission Failed", description: msg });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] bg-card border-border rounded-none p-0 gap-0 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-red-500 to-primary" />

        <div className="p-6 border-b border-border bg-secondary/20">
          <DialogTitle className="font-display font-bold text-xl uppercase tracking-widest flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Report Violation
          </DialogTitle>
          <DialogDescription className="font-mono text-xs mt-1">
            Tournament: <span className="text-primary">{tournamentName}</span>
          </DialogDescription>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 flex flex-col items-center justify-center text-center"
          >
            <CheckCircle2 className="w-16 h-16 text-primary mb-4 drop-shadow-[0_0_10px_rgba(255,0,60,0.5)]" />
            <h3 className="font-display font-black text-2xl uppercase tracking-widest mb-2">Report Filed</h3>
            <p className="text-muted-foreground text-sm mb-1">Your report has been submitted to the organiser.</p>
            <p className="text-muted-foreground text-xs mb-6">They will review evidence and take action within 24 hours.</p>
            <Button onClick={handleClose} className="font-display uppercase tracking-wider rounded-none animate-pulse-neon">
              Close
            </Button>
          </motion.div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
              <Alert className="bg-yellow-500/8 border-yellow-500/30 py-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-xs font-mono text-yellow-400/80">
                  False or spam reports may result in action against your account. Only submit genuine violations.
                </AlertDescription>
              </Alert>

              {/* Category Selection */}
              <div className="space-y-2">
                <p className="font-display uppercase tracking-widest text-xs text-muted-foreground font-bold">Violation Category *</p>
                <div className="grid grid-cols-1 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => form.setValue("category", cat.value)}
                      className={`flex items-center gap-3 px-4 py-2.5 border text-left transition-all ${selectedCategory === cat.value ? CATEGORY_COLORS[cat.value] + " border-2" : "border-border/40 bg-background hover:border-primary/30 hover:bg-secondary/50"}`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="font-display uppercase tracking-wider text-xs font-bold">{cat.label}</span>
                      {selectedCategory === cat.value && (
                        <span className="ml-auto text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
                {form.formState.errors.category && (
                  <p className="text-destructive text-xs">{form.formState.errors.category.message}</p>
                )}
              </div>

              {/* Player Names */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="reporterPlayerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-display uppercase tracking-wider text-xs">Your IGN *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your in-game name" className="bg-background rounded-none border-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="reportedName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-display uppercase tracking-wider text-xs">Reported Player/Team *</FormLabel>
                    <FormControl>
                      <Input placeholder="Their IGN or team name" className="bg-background rounded-none border-border" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Proof URL */}
              <FormField control={form.control} name="proofUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-display uppercase tracking-wider text-xs flex items-center gap-2">
                    <Link2 className="w-3 h-3" /> Proof URL (Screenshot / Video)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://imgur.com/... or YouTube link" className="bg-background rounded-none border-border font-mono text-sm" {...field} />
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Upload to Imgur, Discord CDN, or YouTube and paste the link here
                  </p>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Note */}
              <FormField control={form.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-display uppercase tracking-wider text-xs">Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what happened in detail. Include timestamps if it's a video..."
                      className="bg-background rounded-none border-border min-h-[80px] text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-3 pt-2 border-t border-border">
                <Button type="button" variant="ghost" onClick={handleClose} className="font-display uppercase tracking-wider rounded-none">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createReport.isPending}
                  className="flex-1 font-display uppercase tracking-widest font-bold rounded-none animate-pulse-neon h-11"
                >
                  {createReport.isPending ? "Submitting..." : "File Anti-Cheat Report"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const cat = CATEGORIES.find(c => c.value === category);
  return (
    <Badge variant="outline" className={`${CATEGORY_COLORS[category] || CATEGORY_COLORS.other} font-display uppercase tracking-widest text-[10px] rounded-none`}>
      {cat?.icon} {cat?.label || category}
    </Badge>
  );
}
