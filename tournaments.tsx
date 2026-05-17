import { Layout } from "@/components/layout";
import { useListTournaments } from "@workspace/api-client-react";
import { TournamentCard } from "@/components/tournament-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function Tournaments() {
  const [game, setGame] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: tournaments, isLoading } = useListTournaments({
    ...(game !== "all" && { game }),
    ...(status !== "all" && { status }),
  });

  const filteredTournaments = tournaments?.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.organiserId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="bg-card border-b border-border py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="font-display font-bold text-4xl md:text-5xl uppercase tracking-widest mb-4">
            Battle <span className="text-primary">Arena</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-8">
            Find the perfect match for your squad. Filter by game, status, and rise through the ranks.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search tournaments or organisers..." 
                className="pl-10 h-12 bg-background border-border focus-visible:ring-primary font-display tracking-wider"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger className="w-[180px] h-12 font-display uppercase tracking-wider bg-background border-border">
                  <SelectValue placeholder="All Games" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  <SelectItem value="Free Fire">Free Fire</SelectItem>
                  <SelectItem value="BGMI">BGMI</SelectItem>
                  <SelectItem value="Valorant">Valorant</SelectItem>
                  <SelectItem value="COD Mobile">COD Mobile</SelectItem>
                  <SelectItem value="Clash Squad">Clash Squad</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px] h-12 font-display uppercase tracking-wider bg-background border-border">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="live">Live Now</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-96 w-full rounded-none" />)}
          </div>
        ) : filteredTournaments && filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament, idx) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <TournamentCard tournament={tournament} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-card/50 border border-border/50">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-display text-2xl font-bold uppercase tracking-wider mb-2">No Matches Found</h3>
            <p className="text-muted-foreground mb-6">No tournaments match your current filters.</p>
            <Button variant="outline" className="font-display uppercase tracking-wider" onClick={() => { setGame("all"); setStatus("all"); setSearch(""); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
