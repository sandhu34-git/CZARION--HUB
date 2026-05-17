import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Tournaments from "@/pages/tournaments";
import TournamentDetails from "@/pages/tournament-details";
import TournamentRegister from "@/pages/tournament-register";
import Dashboard from "@/pages/dashboard";
import OrganiserDashboard from "@/pages/organiser";
import OrganiserCreate from "@/pages/organiser-create";
import OrganiserTournament from "@/pages/organiser-tournament";
import Leaderboard from "@/pages/leaderboard";
import Results from "@/pages/results";
import PlayerPortfolio from "@/pages/player";
import Standings from "@/pages/standings";
import Shop from "@/pages/shop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(346, 100%, 50%)",
    colorForeground: "hsl(0, 0%, 98%)",
    colorMutedForeground: "hsl(0, 0%, 65%)",
    colorBackground: "hsl(0, 0%, 4%)",
    colorInput: "hsl(0, 0%, 15%)",
    colorInputForeground: "hsl(0, 0%, 98%)",
    colorDanger: "hsl(0, 84%, 60%)",
    colorNeutral: "hsl(0, 0%, 15%)",
    fontFamily: "'Rajdhani', sans-serif",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-background border border-border rounded-lg w-[440px] max-w-full overflow-hidden glow-red",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-display uppercase tracking-wider text-2xl font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-semibold uppercase",
    formFieldLabel: "text-foreground font-semibold uppercase tracking-wider",
    footerActionLink: "text-primary hover:text-primary/80 font-bold",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-green-500",
    alertText: "text-foreground",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-16 w-16",
    socialButtonsBlockButton: "border-border hover:bg-secondary transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 font-display uppercase font-bold tracking-widest animate-pulse-neon rounded-none",
    formFieldInput: "bg-input border-border text-foreground focus:ring-primary focus:border-primary",
    footerAction: "bg-transparent",
    dividerLine: "bg-border",
    alert: "bg-destructive/20 border-destructive/50 text-destructive-foreground",
    otpCodeFieldInput: "border-border text-foreground focus:border-primary",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClientLocal = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryClientLocal.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClientLocal]);
  return null;
}

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 bg-background relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 bg-background relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "ENTER THE ARENA",
            subtitle: "Sign in to access your squad",
          },
        },
        signUp: {
          start: {
            title: "JOIN THE BATTLE",
            subtitle: "Create your profile to rise through ranks",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />

          <Route path="/tournaments" component={Tournaments} />
          <Route path="/tournaments/:id" component={TournamentDetails} />
          <Route path="/tournaments/:id/register" component={() => <ProtectedRoute component={TournamentRegister} />} />

          <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/organiser" component={() => <ProtectedRoute component={OrganiserDashboard} />} />
          <Route path="/organiser/create" component={() => <ProtectedRoute component={OrganiserCreate} />} />
          <Route path="/organiser/tournament/:id" component={() => <ProtectedRoute component={OrganiserTournament} />} />

          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/results" component={Results} />
          <Route path="/standings" component={Standings} />
          <Route path="/shop" component={Shop} />
          <Route path="/player/:clerkId" component={PlayerPortfolio} />

          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
