import { Tournament } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Coins, Ticket, Clock, Trophy, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { formatDistanceToNow, isPast, parseISO } from "date-fns";

function useCountdownLabel(matchDate: string | null | undefined, status: string) {
  return useMemo(() => {
    if (!matchDate || status === "completed") return status === "completed" ? "Ended" : "TBA";
    try {
      const date = parseISO(matchDate);
      if (isPast(date)) return "Started";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "TBA";
    }
  }, [matchDate, status]);
}

const GAME_STYLES: Record<string, string> = {
  "free fire": "bg-orange-500/15 text-orange-400 border-orange-500/40",
  "bgmi": "bg-yellow-500/15 text-yellow-400 border-yellow-500/40",
  "valorant": "bg-red-500/15 text-red-400 border-red-500/40",
  "cod mobile": "bg-slate-500/15 text-slate-300 border-slate-500/40",
  "clash squad": "bg-primary/15 text-primary border-primary/40",
  "custom scrims": "bg-purple-500/15 text-purple-400 border-purple-500/40",
};

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const timeLabel = useCountdownLabel(tournament.matchDate, tournament.status);
  const gameStyle = GAME_STYLES[tournament.game?.toLowerCase()] ?? "bg-primary/15 text-primary border-primary/40";
  const isFull = (tournament.filledSlots ?? 0) >= (tournament.totalSlots ?? 0);
  const fillPercent = tournament.totalSlots
    ? Math.round(((tournament.filledSlots ?? 0) / tournament.totalSlots) * 100)
    : 0;

  return (
    <div className="group bg-card border border-border hover:border-primary/60 transition-all duration-300 overflow-hidden flex flex-col h-full hover:shadow-[0_0_20px_rgba(255,0,60,0.08)]">
      {/* Banner */}
      <div className="h-44 bg-secondary relative overflow-hidden">
        {tournament.bannerUrl ? (
          <img
            src={tournament.bannerUrl}
            alt={tournament.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center group-hover:opacity-80 transition-opacity">
            <Trophy className="w-14 h-14 text-primary/20 group-hover:text-primary/30 transition-colors" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

        {/* Status and Game badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {tournament.status === "live" && (
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary font-display uppercase tracking-wider text-[10px] animate-pulse px-2 py-0.5">
              ● Live
            </Badge>
          )}
          {tournament.status === "upcoming" && (
            <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 font-display uppercase tracking-wider text-[10px] px-2 py-0.5">
              Upcoming
            </Badge>
          )}
          {tournament.status === "completed" && (
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-display uppercase tracking-wider text-[10px] px-2 py-0.5">
              Completed
            </Badge>
          )}
          <Badge variant="outline" className={`${gameStyle} font-display uppercase tracking-wider text-[10px] px-2 py-0.5`}>
            {tournament.game}
          </Badge>
        </div>

        {/* Verified badge */}
        {tournament.isVerifiedOrganiser && (
          <div className="absolute top-3 right-3" title="Verified Organiser">
            <ShieldCheck className="w-5 h-5 text-blue-400 drop-shadow-md" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display text-base font-bold uppercase tracking-wider mb-1 line-clamp-1 group-hover:text-primary transition-colors duration-200">
          {tournament.name}
        </h3>
        <p className="text-xs text-muted-foreground mb-4 truncate">by {tournament.organiserId}</p>

        {/* Slot progress bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Slots</span>
            <span className="text-xs font-display font-bold text-muted-foreground">
              {tournament.filledSlots}/{tournament.totalSlots}
              {isFull && <span className="text-destructive ml-1 text-[10px]">FULL</span>}
            </span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${fillPercent >= 100 ? 'bg-destructive' : fillPercent >= 75 ? 'bg-yellow-500' : 'bg-primary'}`}
              style={{ width: `${Math.min(fillPercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
          <InfoItem icon={Coins} label="Prize" value={tournament.prizePool} />
          <InfoItem icon={Ticket} label="Entry" value={
            tournament.entryFee === "0" || tournament.entryFee?.toLowerCase() === "free" ? "Free" : (tournament.entryFee ?? "Free")
          } />
          <InfoItem icon={Clock} label="Starts" value={timeLabel} small />
          <InfoItem icon={Users} label="Slots" value={`${tournament.filledSlots}/${tournament.totalSlots}`} />
        </div>

        <Link href={`/tournaments/${tournament.id}`}>
          <Button
            className={`w-full font-display uppercase tracking-widest font-bold rounded-none transition-all ${tournament.status === 'live'
              ? 'animate-pulse-neon'
              : 'bg-secondary hover:bg-primary text-foreground hover:text-white'
            }`}
            variant={tournament.status === 'live' ? 'default' : 'secondary'}
          >
            {tournament.status === 'completed' ? 'View Results' : isFull ? 'View (Full)' : 'View & Register'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, small }: {
  icon: React.ElementType;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
      <div className="flex flex-col leading-none min-w-0">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">{label}</span>
        <span className={`font-display font-bold truncate ${small ? 'text-xs' : 'text-sm'}`}>{value}</span>
      </div>
    </div>
  );
}
