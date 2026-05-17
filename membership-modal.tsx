import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useListMembershipPlans, usePurchaseMembership, getGetOrganiserQueryKey, getListMembershipPlansQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organiserId: string;
}

const PLAN_BADGES: Record<string, string> = {
  basic: "",
  pro: "Popular",
  elite: "Best Value",
};

export function MembershipModal({ open, onOpenChange, organiserId }: MembershipModalProps) {
  const { data: plans, isLoading } = useListMembershipPlans({ query: { enabled: open, queryKey: getListMembershipPlansQueryKey() } });
  const purchase = usePurchaseMembership();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedPlan) newErrors.plan = "Please select a plan";
    if (!upiId.trim()) newErrors.upiId = "UPI ID is required";
    else if (!upiId.includes("@")) newErrors.upiId = "Enter a valid UPI ID (e.g. user@upi)";
    if (!transactionId.trim()) newErrors.txn = "Transaction ID is required";
    else if (transactionId.trim().length < 6) newErrors.txn = "Enter a valid UTR/Transaction ID";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePurchase = () => {
    if (!validate()) return;

    purchase.mutate({
      data: {
        organiserId,
        planId: selectedPlan!,
        upiId: upiId.trim(),
        transactionId: transactionId.trim(),
        screenshotUrl: ""
      }
    }, {
      onSuccess: () => {
        toast({
          title: "✓ Upgrade Request Submitted",
          description: "We'll verify your payment and activate your plan within 24 hours.",
        });
        onOpenChange(false);
        setSelectedPlan(null);
        setUpiId("");
        setTransactionId("");
        setErrors({});
        queryClient.invalidateQueries({ queryKey: getGetOrganiserQueryKey(organiserId) });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "Could not submit your upgrade request. Please try again.",
        });
      }
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedPlan(null);
    setUpiId("");
    setTransactionId("");
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[820px] bg-card border-border max-h-[92vh] overflow-y-auto p-0 rounded-none gap-0">
        <div className="p-6 border-b border-border bg-secondary/30">
          <DialogTitle className="font-display font-bold text-2xl uppercase tracking-widest flex items-center gap-3">
            <Crown className="text-primary w-6 h-6" /> Upgrade Host Access
          </DialogTitle>
          <DialogDescription className="font-mono text-sm mt-1">
            Unlock more tournaments, scrims, and premium features for your community.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-none" />)}
            </div>
          ) : (
            <>
              {errors.plan && (
                <p className="text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {errors.plan}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans?.map(plan => (
                  <div
                    key={plan.id}
                    className={`relative border p-5 flex flex-col cursor-pointer transition-all duration-200 ${selectedPlan === plan.id
                      ? 'border-primary bg-primary/8 shadow-[0_0_20px_rgba(255,0,60,0.15)]'
                      : 'border-border/60 hover:border-primary/40 bg-background'
                    }`}
                    onClick={() => { setSelectedPlan(plan.id); setErrors(prev => ({ ...prev, plan: "" })); }}
                  >
                    {PLAN_BADGES[plan.id] && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-white font-display uppercase tracking-wider text-[10px] rounded-none px-3">
                          {PLAN_BADGES[plan.id]}
                        </Badge>
                      </div>
                    )}
                    {selectedPlan === plan.id && (
                      <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-primary" />
                    )}

                    <h3 className="font-display font-bold uppercase tracking-wider text-lg mb-1">{plan.name}</h3>
                    <p className="font-display font-black text-3xl text-primary mb-4 glow-text-red">{plan.price}</p>

                    <ul className="space-y-2 mb-2 flex-1">
                      {(plan.features as string[]).map((feature: string, i: number) => (
                        <li key={i} className="text-xs font-mono flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary mt-0.5 shrink-0">▸</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedPlan && (
            <div className="space-y-4 bg-background border border-border p-5">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-display uppercase tracking-widest font-bold text-sm text-primary">Payment Details</h4>
              </div>

              <Alert className="bg-primary/5 border-primary/20 text-foreground py-2">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs font-mono">
                  Pay to UPI: <strong>czarionhub@upi</strong> — Enter your UPI ID and the transaction UTR number below.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-display text-xs uppercase tracking-widest text-muted-foreground">Your UPI ID *</Label>
                  <Input
                    placeholder="yourname@upi"
                    className={`bg-card rounded-none ${errors.upiId ? 'border-destructive' : 'border-border'}`}
                    value={upiId}
                    onChange={e => { setUpiId(e.target.value); setErrors(prev => ({ ...prev, upiId: "" })); }}
                  />
                  {errors.upiId && <p className="text-destructive text-xs">{errors.upiId}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-display text-xs uppercase tracking-widest text-muted-foreground">Transaction ID (UTR) *</Label>
                  <Input
                    placeholder="12-digit UTR number"
                    className={`bg-card rounded-none ${errors.txn ? 'border-destructive' : 'border-border'}`}
                    value={transactionId}
                    onChange={e => { setTransactionId(e.target.value); setErrors(prev => ({ ...prev, txn: "" })); }}
                  />
                  {errors.txn && <p className="text-destructive text-xs">{errors.txn}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} className="font-display uppercase tracking-wider rounded-none">
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!selectedPlan || purchase.isPending}
            className="font-display uppercase tracking-wider font-bold animate-pulse-neon rounded-none px-8"
          >
            {purchase.isPending ? "Processing..." : selectedPlan ? "Submit Upgrade Request" : "Select a Plan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
