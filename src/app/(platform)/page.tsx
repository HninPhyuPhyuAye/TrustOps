import {
  Activity,
  ArrowUpRight,
  Bot,
  Braces,
  CheckCircle2,
  CircleGauge,
  Clock3,
  LockKeyhole,
  Network,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const capabilityCards = [
  {
    title: "SRE operations",
    description: "Service health, SLO burn, telemetry, deployments, and recovery readiness.",
    icon: Activity,
    accent: "bg-[#dff5ef] text-[#087463]",
    status: "Task 5",
  },
  {
    title: "SOC monitoring",
    description: "Identity, asset, vulnerability, posture, and detection investigation.",
    icon: ShieldCheck,
    accent: "bg-[#e5edff] text-[#3d5fa8]",
    status: "Task 6",
  },
  {
    title: "AI investigation",
    description: "Evidence-linked hypotheses, blast radius, runbooks, and uncertainty.",
    icon: Bot,
    accent: "bg-[#eee8ff] text-[#7051a8]",
    status: "Task 7",
  },
  {
    title: "Safe automation",
    description: "Policy checks, human approval, simulated remediation, and verification.",
    icon: Workflow,
    accent: "bg-[#fff0d9] text-[#a55f13]",
    status: "Task 8",
  },
];

const pipeline = [
  { label: "Signals", helper: "Metrics, logs, identity", icon: Braces },
  { label: "Correlation", helper: "One incident graph", icon: Network },
  { label: "Approval", helper: "Human policy gate", icon: LockKeyhole },
  { label: "Verification", helper: "Measured recovery", icon: CheckCircle2 },
];

export default function CommandCentrePage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[30px] bg-ink px-6 py-8 text-white shadow-[0_24px_70px_rgba(7,25,35,0.2)] sm:px-8 sm:py-10 lg:px-10">
        <div className="absolute -right-24 -top-32 size-80 rounded-full border-[54px] border-[#0d806f]/30" />
        <div className="absolute -bottom-48 right-32 size-72 rounded-full bg-[#0b806f]/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-[#a5b8c0]">
            <span className="signal-dot size-1.5 rounded-full bg-[#55ddc2]" />
            FOUNDATION · TASK 2
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
            Digital resilience,
            <span className="block text-[#65ddc6]">one operating picture.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#a5b8c0] sm:text-lg">
            TrustOps unifies reliability and cyber evidence, prepares explainable
            analysis, and keeps consequential automation behind an authorised
            human decision.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {capabilityCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.title}
              className="group rounded-[22px] border border-line bg-surface p-5 shadow-[0_12px_35px_rgba(29,58,68,0.055)] transition hover:-translate-y-0.5 hover:border-[#bdd0d5] hover:shadow-[0_18px_45px_rgba(29,58,68,0.09)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`flex size-10 items-center justify-center rounded-xl ${card.accent}`}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 text-[#9babb1] transition group-hover:text-ink"
                />
              </div>
              <h2 className="mt-5 text-base font-semibold tracking-[-0.025em] text-ink">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">{card.description}</p>
              <div className="mt-5 border-t border-line pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8799a1]">
                Delivery · {card.status}
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-[26px] border border-line bg-surface p-6 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                Operating model
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                Evidence before action
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#eef5f5] px-3 py-1.5 text-xs font-semibold text-muted">
              <CircleGauge aria-hidden="true" className="size-4 text-brand" />
              Safety boundary active
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {pipeline.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.label}
                  className="relative rounded-2xl border border-line bg-[#f7fafb] p-4"
                >
                  <div className="flex items-center justify-between">
                    <Icon aria-hidden="true" className="size-5 text-brand" />
                    <span className="font-mono text-[10px] text-[#91a2a9]">
                      0{index + 1}
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-semibold text-ink">{step.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{step.helper}</p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-[26px] border border-line bg-surface p-6 shadow-[0_12px_35px_rgba(29,58,68,0.05)] sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand">
                Delivery window
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">
                Two-day build
              </h2>
            </div>
            <Clock3 aria-hidden="true" className="size-6 text-[#8da0a8]" />
          </div>

          <div className="mt-7 space-y-3">
            <div className="rounded-2xl bg-ink p-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Day 1 · Visibility</p>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold tracking-[0.14em] text-[#69dec8]">
                  ACTIVE
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#9db1ba]">
                Foundation, tenants, command centre, SRE, and SOC.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-[#f7fafb] p-4">
              <p className="text-sm font-semibold text-ink">Day 2 · Response</p>
              <p className="mt-2 text-xs leading-5 text-muted">
                AI investigation, approvals, automation, infrastructure, and release.
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
