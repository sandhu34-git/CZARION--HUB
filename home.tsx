import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetTournamentStats, useListFeaturedTournaments } from "@workspace/api-client-react";
import { TournamentCard } from "@/components/tournament-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trophy, Crosshair, Users, Gamepad2, ChevronRight, Flame, Shield, Zap } from "lucide-react";

const GAMES = [
  { name: "Free Fire", icon: "🔥", color: "from-orange-600/20 to-orange-500/5" },
  { name: "BGMI", icon: "🎖️", color: "from-yellow-600/20 to-yellow-500/5" },
  { name: "Valorant", icon: "⚔️", color: "from-red-600/20 to-red-500/5" },
  { name: "COD Mobile", icon: "🪖", color: "from-slate-600/20 to-slate-500/5" },
  { name: "Clash Squad", icon: "🏹", color: "from-primary/20 to-primary/5" },
  { name: "Custom Scrims", icon: "🎯", color: "from-purple-600/20 to-purple-500/5" },
];

export default function Home() {
  const { data: stats, isLoading: statsLoading } = useGetTournamentStats();
  const { data: featured, isLoading: featuredLoading } = useListFeaturedTournaments();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,0,60,0.15),transparent)]" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070')] bg-cover bg-center opacity-[0.08] mix-blend-luminosity" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-2 mb-8 text-primary font-display text-sm uppercase tracking-widest"
            >
              <Flame className="w-4 h-4" />
              Elite Esports Platform — Rise Through Battle
            </motion.div>

            <h1 className="font-display font-black text-7xl md:text-9xl lg:text-[11rem] mb-6 tracking-tighter leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-400 to-primary glow-text-red">CZARION</span>
              <br />
              <span className="text-white/90">HUB</span>
            </h1>
            <p className="font-display text-xl md:text-2xl lg:text-3xl text-white/70 font-semibold tracking-[0.3em] uppercase mb-14">
              Rise Through Battle
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link href="/tournaments">
                <Button size="lg" className="h-14 px-10 text-base font-display uppercase tracking-widest font-bold animate-pulse-neon rounded-none w-full sm:w-auto group">
                  Find a Match
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/tournaments">
                <Button size="lg" variant="outline" className="h-14 px-10 text-base font-display uppercase tracking-widest font-bold border-2 border-white/20 hover:border-white/60 hover:bg-white/5 transition-all rounded-none w-full sm:w-auto">
                  Browse Tournaments
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/40 bg-card/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,0,60,0.04),transparent)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30">
            <StatItem
              icon={Trophy}
              value={statsLoading ? null : stats?.totalTournaments}
              label="Tournaments"
            />
            <StatItem
              icon={Users}
              value={statsLoading ? null : stats?.totalPlayers}
              label="Players"
            />
            <StatItem
              icon={Crosshair}
              value={statsLoading ? null : stats?.totalPrizePool}
              label="Prize Awarded"
              isText
            />
            <StatItem
              icon={Gamepad2}
              value={statsLoading ? null : stats?.activeTournaments}
              label="Live Now"
              highlight
            />
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="py-10 bg-background border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16 text-muted-foreground">
            {[
              { icon: Shield, text: "Verified Organisers" },
              { icon: Zap, text: "Instant Room Details" },
              { icon: Trophy, text: "Tracked Leaderboards" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display text-sm uppercase tracking-widest font-semibold group-hover:text-foreground transition-colors">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
            <div>
              <p className="text-primary font-display uppercase tracking-widest text-sm mb-2">Hot Matches</p>
              <h2 className="font-display font-bold text-3xl md:text-4xl uppercase tracking-wider">Featured <span className="text-primary">Battles</span></h2>
            </div>
            <Link href="/tournaments">
              <Button variant="ghost" className="font-display uppercase tracking-wider group text-muted-foreground hover:text-primary">
                View All Tournaments
                <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] w-full rounded-none" />)}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 3).map((tournament, idx) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                >
                  <TournamentCard tournament={tournament} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/50 border border-border/50">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <h3 className="font-display text-xl font-bold uppercase tracking-wider mb-2">No Active Matches</h3>
              <p className="text-muted-foreground text-sm mb-6">Check back soon for elite tournaments.</p>
              <Link href="/organiser">
                <Button variant="outline" className="font-display uppercase tracking-wider rounded-none">Host a Tournament</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Games Showcase */}
      <section className="py-20 bg-card/40 border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-primary font-display uppercase tracking-widest text-sm mb-2">Multi-Game Platform</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl uppercase tracking-wider mb-3">Supported <span className="text-primary">Titles</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">Compete in the most popular mobile esports titles — all under one roof.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {GAMES.map((game, i) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <Link href={`/tournaments?game=${encodeURIComponent(game.name)}`}>
                  <div className={`bg-gradient-to-b ${game.color} border border-border hover:border-primary/50 p-5 flex flex-col items-center justify-center gap-3 text-center group cursor-pointer transition-all h-full`}>
                    <div className="text-4xl mb-1">{game.icon}</div>
                    <h3 className="font-display font-bold uppercase tracking-wider text-xs group-hover:text-primary transition-colors leading-tight">{game.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden border-t border-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,0,60,0.12),transparent_70%)]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display font-black text-4xl md:text-6xl uppercase tracking-wider mb-6 glow-text-red">
              Ready to Rise?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-base">
              Join thousands of players competing in CZARION HUB's elite esports arena. Prove your dominance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-12 font-display uppercase tracking-widest font-bold animate-pulse-neon rounded-none w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
              <a href="https://discord.gg/rYnkNU8xnx" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="h-14 px-12 font-display uppercase tracking-widest rounded-none w-full sm:w-auto border-[#5865F2]/50 text-[#5865F2] hover:bg-[#5865F2]/10 hover:border-[#5865F2]">
                  Join Discord
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}

function StatItem({ icon: Icon, value, label, isText = false, highlight = false }: {
  icon: React.ElementType;
  value: number | string | null | undefined;
  label: string;
  isText?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-card group hover:bg-card/80 transition-colors ${highlight ? 'bg-primary/5' : ''}`}>
      <Icon className={`w-6 h-6 mb-4 ${highlight ? 'text-primary' : 'text-muted-foreground'} group-hover:text-primary transition-colors`} />
      <div className={`font-display font-black text-3xl md:text-4xl mb-2 ${highlight ? 'text-primary glow-text-red' : 'text-white'}`}>
        {value === null || value === undefined ? (
          <Skeleton className="h-10 w-20 mx-auto" />
        ) : isText ? (
          <span>{value}</span>
        ) : (
          <span>{typeof value === 'number' ? value.toLocaleString() : value}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{label}</p>
    </div>
  );
}
