"use client";

import {
  Activity,
  BarChart3,
  Boxes,
  BrainCircuit,
  Building2,
  Check,
  ChevronDown,
  Command,
  LayoutDashboard,
  Network,
  RadioTower,
  ScrollText,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { useWorkspace, type WorkspaceSelection } from "@/components/workspace-provider";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationGroups: Array<{
  label: string;
  items: NavigationItem[];
}> = [
  {
    label: "Command",
    items: [{ label: "Overview", href: "/", icon: Command }],
  },
  {
    label: "Operations",
    items: [
      { label: "SRE workspace", href: "/sre", icon: Activity },
      { label: "SOC workspace", href: "/soc", icon: ShieldCheck },
      { label: "Incidents", href: "/incidents", icon: RadioTower },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "AI analyst", href: "/ai", icon: BrainCircuit },
      { label: "Automations", href: "/automations", icon: Workflow },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Infrastructure", href: "/infrastructure", icon: Network },
      { label: "Audit trail", href: "/audit", icon: ScrollText },
    ],
  },
];

const mobileNavigation = navigationGroups.flatMap((group) => group.items);

function BrandMark() {
  return (
    <div className="flex size-10 items-center justify-center rounded-[14px] bg-brand text-white shadow-[0_10px_30px_rgba(11,128,111,0.32)]">
      <Boxes aria-hidden="true" className="size-5" strokeWidth={2.2} />
    </div>
  );
}

function SidebarLink({ item }: { item: NavigationItem }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-white/10 text-white"
          : "text-nav-muted hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon
        aria-hidden="true"
        className={`size-[18px] ${active ? "text-[#62e0c8]" : "text-current"}`}
      />
      <span>{item.label}</span>
      {active ? (
        <span className="ml-auto size-1.5 rounded-full bg-[#62e0c8]" />
      ) : null}
    </Link>
  );
}

function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const {
    selection,
    selectWorkspace,
    organizations,
    selectedOrganization,
  } = useWorkspace();
  const [open, setOpen] = useState(false);
  const currentLabel = selectedOrganization?.shortName ?? "Portfolio overview";

  function chooseWorkspace(nextSelection: WorkspaceSelection) {
    selectWorkspace(nextSelection);
    setOpen(false);
  }

  return (
    <div className={`relative ${compact ? "lg:hidden" : "hidden lg:block"}`}>
      <button
        type="button"
        className={
          compact
            ? "flex size-9 items-center justify-center rounded-xl border border-line bg-surface text-brand shadow-sm"
            : "flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2 text-left shadow-sm transition hover:border-[#bdcdd1]"
        }
        aria-label={compact ? `Current workspace: ${currentLabel}` : "Current workspace"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          className={`flex items-center justify-center bg-brand-soft text-brand-strong ${
            compact ? "size-7 rounded-lg" : "size-8 rounded-lg"
          }`}
        >
          {selection === "portfolio" ? (
            <LayoutDashboard aria-hidden="true" className="size-4" />
          ) : (
            <Building2 aria-hidden="true" className="size-4" />
          )}
        </span>
        {!compact ? (
          <>
            <span className="min-w-36">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                {selection === "portfolio" ? "MSP command" : "Tenant workspace"}
              </span>
              <span className="block text-sm font-semibold text-ink">{currentLabel}</span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`size-4 text-muted transition ${open ? "rotate-180" : ""}`}
            />
          </>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-[0_24px_70px_rgba(7,25,35,0.2)] lg:left-0 lg:right-auto">
          <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            Switch workspace
          </p>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#f2f7f7]"
            onClick={() => chooseWorkspace("portfolio")}
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-white">
              <LayoutDashboard aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">Portfolio overview</span>
              <span className="block text-xs text-muted">All authorised organisations</span>
            </span>
            {selection === "portfolio" ? (
              <Check aria-hidden="true" className="size-4 text-brand" />
            ) : null}
          </button>

          <div className="my-1 border-t border-line" />
          {organizations.map((organization) => (
            <button
              key={organization.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#f2f7f7]"
              onClick={() => chooseWorkspace(organization.id)}
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-xs font-bold text-brand-strong">
                {organization.shortName
                  .split(" ")
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {organization.shortName}
                </span>
                <span className="block text-xs capitalize text-muted">
                  {organization.industry.toLowerCase().replaceAll("_", " ")}
                </span>
              </span>
              {selection === organization.id ? (
                <Check aria-hidden="true" className="size-4 text-brand" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-white/5 bg-nav px-5 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-3 px-2">
          <BrandMark />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-[-0.02em] text-white">
                TrustOps
              </span>
              <span className="rounded-md bg-[#123442] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.18em] text-[#7fe8d2]">
                AI
              </span>
            </div>
            <p className="text-[11px] text-nav-muted">Digital resilience cloud</p>
          </div>
        </Link>

        <nav className="mt-9 flex-1 space-y-6" aria-label="Primary navigation">
          {navigationGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#59717d]">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="rounded-2xl border border-white/8 bg-white/[0.045] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <span className="signal-dot size-2 rounded-full bg-[#48d7bb]" />
            Foundation online
          </div>
          <p className="mt-2 text-xs leading-5 text-nav-muted">
            Local demonstration environment. No customer data connected.
          </p>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3 lg:hidden">
              <BrandMark />
              <span className="font-semibold tracking-[-0.02em] text-ink">
                TrustOps AI
              </span>
            </Link>

            <WorkspaceSwitcher />

            <div className="flex items-center gap-3">
              <WorkspaceSwitcher compact />
              <div className="hidden items-center gap-2 rounded-full border border-[#cbe7df] bg-[#e7f7f2] px-3 py-1.5 text-xs font-semibold text-brand-strong sm:flex">
                <span className="signal-dot size-1.5 rounded-full bg-brand" />
                Demo environment
              </div>
              <div className="flex size-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                HP
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-nav/95 p-2 shadow-[0_18px_60px_rgba(7,25,35,0.28)] backdrop-blur-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        {mobileNavigation.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition ${
                active ? "bg-white/10 text-white" : "text-nav-muted"
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`size-[18px] ${active ? "text-[#62e0c8]" : ""}`}
              />
              <span className="whitespace-nowrap">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
