import { ReactNode, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Clock, Coffee, ShieldCheck, LayoutDashboard, ArrowRight, ChevronDown } from "lucide-react";
import { MarketingLayout } from "@/layouts/MarketingLayout";

const FEATURES = [
  {
    icon: Clock,
    title: "Simple Clock In/Out",
    description: "One tap to start or end your shift. No spreadsheets, no guesswork.",
  },
  {
    icon: Coffee,
    title: "Automatic Break Tracking",
    description: "Start and end breaks with a click — your worked time updates live.",
  },
  {
    icon: ShieldCheck,
    title: "Auto-Close Protection",
    description:
      "Shifts that run too long close automatically and prompt a quick correction, so records stay accurate.",
  },
  {
    icon: LayoutDashboard,
    title: "Admin Dashboard & Exports",
    description:
      "Managers can review every employee's hours, approve corrections, and export records in a click.",
  },
];

const STEPS = [
  {
    title: "Create your account",
    description: "Register and verify your email address to get started.",
  },
  {
    title: "Clock in when you start",
    description: "Your shift begins tracking the moment you tap Clock In.",
  },
  {
    title: "Take breaks as needed",
    description: "Start and end breaks without losing track of your hours.",
  },
  {
    title: "Clock out and review",
    description: "See your worked hours on your dashboard, anytime.",
  },
];

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 28 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const gridY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 120]);
  const blobY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -70]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : 40]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, shouldReduceMotion ? 1 : 0]);

  return (
    <section ref={heroRef} className="relative -top-10 flex min-h-dvh flex-col items-center justify-center overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          y: gridY,
          backgroundImage:
            "linear-gradient(to right, var(--color-line) 1px, transparent 1px), linear-gradient(to bottom, var(--color-line) 1px, transparent 1px), radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--color-brand) 16%, transparent) 0%, transparent 60%)",
          backgroundSize: "48px 48px, 48px 48px, 100% 100%",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[8%] h-72 w-72 rounded-full blur-3xl"
        style={{
          y: blobY,
          backgroundColor: "color-mix(in srgb, var(--color-brand) 22%, transparent)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-10 left-[6%] h-56 w-56 rounded-full blur-3xl"
        style={{
          y: gridY,
          backgroundColor: "color-mix(in srgb, var(--color-brand) 12%, transparent)",
        }}
      />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6"
      >
        <motion.h1
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-display text-4xl font-bold text-ink sm:text-5xl"
        >
          Time tracking that stays out of your way
        </motion.h1>
        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="mx-auto mt-4 max-w-xl text-base text-ink-soft sm:text-lg"
        >
          Clock in, take breaks, and clock out in seconds. TimeTrack keeps accurate records for
          you and your team, automatically.
        </motion.p>
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 18 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-brand w-60"
          >
            Get Started
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-6 py-3 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-surface focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-brand w-60"
          >
            Log In
          </Link>
        </motion.div>
      </motion.div>

      <motion.div style={{ opacity: contentOpacity }} className="absolute bottom-16 left-1/2 -translate-x-1/2">
        <motion.button
          type="button"
          onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
          animate={shouldReduceMotion ? undefined : { y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
          transition={shouldReduceMotion ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-ink-soft outline-none transition-colors hover:text-ink focus-visible:text-ink"
        >
          <span className="text-xs font-semibold tracking-[0.2em]">SCROLL DOWN</span>
          <ChevronDown size={20} />
        </motion.button>
      </motion.div>
    </section>
  );
}

function CtaBackground() {
  const ref = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const glowY = useTransform(scrollYProgress, [0, 1], [shouldReduceMotion ? 0 : 60, shouldReduceMotion ? 0 : -60]);

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-line bg-card py-16 text-center">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          y: glowY,
          backgroundImage:
            "radial-gradient(circle at 50% 100%, color-mix(in srgb, var(--color-brand) 14%, transparent) 0%, transparent 60%)",
        }}
      />
      <Reveal className="relative mx-auto max-w-xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-ink">Ready to get started?</h2>
        <p className="mt-3 text-sm text-ink-soft">
          Create your account in under a minute and clock in for your first shift today.
        </p>
        <Link
          to="/register"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Get Started
          <ArrowRight size={16} />
        </Link>
      </Reveal>
    </section>
  );
}

export function Landing() {
  return (
    <MarketingLayout>
      <Hero />

      <section id="features" className="border-t border-line bg-card py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
              Everything you need, nothing you don't
            </h2>
            <p className="mt-3 text-sm text-ink-soft">
              Built for employees who just want to track time, and admins who need to trust it.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.08}>
                <div className="h-full rounded-2xl border border-line bg-surface p-6 transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-idle-bg text-brand">
                    <feature.icon size={20} />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{feature.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">How it works</h2>
            <p className="mt-3 text-sm text-ink-soft">
              From sign-up to your first clock-out, in four simple steps.
            </p>
          </Reveal>

          <div className="mt-12 space-y-6">
            {STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 0.1} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{step.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBackground />
    </MarketingLayout>
  );
}