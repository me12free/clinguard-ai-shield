import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ScanLine, Sparkles, Wand2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import heroBg from "@/assets/hero-bg.jpg";

type SplashScreen = {
  step: string;
  stepNum: string;
  title: string;
  subtitle: string;
  snippet: string;
  Icon: LucideIcon;
};

const SPLASH_SCREENS: SplashScreen[] = [
  {
    step: "Find",
    stepNum: "01",
    title: "We spot what shouldn’t travel",
    subtitle: "Names, dates, phone numbers, and record IDs are highlighted before anything leaves your workspace.",
    snippet: "“Patient follow-up: Jane Doe, MRN 889021, last visit 4/12…”",
    Icon: ScanLine,
  },
  {
    step: "Shield",
    stepNum: "02",
    title: "Private details stay private",
    subtitle:
      "That information is protected so the AI only sees what is safe to share. Your team keeps context locally.",
    snippet: "Your question goes out with personal details removed, so you can still ask for help with the case.",
    Icon: Wand2,
  },
  {
    step: "Answer",
    stepNum: "03",
    title: "Clear help for real workflows",
    subtitle: "You get plain-language suggestions and next steps you can use in rounds, notes, and follow-ups.",
    snippet: "“Consider monitoring blood pressure and adjusting medication per your hospital protocol…”",
    Icon: Sparkles,
  },
];

export default function HeroSection() {
  const [activeSplash, setActiveSplash] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const id = window.setInterval(() => {
      setActiveSplash((i) => (i + 1) % SPLASH_SCREENS.length);
    }, 5200);

    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="relative border-b border-border/60 bg-background">
      {/* Background: single photo wash and quiet radial */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.06]"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
        <div
          className="absolute -right-[20%] top-0 h-[min(520px,70vh)] w-[min(520px,55vw)] rounded-full bg-primary/[0.06] blur-[120px]"
        />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 pt-28 pb-20 sm:px-6 sm:pt-32 sm:pb-28 lg:px-8 lg:pt-36 lg:pb-32">
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* Copy */}
          <div className="lg:col-span-6 xl:col-span-5">
            <div className="motion-safe:animate-hero-rise mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
              <h1 className="font-serif text-[2.125rem] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.06]">
                Use AI with confidence
                <br />
                <span className="text-primary">without risking patient privacy.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-md text-[15px] leading-[1.65] text-foreground/65 sm:text-base lg:mx-0 lg:max-w-[28rem]">
                ClinGuard helps your team draft and explore ideas with AI while sensitive patient information is caught and
                protected before it is shared. Stay focused on care, not on what might leak through.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="h-11 rounded-lg px-7 text-[15px] font-semibold shadow-sm"
                  asChild
                >
                  <Link to="/register">
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4 opacity-90" strokeWidth={2} />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 rounded-lg border-border bg-background px-7 text-[15px] font-medium text-foreground hover:bg-muted/50"
                  asChild
                >
                  <a href="#features">View product</a>
                </Button>
              </div>

              <p className="mx-auto mt-12 max-w-md border-t border-border/80 pt-8 text-center text-[13px] leading-relaxed text-foreground/55 lg:mx-0 lg:max-w-none lg:text-left">
                <span className="text-foreground/90">Privacy-first design</span>
                <span className="mx-2 text-border">·</span>
                Built for hospitals &amp; clinics
                <span className="mx-2 text-border">·</span>
                Accountable access
              </p>
            </div>
          </div>

          {/* Product frame */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="motion-safe:animate-hero-fade-in mx-auto w-full max-w-[440px] lg:ml-auto lg:mr-0 lg:max-w-none">
              <div className="overflow-hidden rounded-2xl border border-border/90 bg-card shadow-[0_24px_48px_-12px_hsl(0_0%_0%_/_0.12),0_0_0_1px_hsl(var(--border)_/_0.5)]">
                <div className="flex items-center gap-3 border-b border-border/80 bg-muted/40 px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-border" />
                    <span className="h-2 w-2 rounded-full bg-border" />
                    <span className="h-2 w-2 rounded-full bg-border" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-foreground/45">
                    clinguard.com
                  </p>
                </div>

                <div className="relative min-h-[292px] bg-gradient-to-b from-background to-muted/20">
                  {SPLASH_SCREENS.map((screen, i) => {
                    const isActive = i === activeSplash;
                    return (
                      <div
                        key={screen.step}
                        className={cn(
                          "absolute inset-0 flex flex-col p-6 transition-opacity duration-500 ease-out motion-reduce:transition-none sm:p-7",
                          isActive ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"
                        )}
                        aria-hidden={!isActive}
                      >
                        <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/50">
                              {screen.step}
                            </p>
                            <p className="mt-1 font-mono text-xs tabular-nums text-foreground/70">{screen.stepNum}</p>
                          </div>
                          <screen.Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                        </div>
                        <div className="mt-5">
                          <h3 className="text-lg font-semibold tracking-tight text-foreground">{screen.title}</h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-foreground/60">{screen.subtitle}</p>
                        </div>
                        <div className="mt-5 rounded-lg border border-border/70 bg-muted/30 p-3.5 font-mono text-[11px] leading-relaxed text-foreground/90">
                          {screen.snippet}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border/60 bg-muted/20 px-4 py-3">
                  {SPLASH_SCREENS.map((s, i) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => setActiveSplash(i)}
                      className={cn(
                        "min-h-[36px] min-w-[36px] rounded-md border px-2.5 py-1.5 text-center text-[11px] font-medium transition-colors",
                        i === activeSplash
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-transparent text-foreground/45 hover:border-border hover:bg-background hover:text-foreground/80"
                      )}
                      aria-label={`${s.step}: ${s.title}`}
                      aria-pressed={i === activeSplash}
                    >
                      {s.stepNum}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
