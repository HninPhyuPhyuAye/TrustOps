import { ArrowRight, CheckCircle2, type LucideIcon } from "lucide-react";

type CapabilityPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  task: string;
  capabilities: string[];
};

export function CapabilityPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  task,
  capabilities,
}: CapabilityPageProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_18px_55px_rgba(29,58,68,0.07)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_320px] lg:p-10">
          <div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
              <Icon aria-hidden="true" className="size-6" />
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-brand">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              {description}
            </p>
          </div>

          <div className="rounded-2xl border border-[#cce7e0] bg-[#ecf8f5] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
              Delivery status
            </p>
            <p className="mt-3 text-lg font-semibold text-ink">Foundation ready</p>
            <p className="mt-2 text-sm leading-6 text-muted">Scheduled for {task}.</p>
            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-brand-strong">
              Implementation follows the roadmap
              <ArrowRight aria-hidden="true" className="size-4" />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-line bg-surface p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
          Planned capability
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {capabilities.map((capability) => (
            <div
              key={capability}
              className="flex items-start gap-3 rounded-2xl border border-line bg-[#f8fafb] p-4"
            >
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-brand"
              />
              <span className="text-sm font-medium leading-6 text-foreground">
                {capability}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
