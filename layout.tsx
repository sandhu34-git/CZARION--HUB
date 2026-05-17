import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Show, useClerk, useUser } from "@clerk/react";
import { Menu, X, Trophy, Swords, Medal, LogOut, LayoutDashboard, Settings, TrendingUp, ShoppingBag, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      <Navbar />
      <main className="flex-1 flex flex-col pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Home", icon: Trophy },
    { href: "/tournaments", label: "Tournaments", icon: Swords },
    { href: "/standings", label: "Standings", icon: TrendingUp },
    { href: "/leaderboard", label: "Leaderboard", icon: Medal },
    { href: "/results", label: "Results", icon: Trophy },
    { href: "/shop", label: "Shop", icon: ShoppingBag },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="w-8 h-8 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,0,60,0.8)]" />
          <span className="font-display font-black text-xl tracking-widest text-white group-hover:text-primary transition-colors">
            CZARION<span className="text-primary group-hover:text-white">HUB</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-display uppercase tracking-widest text-xs font-semibold transition-all hover:text-primary hover:glow-text-red flex items-center gap-1.5 ${location === link.href ? 'text-primary glow-text-red' : 'text-muted-foreground'}`}
            >
              {link.href === "/shop" && <Coins className="w-3 h-3 text-yellow-400" />}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Show when="signed-out">
            <Button variant="ghost" className="font-display uppercase tracking-wider" onClick={() => setLocation("/sign-in")}>Sign In</Button>
            <Button className="font-display uppercase tracking-wider font-bold animate-pulse-neon rounded-none" onClick={() => setLocation("/sign-up")}>Join Now</Button>
          </Show>
          <Show when="signed-in">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary/50 hover:border-primary transition-colors p-0 overflow-hidden">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={user?.imageUrl} alt={user?.username || ""} />
                    <AvatarFallback className="bg-secondary text-primary font-display font-bold">
                      {user?.username?.substring(0, 2).toUpperCase() || "OP"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-border neon-border rounded-none">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-display font-medium text-primary">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="cursor-pointer font-display uppercase tracking-wider focus:bg-secondary focus:text-primary" onClick={() => setLocation("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-display uppercase tracking-wider focus:bg-secondary focus:text-primary" onClick={() => setLocation("/organiser")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Organiser Panel</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-display uppercase tracking-wider focus:bg-secondary focus:text-primary text-yellow-400 focus:text-yellow-400" onClick={() => setLocation("/shop")}>
                  <Coins className="mr-2 h-4 w-4" />
                  <span>CZ Coins Shop</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="cursor-pointer font-display uppercase tracking-wider text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => signOut({ redirectUrl: "/" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Show>
        </div>

        <button className="md:hidden text-foreground hover:text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-border bg-card overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 font-display uppercase tracking-widest p-2 rounded-sm text-sm ${location === link.href ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className={`w-4 h-4 ${link.href === "/shop" ? "text-yellow-400" : ""}`} />
                  {link.label}
                  {link.href === "/shop" && <span className="ml-auto text-[9px] text-yellow-400 uppercase tracking-wider">CZ Coins</span>}
                </Link>
              ))}

              <div className="h-px bg-border my-1" />

              <Show when="signed-out">
                <Button variant="outline" className="w-full justify-start font-display uppercase tracking-wider" onClick={() => { setLocation("/sign-in"); setMobileMenuOpen(false); }}>Sign In</Button>
                <Button className="w-full justify-start font-display uppercase tracking-wider" onClick={() => { setLocation("/sign-up"); setMobileMenuOpen(false); }}>Join Now</Button>
              </Show>
              <Show when="signed-in">
                <Button variant="ghost" className="w-full justify-start font-display uppercase tracking-wider" onClick={() => { setLocation("/dashboard"); setMobileMenuOpen(false); }}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start font-display uppercase tracking-wider" onClick={() => { setLocation("/organiser"); setMobileMenuOpen(false); }}>
                  <Settings className="mr-2 h-4 w-4" /> Organiser Panel
                </Button>
                <Button variant="ghost" className="w-full justify-start font-display uppercase tracking-wider text-yellow-400 hover:text-yellow-400 hover:bg-yellow-500/10" onClick={() => { setLocation("/shop"); setMobileMenuOpen(false); }}>
                  <Coins className="mr-2 h-4 w-4" /> CZ Coins Shop
                </Button>
                <Button variant="ghost" className="w-full justify-start font-display uppercase tracking-wider text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { signOut({ redirectUrl: "/" }); setMobileMenuOpen(false); }}>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </Button>
              </Show>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="w-6 h-6" />
              <span className="font-display font-black text-lg tracking-widest text-white">
                CZARION<span className="text-primary">HUB</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              The elite esports arena for competitive mobile gaming squads. Rise through battle, claim the prize, and cement your legacy.
            </p>
            <div className="flex gap-4">
              <a href="https://youtube.com/@czarion_playz?si=4HBIcJTCzcAg_TEz" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
              <a href="https://discord.gg/rYnkNU8xnx" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-[#5865F2] hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16.5c0 1.5-1 3-3 3h-1.5L15 22.5v-3h-3c-2 0-3-1.5-3-3V7.5c0-1.5 1-3 3-3h9c2 0 3 1.5 3 3v9z"></path><path d="M9 13.5v-3"></path><path d="M15 13.5v-3"></path></svg>
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-display uppercase tracking-widest font-bold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><Link href="/tournaments" className="text-muted-foreground hover:text-primary transition-colors text-sm">Tournaments</Link></li>
              <li><Link href="/standings" className="text-muted-foreground hover:text-primary transition-colors text-sm">Live Standings</Link></li>
              <li><Link href="/leaderboard" className="text-muted-foreground hover:text-primary transition-colors text-sm">Leaderboard</Link></li>
              <li><Link href="/results" className="text-muted-foreground hover:text-primary transition-colors text-sm">Match Results</Link></li>
              <li><Link href="/shop" className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm flex items-center gap-1"><Coins className="w-3 h-3" /> CZ Coins Shop</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-display uppercase tracking-widest font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm">Fair Play Rules</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CZARION HUB. All rights reserved.</p>
          <p className="text-xs text-muted-foreground font-display tracking-widest uppercase">Rise Through Battle</p>
        </div>
      </div>
    </footer>
  );
}
