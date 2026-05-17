import { Layout } from "@/components/layout";
import { useAuth } from "@clerk/react";
import { useGetCoinBalance, useSpendCoins } from "@workspace/api-client-react";
import { getGetCoinBalanceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Sparkles, Crown, Star, Zap, Gift, Percent, Shield, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const SHOP_ITEMS = [
  {
    id: "profile_border_gold",
    name: "Gold Profile Border",
    description: "Exclusive gold glowing border on your profile card.",
    cost: 500,
    icon: Crown,
    color: "text-yellow-400",
    bg: "from-yellow-500/10 to-yellow-500/5",
    border: "border-yellow-500/30",
    badge: "Cosmetic",
    available: true,
  },
  {
    id: "neon_red_badge",
    name: "Neon Red Badge",
    description: "A rare neon red flair badge displayed next to your name.",
    cost: 800,
    icon: Zap,
    color: "text-red-400",
    bg: "from-red-500/10 to-red-500/5",
    border: "border-red-500/30",
    badge: "Cosmetic",
    available: true,
  },
  {
    id: "champion_effect",
    name: "Champion Effect",
    description: "Animated sparkle effect on your portfolio page.",
    cost: 1200,
    icon: Sparkles,
    color: "text-purple-400",
    bg: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-500/30",
    badge: "Cosmetic",
    available: true,
  },
  {
    id: "elite_theme",
    name: "Elite Profile Theme",
    description: "Unlock the dark elite theme with custom color accents.",
    cost: 2000,
    icon: Star,
    color: "text-blue-400",
    bg: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/30",
    badge: "Premium",
    available: true,
  },
  {
    id: "shield_frame",
    name: "Shield Frame",
    description: "Tactical shield frame overlay on your avatar.",
    cost: 650,
    icon: Shield,
    color: "text-green-400",
    bg: "from-green-500/10 to-green-500/5",
    border: "border-green-500/30",
    badge: "Cosmetic",
    available: true,
  },
  {
    id: "giveaway_entry",
    name: "Giveaway Entry",
    description: "Enter the monthly CZ Coins giveaway for a chance to win prizes.",
    cost: 300,
    icon: Gift,
    color: "text-pink-400",
    bg: "from-pink-500/10 to-pink-500/5",
    border: "border-pink-500/30",
    badge: "Limited",
    available: true,
  },
  {
    id: "discount_coupon",
    name: "10% Discount Coupon",
    description: "A small discount on your next organiser membership plan (one-time use).",
    cost: 1500,
    icon: Percent,
    color: "text-orange-400",
    bg: "from-orange-500/10 to-orange-500/5",
    border: "border-orange-500/30",
    badge: "Limited",
    available: true,
  },
  {
    id: "predator_frame",
    name: "Predator Frame",
    description: "Exclusive red-black predator frame. Only for top-ranked players.",
    cost: 3500,
    icon: Crown,
    color: "text-red-500",
    bg: "from-red-900/20 to-red-900/5",
    border: "border-red-900/50",
    badge: "Exclusive",
    available: false,
  },
] as const;

export default function Shop() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<typeof SHOP_ITEMS[number] | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const { data: coinData, isLoading } = useGetCoinBalance(userId || "", {
    query: { enabled: !!userId, queryKey: getGetCoinBalanceQueryKey(userId || "") }
  });

  const spendCoins = useSpendCoins();

  const handlePurchase = async () => {
    if (!selectedItem || !userId) return;
    setPurchasing(true);
    try {
      await spendCoins.mutateAsync({
        data: { clerkId: userId, amount: selectedItem.cost, itemId: selectedItem.id, itemName: selectedItem.name }
      });
      await queryClient.invalidateQueries({ queryKey: getGetCoinBalanceQueryKey(userId) });
      toast({
        title: "Purchase Successful!",
        description: `${selectedItem.name} has been added to your profile.`,
      });
      setSelectedItem(null);
    } catch {
      toast({
        title: "Purchase Failed",
        description: "Insufficient CZ Coins or server error.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const balance = coinData?.balance ?? 0;

  return (
    <Layout>
      {/* Hero */}
      <div className="relative border-b border-border bg-card overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,60,0.08),transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-4 py-14 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-2 mb-6">
            <Coins className="w-4 h-4 text-yellow-400 animate-pulse" />
            <span className="text-primary font-display uppercase tracking-widest text-xs font-bold">CZ Coins Shop</span>
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl uppercase tracking-widest mb-4 glow-text-red">
            REWARD <span className="text-primary">ARENA</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-display uppercase tracking-wider text-sm mb-6">
            Spend your hard-earned CZ Coins on exclusive cosmetics and profile upgrades.
          </p>

          {/* Coin Balance */}
          {userId && (
            <div className="inline-flex items-center gap-3 bg-card border border-yellow-500/30 px-6 py-3">
              <Coins className="w-6 h-6 text-yellow-400" />
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <span className="font-display font-black text-3xl text-yellow-400">{balance.toLocaleString()}</span>
              )}
              <span className="font-display uppercase tracking-widest text-muted-foreground text-sm">CZ Coins</span>
            </div>
          )}
        </div>
      </div>

      {/* How to Earn */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest text-center mb-4">How to Earn CZ Coins</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: "Tournament Win", amount: "+50", icon: Trophy },
              { label: "MVP Award", amount: "+30", icon: Crown },
              { label: "Daily Login", amount: "+5", icon: Zap },
              { label: "Achievement", amount: "+20", icon: Star },
              { label: "Referral", amount: "+25", icon: Gift },
              { label: "Participation", amount: "+10", icon: Shield },
            ].map(({ label, amount, icon: Icon }) => (
              <div key={label} className="text-center bg-card border border-border p-3">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="font-display font-black text-sm text-yellow-400">{amount}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl uppercase tracking-widest">Cosmetic Store</h2>
            <p className="text-xs text-muted-foreground font-display uppercase tracking-wider mt-1">All items are cosmetic-only. No pay-to-win.</p>
          </div>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/40 font-display uppercase tracking-wider rounded-none">
            {SHOP_ITEMS.length} Items
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SHOP_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const canAfford = balance >= item.cost;
            const isAvailable = item.available;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative bg-gradient-to-b ${item.bg} border ${item.border} overflow-hidden group transition-all hover:scale-[1.02] ${!isAvailable ? 'opacity-60' : ''}`}
              >
                {!isAvailable && (
                  <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs font-display uppercase tracking-wider text-muted-foreground">Locked</p>
                    </div>
                  </div>
                )}

                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className={`text-[9px] font-display uppercase tracking-wider rounded-none ${item.badge === "Exclusive" ? "bg-red-500/10 text-red-400 border-red-500/30" : item.badge === "Limited" ? "bg-orange-500/10 text-orange-400 border-orange-500/30" : item.badge === "Premium" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-secondary text-muted-foreground border-border"}`}>
                    {item.badge}
                  </Badge>
                </div>

                <div className="p-5">
                  <div className={`w-12 h-12 flex items-center justify-center mb-4 border ${item.border}`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className={`font-display font-bold uppercase tracking-wider text-sm mb-1 ${item.color}`}>{item.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{item.description}</p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="font-display font-black text-yellow-400 text-lg">{item.cost.toLocaleString()}</span>
                    </div>
                    {userId ? (
                      <Button
                        size="sm"
                        variant={canAfford ? "default" : "outline"}
                        className={`font-display uppercase tracking-wider rounded-none text-xs ${canAfford ? 'animate-pulse-neon' : 'opacity-50'}`}
                        disabled={!canAfford || !isAvailable}
                        onClick={() => setSelectedItem(item)}
                      >
                        {canAfford ? "Buy" : "Need More"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="font-display uppercase tracking-wider rounded-none text-xs" onClick={() => window.location.href = "/sign-in"}>
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Important Notice */}
        <div className="mt-10 bg-card border border-border p-6">
          <h3 className="font-display font-bold uppercase tracking-widest mb-3 text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Important
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• CZ Coins are <strong>non-refundable</strong> and have no real-world cash value.</li>
            <li>• Cosmetic items are for profile personalization only — no gameplay advantage.</li>
            <li>• Coins <strong>cannot</strong> be used for tournament entries or memberships.</li>
            <li>• Daily login bonuses have cooldowns to prevent grinding abuse.</li>
            <li>• Platform reserves the right to modify coin values with notice.</li>
          </ul>
        </div>
      </div>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="bg-card border-border rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-widest text-primary">Confirm Purchase</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You are about to spend <strong className="text-yellow-400">{selectedItem?.cost.toLocaleString()} CZ Coins</strong> on <strong>{selectedItem?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex items-center gap-4">
            {selectedItem && (
              <div className={`w-16 h-16 flex items-center justify-center border ${selectedItem.border} bg-gradient-to-b ${selectedItem.bg}`}>
                <selectedItem.icon className={`w-8 h-8 ${selectedItem.color}`} />
              </div>
            )}
            <div>
              <p className="font-display font-bold uppercase tracking-wider">{selectedItem?.name}</p>
              <p className="text-xs text-muted-foreground">{selectedItem?.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold">{balance.toLocaleString()} → {(balance - (selectedItem?.cost ?? 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="font-display uppercase tracking-wider rounded-none" onClick={() => setSelectedItem(null)}>Cancel</Button>
            <Button className="font-display uppercase tracking-wider rounded-none animate-pulse-neon" onClick={handlePurchase} disabled={purchasing}>
              {purchasing ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
