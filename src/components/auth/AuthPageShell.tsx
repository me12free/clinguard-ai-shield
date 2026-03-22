import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import heroBg from "@/assets/hero-bg.jpg";

type AuthPageShellProps = {
  children: React.ReactNode;
  headline: string;
  subheadline: string;
};

/**
 * Split auth layout: hero panel on large screens, centered form on mobile.
 */
export function AuthPageShell({ children, headline, subheadline }: AuthPageShellProps) {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <header className="shrink-0 border-b border-border/70 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60 z-20">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-foreground font-semibold tracking-tight hover:opacity-90 transition-opacity"
          >
            <BrandLogo className="h-9 w-9 rounded-xl shadow-sm ring-1 ring-border/40 bg-card p-0.5" />
            <span className="text-base">ClinGuard</span>
          </Link>
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)] lg:min-h-[calc(100svh-3.5rem)]">
        {/* Desktop: branded panel */}
        <div className="relative hidden lg:flex flex-col justify-end p-10 xl:p-14 overflow-hidden min-h-0">
          <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: `url(${heroBg})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/75 to-primary/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="relative z-10 space-y-5 max-w-lg">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary border border-primary/25 backdrop-blur-sm hover:opacity-90 transition-opacity"
            >
              <BrandLogo className="h-3.5 w-3.5 rounded-sm" />
              Clinical AI Shield
            </Link>
            <h1 className="text-3xl xl:text-[2rem] font-semibold tracking-tight text-foreground leading-tight">{headline}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{subheadline}</p>
          </div>
        </div>

        {/* Form column */}
        <div className="flex flex-1 flex-col items-stretch justify-center px-4 py-8 sm:px-6 sm:py-10 md:py-12 lg:px-8 xl:px-12">
          <div className="w-full max-w-md mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
